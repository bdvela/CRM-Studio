'use client';

import type { StaffMember, Service, AppointmentInsert } from '@/types/database';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import { generateAppointmentTitle, toLocalISO } from './helpers';
import type { AppointmentFormData, DataAction, UiAction, AppointmentWithDetails } from './types';
import { createAppointment, updateAppointment, checkOverlap, createPayment } from '@/lib/db/queries';
import { DEPOSIT_AMOUNT } from '@/lib/constants';
import { toast } from 'sonner';
import { useConfirm } from '@/context/confirm-context';
import { useRef } from 'react';

interface ServiceData {
  service_id: string;
  artist_id: string | null;
  service_price: number;
}

export function useCitasHandlers(ctx: {
  staff: StaffMember[]; services: Service[]; appointments: AppointmentWithDetails[];
  editingAppt: AppointmentWithDetails | null; selectedServices: string[]; serviceArtists: Record<string, string>;
  customPrices: Record<string, number>; overlapWarning: string | null;
  advancePaid: boolean; submitting: boolean; form: AppointmentFormData;
  selectedAppt: AppointmentWithDetails | null; pendingDate: Date | null;
  listFilter: string; listFilterArtist: string; listFilterStatus: string;
  setForm: React.Dispatch<React.SetStateAction<AppointmentFormData>>;
  setEditingAppt: (v: AppointmentWithDetails | null) => void;
  setSelectedServices: (v: string[]) => void;
  setServiceArtists: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setCustomPrices: (v: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  dispatchData: React.Dispatch<DataAction>; dispatchUi: React.Dispatch<UiAction>;
  confirm: ReturnType<typeof useConfirm>['confirm'];
  load: () => Promise<void>;
  initialFormRef: React.MutableRefObject<AppointmentFormData | null>;
  initialSelectedServicesRef: React.MutableRefObject<string[]>;
  initialServiceArtistsRef: React.MutableRefObject<Record<string, string>>;
  initialCustomPricesRef: React.MutableRefObject<Record<string, number>>;
  initialAdvancePaidRef: React.MutableRefObject<boolean>;
}) {
  const {
    staff, services, appointments, editingAppt, selectedServices, serviceArtists,
    customPrices, overlapWarning, advancePaid, submitting, form, selectedAppt,
    pendingDate, listFilter, listFilterArtist, listFilterStatus,
    setForm, setEditingAppt, setSelectedServices, setServiceArtists, setCustomPrices,
    dispatchData, dispatchUi, confirm, load,
    initialFormRef, initialSelectedServicesRef, initialServiceArtistsRef,
    initialCustomPricesRef, initialAdvancePaidRef,
  } = ctx;

  const overlapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalDuration = services
    .filter((s: Service) => selectedServices.includes(s.id))
    .reduce((sum: number, s: Service) => sum + Number(s.duration_min), 0);

  function calculateTotalPrice(): number {
    return services
      .filter((s: Service) => selectedServices.includes(s.id))
      .reduce((sum: number, s: Service) => {
        if (customPrices[s.id] !== undefined && customPrices[s.id] !== null) {
          return sum + customPrices[s.id];
        }
        const defaultPrice = s.price_type === 'variable'
          ? (s.price_from || 0)
          : (s.price || 0);
        return sum + defaultPrice;
      }, 0);
  }

  function haveChanges(): boolean {
    if (!editingAppt || !initialFormRef.current) return true;
    if (form.client_id !== initialFormRef.current.client_id) return true;
    if (form.start_time !== initialFormRef.current.start_time) return true;
    if (form.status !== initialFormRef.current.status) return true;
    if (form.notes !== initialFormRef.current.notes) return true;
    if (form.color !== initialFormRef.current.color) return true;
    const sortedSelected = selectedServices.toSorted();
    const sortedInitial = initialSelectedServicesRef.current.toSorted();
    if (sortedSelected.length === sortedInitial.length && sortedSelected.every((id, i) => id === sortedInitial[i])) {
      for (const svcId of sortedSelected) {
        if (serviceArtists[svcId] !== initialServiceArtistsRef.current[svcId]) return true;
        if (customPrices[svcId] !== initialCustomPricesRef.current[svcId]) return true;
      }
      return false;
    }
    return true;
  }

  async function checkForOverlap() {
    if (overlapTimeoutRef.current) {
      clearTimeout(overlapTimeoutRef.current);
    }

    return new Promise<void>((resolve) => {
      overlapTimeoutRef.current = setTimeout(async () => {
        if (!form.start_time || totalDuration === 0) {
          dispatchUi({ type: 'SET_OVERLAP_WARNING', overlapWarning: null });
          resolve();
          return;
        }
        const artistIds = selectedServices.flatMap((sid: string) => {
          const id = serviceArtists[sid];
          return id ? [id] : [];
        });
        if (artistIds.length === 0) {
          dispatchUi({ type: 'SET_OVERLAP_WARNING', overlapWarning: null });
          resolve();
          return;
        }
        const start = new Date(form.start_time);
        const end = new Date(start.getTime() + totalDuration * 60000);
        const excludeId = editingAppt?.id || undefined;
        const staffNameMap = new Map(staff.map((s: StaffMember) => [s.id, s.name]));
        const overlapResults = await Promise.all(artistIds.map((artistId: string) =>
          checkOverlap(artistId, start.toISOString(), end.toISOString(), excludeId)
        ));
        for (let i = 0; i < artistIds.length; i++) {
          const overlaps = overlapResults[i];
          if (overlaps.length > 0) {
            const artistName = staffNameMap.get(artistIds[i]) || 'artista';
            dispatchUi({ type: 'SET_OVERLAP_WARNING', overlapWarning: `⚠️ Conflicto con: ${overlaps[0].title} (${artistName})` });
            resolve();
            return;
          }
        }
        dispatchUi({ type: 'SET_OVERLAP_WARNING', overlapWarning: null });
        resolve();
      }, 400);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.client_id || !form.start_time) { toast.error('Selecciona clienta y fecha'); return; }
    if (selectedServices.length === 0) { toast.error('Selecciona al menos un servicio'); return; }
    if (editingAppt && !haveChanges()) { toast.info('No hay cambios para guardar'); return; }
    dispatchData({ type: 'SET_SUBMITTING', submitting: true });
    try {
      const startTime = new Date(form.start_time);
      const endTime = new Date(startTime.getTime() + totalDuration * 60000);
      const calculatedTotalPrice = calculateTotalPrice();
      const servicesData: ServiceData[] = selectedServices.map((sid: string) => {
        const svc = services.find((s: Service) => s.id === sid);
        const price = customPrices[sid] !== undefined
          ? customPrices[sid]
          : svc?.price_type === 'variable' ? (svc.price_from || 0) : (svc?.price || 0);
        return { service_id: sid, artist_id: serviceArtists[sid] || null, service_price: price };
      });
      const firstArtistId = servicesData.find((s) => s.artist_id)?.artist_id || null;
      const apptData: AppointmentInsert & { services: ServiceData[] } = {
        title: generateAppointmentTitle(selectedServices, services),
        client_id: form.client_id || '',
        artist_id: firstArtistId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: form.status,
        total_price: calculatedTotalPrice,
        total_duration_min: totalDuration,
        notes: form.notes || null,
        color: form.color || null,
        overlap_detected: !!overlapWarning,
        services: servicesData,
      };
      if (editingAppt) {
        await updateAppointment(editingAppt.id, apptData);
        toast.success('Cita actualizada');
      } else {
        const newAppt = await createAppointment(apptData);
        if (advancePaid) {
          await createPayment({
            concept: 'Adelanto de cita', amount: DEPOSIT_AMOUNT, type: 'ingreso', category: 'servicio',
            payment_kind: 'reserva', appointment_id: newAppt.id, client_id: form.client_id || null,
          });
        }
        toast.success('Cita creada');
      }
      dispatchUi({ type: 'SET_SHOW_MODAL', showModal: false });
      setEditingAppt(null);
      load();
    } catch (e: unknown) {
      toast.error('Error: ' + ((e as Error).message || 'No se pudo guardar'));
    } finally {
      dispatchData({ type: 'SET_SUBMITTING', submitting: false });
    }
  }

  function openEdit(appt: AppointmentWithDetails) {
    setEditingAppt(appt);
    const formData: AppointmentFormData = {
      client_id: appt.client_id || '',
      start_time: toLocalISO(appt.start_time),
      status: appt.status,
      notes: appt.notes || '',
      color: appt.color || '',
    };
    const svcIds: string[] = [];
    const svcArtistMap: Record<string, string> = {};
    (appt.appointment_services || []).forEach((as) => {
      if (as.service_id) { svcIds.push(as.service_id); if (as.artist_id) svcArtistMap[as.service_id] = as.artist_id; }
    });
    setForm(formData);
    setSelectedServices(svcIds);
    setServiceArtists(svcArtistMap);
    const pricemap: Record<string, number> = {};
    (appt.appointment_services || []).forEach((as) => {
      if (as.service_id && as.service_price != null) pricemap[as.service_id] = Number(as.service_price);
    });
    setCustomPrices(pricemap);
    dispatchUi({ type: 'SET_ADVANCE_PAID', advancePaid: false });
    initialFormRef.current = { ...formData };
    initialSelectedServicesRef.current = [...svcIds];
    initialServiceArtistsRef.current = { ...svcArtistMap };
    initialCustomPricesRef.current = { ...pricemap };
    initialAdvancePaidRef.current = false;
    dispatchUi({ type: 'SET_SHOW_MODAL', showModal: true });
  }

  function openNew() {
    setEditingAppt(null);
    setForm({ client_id: '', start_time: '', status: 'programada', notes: '', color: '' });
    setSelectedServices([]);
    setServiceArtists({});
    setCustomPrices({});
    dispatchUi({ type: 'SET_ADVANCE_PAID', advancePaid: true });
    initialFormRef.current = null;
    initialSelectedServicesRef.current = [];
    initialServiceArtistsRef.current = {};
    initialCustomPricesRef.current = {};
    initialAdvancePaidRef.current = true;
    dispatchUi({ type: 'SET_OVERLAP_WARNING', overlapWarning: null });
    dispatchUi({ type: 'SET_SHOW_MODAL', showModal: true });
  }

  function openNewForDate(date: Date) {
    setEditingAppt(null);
    const timeStr = toLocalISO(date.toISOString());
    setForm({ client_id: '', start_time: timeStr, status: 'programada', notes: '', color: '' });
    setSelectedServices([]);
    setServiceArtists({});
    setCustomPrices({});
    dispatchUi({ type: 'SET_ADVANCE_PAID', advancePaid: true });
    initialFormRef.current = null;
    initialSelectedServicesRef.current = [];
    initialServiceArtistsRef.current = {};
    initialCustomPricesRef.current = {};
    initialAdvancePaidRef.current = true;
    dispatchUi({ type: 'SET_OVERLAP_WARNING', overlapWarning: null });
    dispatchUi({ type: 'SET_SHOW_MODAL', showModal: true });
  }

  async function cancelAppt(appt: AppointmentWithDetails) {
    const confirmed = await confirm({ title: 'Cancelar cita', message: `¿Cancelar la cita "${appt.title}"?`, confirmText: 'Cancelar cita', cancelText: 'No cancelar', variant: 'warning' });
    if (!confirmed) return;
    try { await updateAppointment(appt.id, { status: 'cancelada' }); toast.success('Cita cancelada'); dispatchUi({ type: 'SET_SHOW_DETAIL', showDetail: false }); load(); }
    catch { toast.error('Error al cancelar'); }
  }

  async function advanceStatus(appt: AppointmentWithDetails) {
    const nextStatus: Record<string, string> = { 'programada': 'en_curso', 'en_curso': 'completada' };
    const newStatus = nextStatus[appt.status];
    if (!newStatus) return;
    if (newStatus === 'en_curso') {
      const confirmed = await confirm({
        title: 'Iniciar cita',
        message: `¿Iniciar la cita "${appt.title}"? La cita pasará a "En curso".`,
        confirmText: 'Iniciar', cancelText: 'Volver', variant: 'info',
      });
      if (!confirmed) return;
    }
    if (newStatus === 'completada') {
      const pendingBalance = Number(appt.appointment_balance?.pending_balance || 0);
      const confirmed = await confirm({
        title: 'Completar cita',
        message: pendingBalance > 0 ? `¿Completar la cita? Se registrará un pago de ${formatCurrency(pendingBalance)}.` : '¿Marcar la cita como completada?',
        confirmText: 'Completar', cancelText: 'Volver', variant: 'warning',
      });
      if (!confirmed) return;
    }
    try {
      await updateAppointment(appt.id, { status: newStatus });
      if (newStatus === 'completada') {
        const pendingBalance = Number(appt.appointment_balance?.pending_balance || 0);
        if (pendingBalance > 0) {
          await createPayment({ concept: 'Saldo de cita', amount: pendingBalance, type: 'ingreso', category: 'servicio', payment_kind: 'pago_final', appointment_id: appt.id, client_id: appt.client_id || null });
        }
      }
      const statusLabel = APPOINTMENT_STATUS_LABELS[newStatus as keyof typeof APPOINTMENT_STATUS_LABELS];
      toast.success(`Cita marcada como ${statusLabel}`);
      dispatchUi({ type: 'SET_SHOW_DETAIL', showDetail: false });
      load();
    } catch { toast.error('Error al actualizar estado'); }
  }

  async function markAsNoShow(appt: AppointmentWithDetails) {
    const confirmed = await confirm({ title: 'Marcar como No Show', message: `¿Marcar la cita "${appt.title}" como no show?`, confirmText: 'Sí, No Show', cancelText: 'Cancelar', variant: 'warning' });
    if (!confirmed) return;
    try { await updateAppointment(appt.id, { status: 'no_show' }); toast.success('Cita marcada como No Show'); dispatchUi({ type: 'SET_SHOW_DETAIL', showDetail: false }); load(); }
    catch { toast.error('Error al marcar como No Show'); }
  }

  async function deleteAppt() {
    if (!editingAppt) return;
    const confirmed = await confirm({ title: 'Eliminar cita', message: `¿Eliminar la cita "${editingAppt.title}"?`, confirmText: 'Eliminar', cancelText: 'Cancelar', variant: 'danger' });
    if (!confirmed) return;
    try { await updateAppointment(editingAppt.id, { status: 'cancelada' }); toast.success('Cita eliminada'); dispatchUi({ type: 'SET_SHOW_MODAL', showModal: false }); setEditingAppt(null); load(); }
    catch { toast.error('Error al eliminar'); }
  }

  async function updateApptDate(apptId: string, newStart: Date) {
    try {
      const appt = appointments.find((a) => a.id === apptId);
      if (!appt) return;
      const duration = appt.total_duration_min || 60;
      const newEnd = new Date(newStart.getTime() + duration * 60000);
      await updateAppointment(apptId, { start_time: newStart.toISOString(), end_time: newEnd.toISOString() });
      load();
    } catch { toast.error('Error al mover la cita'); }
  }

  const statusColors: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    programada: 'info', en_curso: 'warning', completada: 'success', cancelada: 'danger', no_show: 'danger',
  };

  const canDeleteAppt = !!(editingAppt && editingAppt.status !== 'cancelada' && editingAppt.status !== 'completada');

  return {
    totalDuration, calculateTotalPrice, haveChanges, checkForOverlap, handleSubmit,
    openEdit, openNew, openNewForDate, cancelAppt, advanceStatus, markAsNoShow,
    deleteAppt, updateApptDate, statusColors, canDeleteAppt,
  };
}
