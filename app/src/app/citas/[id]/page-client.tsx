'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAppointmentById, updateAppointment, getServices, getStaff, getClients, promoteClientOnCompletion } from '@/lib/db/queries';
import type { AppointmentWithDetails, AppointmentFormData } from '@/components/citas/types';
import type { Service, StaffMember, Client } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/confirm-context';
import {
  AppointmentDetailHeader,
  AppointmentDetailServicesCommissions,
  AppointmentDetailBalance,
  AppointmentDetailNotes,
} from '@/components/citas/detail';
import { AppointmentFormModalContent } from '@/components/citas/AppointmentFormModal';
import { ServiceSelectorModalContent } from '@/components/citas/ServiceSelectorModal';
import { ServiceConfigModalContent } from '@/components/citas/ServiceConfigModal';
import { generateAppointmentTitle, toLocalISO } from '@/components/citas/helpers';

function LoadingSkeleton() {
  return (
    <>
      <Header title="Cita" />
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse" role="status" aria-label="Cargando cita">
        {/* 1. Header card: client info + schedule + stepper */}
        <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-zinc-200" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-40 bg-zinc-200 rounded-lg" />
                <div className="h-4 w-24 bg-zinc-200 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-zinc-100">
              <div className="h-4 w-56 bg-zinc-200 rounded-lg" />
              <div className="h-4 w-44 bg-zinc-200 rounded-lg" />
            </div>
            <div className="flex items-center gap-1 pt-4 border-t border-zinc-100">
              <div className="flex-1 h-3 bg-zinc-200 rounded-full" />
              <div className="flex-1 h-3 bg-zinc-200 rounded-full" />
              <div className="flex-1 h-3 bg-zinc-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* 2. Notes card */}
        <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <div className="px-5 py-4 space-y-3">
            <div className="h-5 w-28 bg-zinc-200 rounded-lg" />
            <div className="h-10 w-full bg-zinc-100 rounded-lg" />
          </div>
        </div>

        {/* 3. Balance grid: 3 cards in a row (Total | Pagado | Saldo) */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm p-4 space-y-2">
            <div className="h-3 w-12 bg-zinc-200 rounded" />
            <div className="h-7 w-20 bg-zinc-200 rounded-lg" />
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm p-4 space-y-2">
            <div className="h-3 w-16 bg-zinc-200 rounded" />
            <div className="h-7 w-20 bg-zinc-200 rounded-lg" />
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm p-4 space-y-2">
            <div className="h-3 w-14 bg-zinc-200 rounded" />
            <div className="h-7 w-20 bg-zinc-200 rounded-lg" />
          </div>
        </div>

        {/* 4. Services + Commissions: 2 stacked cards */}
        <div className="space-y-4">
          {/* Services card */}
          <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm">
            <div className="px-5 py-4 space-y-4">
              <div className="h-5 w-32 bg-zinc-200 rounded-lg" />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-zinc-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-48 bg-zinc-200 rounded-lg" />
                    <div className="h-3 w-32 bg-zinc-200 rounded-lg" />
                  </div>
                  <div className="h-5 w-16 bg-zinc-200 rounded-lg" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-zinc-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-36 bg-zinc-200 rounded-lg" />
                    <div className="h-3 w-28 bg-zinc-200 rounded-lg" />
                  </div>
                  <div className="h-5 w-16 bg-zinc-200 rounded-lg" />
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex justify-between">
                <div className="h-3 w-20 bg-zinc-200 rounded-lg" />
                <div className="h-4 w-24 bg-zinc-200 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Commissions card */}
          <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm">
            <div className="px-5 py-4 space-y-4">
              <div className="h-5 w-48 bg-zinc-200 rounded-lg" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-zinc-200 rounded-lg" />
                  <div className="h-4 w-16 bg-zinc-200 rounded-lg" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-28 bg-zinc-200 rounded-lg" />
                  <div className="h-4 w-16 bg-zinc-200 rounded-lg" />
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex justify-between">
                <div className="h-3 w-28 bg-zinc-200 rounded-lg" />
                <div className="h-4 w-20 bg-zinc-200 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CitaDetailPage({ initialAppointment }: {
  initialAppointment?: AppointmentWithDetails | null;
}) {
  const { push } = useRouter();
  const { confirm } = useConfirm();
  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(initialAppointment || null);
  const [loading, setLoading] = useState(!initialAppointment);
  const servicesRef = useRef<Service[]>([]);
  const staffRef = useRef<StaffMember[]>([]);
  const clientsRef = useRef<Client[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showServiceConfig, setShowServiceConfig] = useState(false);
  const [configuringServiceId, setConfiguringServiceId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<AppointmentFormData>({
    client_id: '', start_time: '', status: 'programada', notes: '', color: '',
  });
  const [editServices, setEditServices] = useState<string[]>([]);
  const [editArtists, setEditArtists] = useState<Record<string, string>>({});
  const [editPrices, setEditPrices] = useState<Record<string, number>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!appointment) return;
    setLoading(true);
    try {
      const data = await getAppointmentById(appointment.id);
      setAppointment(data as AppointmentWithDetails);
    } catch {
      toast.error('Error al cargar la cita');
    } finally {
      setLoading(false);
    }
  }, [appointment?.id]);

  const handleCancel = useCallback(async () => {
    if (!appointment) return;
    const ok = await confirm({ title: 'Cancelar cita', message: '¿Cancelar esta cita? Se marcará como cancelada.', confirmText: 'Cancelar', cancelText: 'Volver', variant: 'warning' });
    if (!ok) return;
    try {
      await updateAppointment(appointment.id, { status: 'cancelada' });
      toast.success('Cita cancelada');
      load();
    } catch {
      toast.error('Error al cancelar');
    }
  }, [appointment, confirm, load]);

  const handleAdvanceStatus = useCallback(async () => {
    if (!appointment) return;
    const nextStatus = appointment.status === 'programada' ? 'en_curso' : 'completada';
    try {
      await updateAppointment(appointment.id, { status: nextStatus });
      if (nextStatus === 'completada') {
        await promoteClientOnCompletion(appointment.client_id);
      }
      toast.success(nextStatus === 'en_curso' ? 'Cita iniciada' : 'Cita completada');
      load();
    } catch {
      toast.error('Error al actualizar estado');
    }
  }, [appointment, load]);

  const handleMarkAsNoShow = useCallback(async () => {
    if (!appointment) return;
    const ok = await confirm({ title: 'Marcar como No Show', message: '¿Marcar la cita como no show? La clienta no asistió.', confirmText: 'Sí, No Show', cancelText: 'Cancelar', variant: 'warning' });
    if (!ok) return;
    try {
      await updateAppointment(appointment.id, { status: 'no_show' });
      toast.success('Cita marcada como No Show');
      load();
    } catch {
      toast.error('Error al actualizar');
    }
  }, [appointment, confirm, load]);

  async function openEditModal() {
    if (!appointment) return;
    setEditForm({
      client_id: appointment.client_id || '',
      start_time: toLocalISO(appointment.start_time),
      status: appointment.status,
      notes: appointment.notes || '',
      color: appointment.color || '',
    });
    const svcIds: string[] = [];
    const svcArtists: Record<string, string> = {};
    const svcPrices: Record<string, number> = {};
    (appointment.appointment_services || []).forEach((as) => {
      if (as.service_id) {
        svcIds.push(as.service_id);
        if (as.artist_id) svcArtists[as.service_id] = as.artist_id;
        if (as.service_price != null) svcPrices[as.service_id] = Number(as.service_price);
      }
    });
    setEditServices(svcIds);
    setEditArtists(svcArtists);
    setEditPrices(svcPrices);

    setShowEditModal(true);

    if (servicesRef.current.length === 0) {
      setEditLoading(true);
      try {
        const [s, st, c] = await Promise.all([
          getServices(false),
          getStaff(false),
          getClients(),
        ]);
        servicesRef.current = s as Service[];
        staffRef.current = st as StaffMember[];
        clientsRef.current = c as Client[];
      } catch {
        toast.error('Error al cargar datos');
      } finally {
        setEditLoading(false);
      }
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appointment || editSubmitting) return;
    setEditSubmitting(true);
    try {
      const startTime = new Date(editForm.start_time);
      const duration = editServices.reduce((sum, sid) => {
        const svc = appointment.appointment_services?.find(as => as.service_id === sid)?.service;
        return sum + (svc?.duration_min || 30);
      }, 0);
      const endTime = new Date(startTime.getTime() + duration * 60000);
      const totalPrice = editServices.reduce((sum, sid) => {
        const price = editPrices[sid];
        if (price !== undefined) return sum + price;
        const as = appointment.appointment_services?.find(a => a.service_id === sid);
        const defaultPrice = as?.service_price ?? as?.service?.price ?? 0;
        return sum + Number(defaultPrice);
      }, 0);
      const servicesData = editServices.map((sid) => ({
        service_id: sid,
        artist_id: editArtists[sid] || null,
        service_price: editPrices[sid] ?? null,
      }));
      const firstArtistId = servicesData.find(s => s.artist_id)?.artist_id || null;
      await updateAppointment(appointment.id, {
        title: generateAppointmentTitle(editServices, servicesRef.current as any),
        client_id: editForm.client_id || '',
        artist_id: firstArtistId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: editForm.status,
        total_price: totalPrice,
        total_duration_min: duration,
        notes: editForm.notes || null,
        color: editForm.color || null,
        services: servicesData,
      });
      toast.success('Cita actualizada');
      setShowEditModal(false);
      load();
    } catch {
      toast.error('Error al actualizar la cita');
    } finally {
      setEditSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!appointment) {
    return (
      <>
        <Header title="Cita no encontrada" />
        <div className="p-4 md:p-8 max-w-7xl mx-auto text-center">
          <p className="text-zinc-500 mb-4">La cita no existe o fue eliminada.</p>
          <Button variant="outline" onClick={() => push('/citas')}>Volver a Citas</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={appointment.client?.name || 'Cita'}
        action={
          <Button size="sm" variant="outline" onClick={() => push('/citas')}>
            <ArrowLeft className="size-4 mr-1" /> Volver
          </Button>
        }
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6" key={appointment.id}>
        <div className="animate-fadeInUp stagger-1">
          <AppointmentDetailHeader
            appointment={appointment}
            onEdit={openEditModal}
            onCancel={handleCancel}
            onAdvanceStatus={handleAdvanceStatus}
            onMarkAsNoShow={handleMarkAsNoShow}
            onGoToClient={(id) => push('/clientes/' + id)}
          />
        </div>
        <div className="animate-fadeInUp stagger-2">
          <AppointmentDetailNotes notes={appointment.notes} />
        </div>
        <div className="animate-fadeInUp stagger-3">
          <AppointmentDetailBalance appointment={appointment} />
        </div>
        <div className="animate-fadeInUp stagger-4">
          <AppointmentDetailServicesCommissions
            appointment={appointment}
            onGoToStaff={(id) => push('/staff/' + id)}
          />
        </div>
      </div>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Cita">
        {editLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 border-2 border-salon-200 border-t-salon-600 rounded-full animate-spin" />
          </div>
        ) : (
        <AppointmentFormModalContent
          open={showEditModal}
          editingAppt={appointment}
          form={editForm}
          clients={clientsRef.current as any}
          selectedServices={editServices}
          serviceArtists={editArtists}
          customPrices={editPrices}
          services={servicesRef.current as any}
          staff={staffRef.current as any}
          overlapWarning={null}
          advancePaid={false}
          submitting={editSubmitting}
          canDelete={false}
          totalDuration={editServices.reduce((sum, sid) => {
            const svc = appointment.appointment_services?.find(as => as.service_id === sid)?.service;
            return sum + (svc?.duration_min || 30);
          }, 0)}
          haveChanges={() => true}
          calculateTotalPrice={() => editServices.reduce((sum, sid) => {
            const price = editPrices[sid];
            if (price !== undefined) return sum + price;
            const as = appointment.appointment_services?.find(a => a.service_id === sid);
            return sum + Number(as?.service_price ?? as?.service?.price ?? 0);
          }, 0)}
          onFormChange={(updates) => setEditForm(prev => ({ ...prev, ...updates }))}
          onStartTimeChange={(v) => setEditForm(prev => ({ ...prev, start_time: v }))}
          onSubmit={handleEditSubmit}
          onDelete={() => {}}
          onClose={() => setShowEditModal(false)}
          onOpenServiceSelector={() => setShowServiceSelector(true)}
          onOpenServiceConfig={(serviceId) => { setConfiguringServiceId(serviceId); setShowServiceConfig(true); }}
          onToggleAdvancePaid={() => {}}
        />
        )}
      </Modal>

      <Modal
        open={showServiceConfig}
        onClose={() => setShowServiceConfig(false)}
        title={`⚙️ Configurar: ${appointment.appointment_services?.find(as => as.service_id === configuringServiceId)?.service?.name || 'Servicio'}`}
      >
        <ServiceConfigModalContent
          key={configuringServiceId || 'none'}
          open={showServiceConfig}
          serviceId={configuringServiceId}
          services={servicesRef.current as any}
          staff={staffRef.current as any}
          currentArtistId={editArtists[configuringServiceId || ''] || ''}
          currentPrice={editPrices[configuringServiceId || ''] ?? null}
          onSave={({ serviceId, artistId, price }) => {
            if (artistId) setEditArtists(prev => ({ ...prev, [serviceId]: artistId }));
            else {
              const newMap = { ...editArtists };
              delete newMap[serviceId];
              setEditArtists(newMap);
            }
            if (price !== null) setEditPrices(prev => ({ ...prev, [serviceId]: price }));
            setShowServiceConfig(false);
          }}
          onRemove={(serviceId) => {
            setEditServices(editServices.filter(id => id !== serviceId));
            const newMap = { ...editArtists };
            delete newMap[serviceId];
            setEditArtists(newMap);
            const newPrices = { ...editPrices };
            delete newPrices[serviceId];
            setEditPrices(newPrices);
            setShowServiceConfig(false);
          }}
          onClose={() => setShowServiceConfig(false)}
        />
      </Modal>

      <Modal
        open={showServiceSelector}
        onClose={() => setShowServiceSelector(false)}
        title="Seleccionar servicios"
      >
        <ServiceSelectorModalContent
          open={showServiceSelector}
          services={servicesRef.current as any}
          staff={staffRef.current as any}
          initialSelectedIds={editServices}
          initialArtists={editArtists}
          initialPrices={editPrices}
          onConfirm={({ selectedIds, artists, prices }) => {
            setEditServices(selectedIds);
            setEditArtists(artists);
            setEditPrices(prices);
            setShowServiceSelector(false);
          }}
          onClose={() => setShowServiceSelector(false)}
        />
      </Modal>
    </>
  );
}
