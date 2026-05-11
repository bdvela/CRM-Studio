'use client';

import { useEffect, useState, useRef } from 'react';
import { getAppointments, getStaff, getServices } from '@/lib/db/queries';
import { createAppointment, updateAppointment, checkOverlap, createPayment } from '@/lib/db/queries';
import { ClientCombobox } from '@/components/citas/ClientCombobox';
import type { AppointmentInsert, AppointmentStatus, Service, StaffMember, StaffService, StaffSpecialty, Category } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { CalendarView } from '@/components/citas/CalendarView';
import {
  formatCurrency,
  formatTime,
  formatDate,
  startOfToday,
  endOfToday,
  startOfWeek,
  cn,
  calculateServiceCommission,
  formatServicePrice,
  isAppointmentPastOrCompleted,
} from '@/lib/utils';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { CalendarDays, Plus, Clock, User, AlertTriangle, Check, Pencil, XCircle, X, MapPin, Calendar as CalendarIcon, Trash2, Sparkles, Settings2, Search } from 'lucide-react';
 import { format } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { toast } from 'sonner';
 
import { useConfirm } from '@/context/confirm-context';

type ListFilter = 'list' | 'day' | 'week';
type ViewMode = 'list' | 'calendar';

function getServiceEmoji(appt: any): string {
  const svc = appt.appointment_services?.[0]?.service;
  return svc?.category?.icon || '📋';
}

function toLocalISO(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function generateAppointmentTitle(selectedServiceIds: string[], allServices: Service[]): string {
  const selected = allServices.filter((s) => selectedServiceIds.includes(s.id));
  if (selected.length === 0) return 'Cita';
  const names = selected.map((s) => s.name);
  if (names.length <= 3) return names.join(' + ');
  return `${names[0]} + ${names.length - 1} más`;
}

function getAvailableArtistsForService(
  serviceId: string,
  categoryId: string | null | undefined,
  staff: StaffMember[],
  services: Service[]
): StaffMember[] {
  const svc = services.find(s => s.id === serviceId);
  const hasExplicitStaff = svc?.staff_services && svc.staff_services.length > 0;
  
  if (hasExplicitStaff) {
    const assignedIds = (svc.staff_services || []).map((ss: StaffService) => ss.staff_id);
    return staff.filter(s => s.active && assignedIds.includes(s.id));
  }
  
  if (categoryId) {
    return staff.filter(s => 
      s.active && (s.staff_specialties || []).some(
        (sp: StaffSpecialty) => sp.category_id === categoryId
      )
    );
  }
  
  return staff.filter(s => s.active);
}

interface AppointmentFormData {
  client_id: string;
  start_time: string;
  status: AppointmentInsert['status'];
  notes: string;
  color: string;
}

export default function CitasPage() {
  const { confirm } = useConfirm();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [listFilter, setListFilter] = useState<ListFilter>('list');
  const [filterArtist, setFilterArtist] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceArtists, setServiceArtists] = useState<Record<string, string>>({});
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  
   const [initialForm, setInitialForm] = useState<AppointmentFormData | null>(null);
   const [initialSelectedServices, setInitialSelectedServices] = useState<string[]>([]);
   const [initialServiceArtists, setInitialServiceArtists] = useState<Record<string, string>>({});
   const [initialCustomPrices, setInitialCustomPrices] = useState<Record<string, number>>({});
   const [initialAdvancePaid, setInitialAdvancePaid] = useState<boolean>(false);
   
   const [advancePaid, setAdvancePaid] = useState<boolean>(true);
  
   const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
   const [pendingDate, setPendingDate] = useState<Date | null>(null);
   const [showDetail, setShowDetail] = useState(false);
   const [selectedAppt, setSelectedAppt] = useState<any>(null);
   const detailRef = useRef<HTMLDivElement>(null);
   const [showServiceConfig, setShowServiceConfig] = useState(false);
   const [configuringServiceId, setConfiguringServiceId] = useState<string | null>(null);
   const [tempArtistId, setTempArtistId] = useState<string>('');
   const [tempCustomPrice, setTempCustomPrice] = useState<number | null>(null);
   
   const [showServiceSelector, setShowServiceSelector] = useState(false);
   const [selectorSearch, setSelectorSearch] = useState('');
   const [selectorCategoryFilter, setSelectorCategoryFilter] = useState<string>('');
   const [selectedInSelector, setSelectedInSelector] = useState<string[]>([]);
   const [selectorArtists, setSelectorArtists] = useState<Record<string, string>>({});
   const [selectorPrices, setSelectorPrices] = useState<Record<string, number>>({});

  const [form, setForm] = useState<AppointmentFormData>({
    client_id: '',
    start_time: '',
    status: 'programada',
    notes: '',
    color: '',
  });

   async function load() {
     setLoading(true);
     try {
       let dateFrom: string | undefined;
       let dateTo: string | undefined;

       if (listFilter === 'list') {
         dateFrom = startOfToday();
       } else if (listFilter === 'day') {
         dateFrom = startOfToday();
         dateTo = endOfToday();
       } else if (listFilter === 'week') {
         dateFrom = startOfWeek();
       }

      const filter: any = {};
      if (dateFrom) filter.dateFrom = dateFrom;
      if (dateTo) filter.dateTo = dateTo;
      if (filterArtist) filter.artistId = filterArtist;
      if (filterStatus) filter.status = filterStatus;

       const [appts, s, svcs] = await Promise.all([
         getAppointments(filter),
         getStaff(),
         getServices(false),
       ]);
      setAppointments(appts as any[]);
      setStaff(s as StaffMember[]);
      setServices(svcs as Service[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [viewMode, listFilter, filterArtist, filterStatus]);

  useEffect(() => {
    if (pendingDate) {
      openNewForDate(pendingDate);
      setPendingDate(null);
    }
  }, [pendingDate]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (detailRef.current && !detailRef.current.contains(e.target as Node)) {
        setShowDetail(false);
        setSelectedAppt(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalDuration = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + Number(s.duration_min), 0);

  function calculateTotalPrice(): number {
    return services
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => {
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
    if (!editingAppt || !initialForm) return true;
    
    if (form.client_id !== initialForm.client_id) return true;
    if (form.start_time !== initialForm.start_time) return true;
    if (form.status !== initialForm.status) return true;
    if (form.notes !== initialForm.notes) return true;
    if (form.color !== initialForm.color) return true;
    
    if (selectedServices.length !== initialSelectedServices.length) return true;
    const sortedSelected = [...selectedServices].sort();
    const sortedInitial = [...initialSelectedServices].sort();
    if (!sortedSelected.every((id, i) => id === sortedInitial[i])) return true;
    
    for (const svcId of sortedSelected) {
      if (serviceArtists[svcId] !== initialServiceArtists[svcId]) return true;
      if (customPrices[svcId] !== initialCustomPrices[svcId]) return true;
    }
    
    return false;
  }

  async function checkForOverlap() {
    if (!form.start_time || totalDuration === 0) {
      setOverlapWarning(null);
      return;
    }
    
    const artistIds = selectedServices
      .map(sid => serviceArtists[sid])
      .filter(Boolean);
    
    if (artistIds.length === 0) {
      setOverlapWarning(null);
      return;
    }
    
    const start = new Date(form.start_time);
    const end = new Date(start.getTime() + totalDuration * 60000);
    const excludeId = editingAppt?.id || null;
    
    for (const artistId of artistIds) {
      const overlaps = await checkOverlap(artistId, start.toISOString(), end.toISOString(), excludeId);
      if (overlaps.length > 0) {
        const artistName = staff.find(s => s.id === artistId)?.name || 'artista';
        setOverlapWarning(`⚠️ Conflicto con: ${overlaps[0].title} (${artistName})`);
        return;
      }
    }
    
    setOverlapWarning(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.client_id || !form.start_time) {
      toast.error('Selecciona clienta y fecha');
      return;
    }
    if (editingAppt && !haveChanges()) {
      toast.info('No hay cambios para guardar');
      return;
    }

    setSubmitting(true);
    try {
      const startTime = new Date(form.start_time);
      const endTime = new Date(startTime.getTime() + totalDuration * 60000);
      const calculatedTotalPrice = calculateTotalPrice();

       const servicesData = selectedServices.map(sid => {
         const svc = services.find(s => s.id === sid);
         const price = customPrices[sid] !== undefined
           ? customPrices[sid]
           : svc?.price_type === 'variable' ? (svc.price_from || 0) : (svc?.price || 0);
         return {
           service_id: sid,
           artist_id: serviceArtists[sid] || null,
           service_price: price,
         };
       });

      const firstArtistId = servicesData.find(s => s.artist_id)?.artist_id || null;

      const apptData: AppointmentInsert & { services?: any[]; serviceIds?: string[] } = {
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
             concept: 'Adelanto de cita',
             amount: 10,
             type: 'ingreso',
             category: 'servicio',
             appointment_id: newAppt.id,
             client_id: form.client_id || null,
           });
         }
         
         toast.success('Cita creada');
       }
      setShowModal(false);
      setEditingAppt(null);
      load();
    } catch (e: any) {
      toast.error('Error: ' + (e.message || 'No se pudo guardar'));
    } finally {
      setSubmitting(false);
    }
  }

   function openEdit(appt: any) {
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
     
     (appt.appointment_services || []).forEach((as: any) => {
       if (as.service_id) {
         svcIds.push(as.service_id);
         if (as.artist_id) {
           svcArtistMap[as.service_id] = as.artist_id;
         }
       }
     });
     
     setForm(formData);
     setSelectedServices(svcIds);
     setServiceArtists(svcArtistMap);
     const pricemap: Record<string, number> = {};
     (appt.appointment_services || []).forEach((as: any) => {
       if (as.service_id && as.service_price != null) {
         pricemap[as.service_id] = Number(as.service_price);
       }
     });
     setCustomPrices(pricemap);
     setAdvancePaid(false);

     setInitialForm({ ...formData });
     setInitialSelectedServices([...svcIds]);
     setInitialServiceArtists({ ...svcArtistMap });
     setInitialCustomPrices({ ...pricemap });
     setInitialAdvancePaid(false);
     
     setShowModal(true);
   }

   function openNew() {
     setEditingAppt(null);
     setForm({
       client_id: '',
       start_time: '',
       status: 'programada',
       notes: '',
       color: '',
     });
     setSelectedServices([]);
     setServiceArtists({});
     setCustomPrices({});
     setAdvancePaid(true);
     setInitialForm(null);
     setInitialSelectedServices([]);
     setInitialServiceArtists({});
     setInitialCustomPrices({});
     setInitialAdvancePaid(true);
     setOverlapWarning(null);
     setShowModal(true);
   }

   function openNewForDate(date: Date) {
     setEditingAppt(null);
     const timeStr = toLocalISO(date.toISOString());
     setForm({
       client_id: '',
       start_time: timeStr,
       status: 'programada',
       notes: '',
       color: '',
     });
     setSelectedServices([]);
     setServiceArtists({});
     setCustomPrices({});
     setAdvancePaid(true);
     setInitialForm(null);
     setInitialSelectedServices([]);
     setInitialServiceArtists({});
     setInitialCustomPrices({});
     setInitialAdvancePaid(true);
     setOverlapWarning(null);
     setShowModal(true);
   }

   async function cancelAppt(appt: any) {
     const confirmed = await confirm({
       title: 'Cancelar cita',
       message: `¿Cancelar la cita "${appt.title}"?`,
       confirmText: 'Cancelar cita',
       cancelText: 'No cancelar',
       variant: 'warning',
     });
     
     if (!confirmed) return;
     try {
       await updateAppointment(appt.id, { status: 'cancelada' });
       toast.success('Cita cancelada');
       load();
     } catch (e) {
       toast.error('Error al cancelar');
     }
   }

    async function advanceStatus(appt: any) {
      const nextStatus: Record<string, string> = {
        'programada': 'en_curso',
        'en_curso': 'completada',
      };

      const newStatus = nextStatus[appt.status];
      if (!newStatus) return;

      if (newStatus === 'completada') {
        const pendingBalance = Number(appt.appointment_balance?.pending_balance || 0);
        const confirmed = await confirm({
          title: 'Completar cita',
          message: pendingBalance > 0
            ? `¿Completar la cita? Se registrará un pago de ${formatCurrency(pendingBalance)}.`
            : '¿Marcar la cita como completada?',
          confirmText: 'Completar',
          cancelText: 'Volver',
          variant: 'warning',
        });
        if (!confirmed) return;
      }

      try {
        await updateAppointment(appt.id, { status: newStatus });
        
        if (newStatus === 'completada') {
          const pendingBalance = Number(appt.appointment_balance?.pending_balance || 0);
          if (pendingBalance > 0) {
            await createPayment({
              concept: 'Pago completo de cita',
              amount: pendingBalance,
              type: 'ingreso',
              category: 'servicio',
              appointment_id: appt.id,
              client_id: appt.client_id || null,
            });
          }
        }
        
        const statusLabel = APPOINTMENT_STATUS_LABELS[newStatus as keyof typeof APPOINTMENT_STATUS_LABELS];
        toast.success(`Cita marcada como ${statusLabel}`);
        setShowDetail(false);
        load();
      } catch (e) {
        toast.error('Error al actualizar estado');
      }
    }

   async function markAsNoShow(appt: any) {
     const confirmed = await confirm({
       title: 'Marcar como No Show',
       message: `¿Marcar la cita "${appt.title}" como no show? Esto indica que la clienta no asistió.`,
       confirmText: 'Marcar como No Show',
       cancelText: 'Cancelar',
       variant: 'warning',
     });
     
     if (!confirmed) return;
     try {
       await updateAppointment(appt.id, { status: 'no_show' });
       toast.success('Cita marcada como No Show');
       setShowDetail(false);
       load();
     } catch (e) {
       toast.error('Error al marcar como No Show');
     }
   }

  async function deleteAppt() {
    if (!editingAppt) return;
    const confirmed = await confirm({
      title: 'Eliminar cita',
      message: `¿Eliminar la cita "${editingAppt.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    try {
      await updateAppointment(editingAppt.id, { status: 'cancelada' });
      toast.success('Cita eliminada');
      setShowModal(false);
      setEditingAppt(null);
      load();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  }

  async function updateApptDate(apptId: string, newStart: Date) {
    try {
      const appt = appointments.find(a => a.id === apptId);
      if (!appt) return;

      const origStart = new Date(appt.start_time);
      const duration = appt.total_duration_min || 60;
      const newEnd = new Date(newStart.getTime() + duration * 60000);

      await updateAppointment(apptId, {
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      });
      load();
    } catch (e) {
      toast.error('Error al mover la cita');
    }
  }

  const groupedByDate = appointments.reduce((acc, appt) => {
    const date = new Date(appt.start_time).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(appt);
    return acc;
  }, {} as Record<string, any[]>);

  const statusColors: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    programada: 'info', en_curso: 'warning', completada: 'success', cancelada: 'danger', no_show: 'danger',
  };

  const canDeleteAppt = editingAppt && 
    editingAppt.status !== 'cancelada' && 
    editingAppt.status !== 'completada';

  return (
    <>
      <Header title="Citas" action={
        <div className="flex items-center gap-3">
          <div className="hidden md:flex gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5',
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              )}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5',
                viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              )}
            >
              Calendario
            </button>
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" /> Nueva
          </Button>
        </div>
      } />

      {/* Mobile tabs */}
      <div className="px-4 md:hidden space-y-2">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            )}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all',
              viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            )}
          >
            Calendario
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {viewMode === 'list' && (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Time filter */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setListFilter('list')}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-all',
                  listFilter === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Todas
              </button>
              <button
                onClick={() => setListFilter('day')}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-all',
                  listFilter === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Hoy
              </button>
              <button
                onClick={() => setListFilter('week')}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-all',
                  listFilter === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Semana
              </button>
            </div>

            {/* Artist filter */}
            <select
              value={filterArtist}
              onChange={(e) => setFilterArtist(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-salon-500 cursor-pointer"
            >
              <option value="">Todas las artistas</option>
              {staff.filter(s => s.active).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-salon-500 cursor-pointer"
            >
              <option value="">Todos los estados</option>
              {Object.entries(APPOINTMENT_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            {/* Clear */}
            {(filterArtist || filterStatus) && (
              <button
                onClick={() => { setFilterArtist(''); setFilterStatus(''); }}
                className="text-xs text-salon-600 hover:text-salon-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}

            <div className="flex-1" />
            <span className="text-sm text-gray-400">
              {appointments.length} cita{appointments.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {viewMode === 'calendar' ? (
          <CalendarView
            appointments={appointments}
            staff={staff}
            onEdit={openEdit}
            onCancel={cancelAppt}
            onNew={(date) => setPendingDate(date)}
            onUpdateDate={updateApptDate}
            onAdvanceStatus={advanceStatus}
            onMarkAsNoShow={markAsNoShow}
          />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : Object.keys(groupedByDate).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {filterArtist || filterStatus
                  ? 'No hay citas con estos filtros'
                  : 'No hay citas en este período'}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedByDate).map(([date, appts]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{date}</h3>
              <div className="space-y-2">
                {(appts as any[]).map((appt) => (
                  <Card
                     key={appt.id}
                     className={cn(
                       "hover:border-salon-300 transition-all cursor-pointer",
                       isAppointmentPastOrCompleted(appt) && "opacity-50"
                     )}
                     onClick={() => { setSelectedAppt(appt); setShowDetail(true); }}
                   >
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="text-center w-14 flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{formatTime(appt.start_time)}</p>
                        <p className="text-xs text-gray-400">{appt.total_duration_min} min</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {appt.client?.name || 'Sin clienta'}
                        </p>
                        {appt.artist?.name && (
                          <p className="text-xs text-salon-600 mt-0.5 truncate">{appt.artist.name}</p>
                        )}
                        {appt.appointment_services?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {appt.appointment_services.map((as: any, i: number) => (
                              <Badge key={i} variant="default" className="text-[10px]">
                                {as.service?.category?.icon} {as.service?.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold">{formatCurrency(appt.total_price)}</p>
                        <Badge variant={statusColors[appt.status] || 'default'} className="text-xs mt-1">
                          {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Popover */}
      {showDetail && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
          <div ref={detailRef} className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header tipo ticket: barra de color full-width con label de estado */}
            <div className={cn(
              'px-5 py-3 flex items-center justify-between',
              selectedAppt.status === 'cancelada' ? 'bg-red-500'
              : selectedAppt.status === 'completada' ? 'bg-emerald-500'
              : selectedAppt.status === 'en_curso' ? 'bg-amber-500'
              : selectedAppt.status === 'no_show' ? 'bg-gray-500'
              : 'bg-salon-500'
            )}>
              <span className="text-xs font-bold text-white tracking-widest uppercase">
                {APPOINTMENT_STATUS_LABELS[selectedAppt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
              </span>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Cuerpo del ticket */}
            <div className="p-5 space-y-4">
              {/* Cliente + precio */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedAppt.client?.name || 'Sin clienta'}
                  </h3>
                  {selectedAppt.artist?.name && (
                    <p className="text-sm text-gray-500 mt-0.5">con {selectedAppt.artist.name}</p>
                  )}
                </div>
                <p className="text-xl font-bold text-gray-900 shrink-0 tabular-nums">
                  {formatCurrency(selectedAppt.total_price)}
                </p>
              </div>

              <div className="border-t border-dashed border-gray-200" />

              {/* Fecha + hora */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 capitalize">
                    {format(new Date(selectedAppt.start_time), "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">
                    {formatTime(selectedAppt.start_time)} — {formatTime(selectedAppt.end_time || selectedAppt.start_time)}
                    <span className="text-gray-400 ml-2">({selectedAppt.total_duration_min} min)</span>
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200" />

              {/* Servicios */}
              {selectedAppt.appointment_services?.length > 0 && (
                <div className="space-y-2.5">
                  {selectedAppt.appointment_services.map((as: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{as.service?.category?.icon || '📋'}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{as.service?.name}</p>
                          {as.artist?.name && (
                            <p className="text-xs text-gray-400">{as.artist.name}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 tabular-nums">
                        {formatCurrency(Number(as.service_price ?? as.service?.price) || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Comisiones totales */}
              {selectedAppt.appointment_services?.some((as: any) => as.commission_detail) && (() => {
                const totalArtist = selectedAppt.appointment_services.reduce(
                  (sum: number, as: any) => sum + Number(as.commission_detail?.artist_commission || 0), 0
                );
                const totalFounder = selectedAppt.appointment_services.reduce(
                  (sum: number, as: any) => sum + Number(as.commission_detail?.founder_share || 0), 0
                );
                if (totalArtist === 0 && totalFounder === 0) return null;
                return (
                  <>
                    <div className="border-t border-gray-100" />
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Artistas: <span className="text-emerald-600 font-semibold">{formatCurrency(totalArtist)}</span></span>
                      <span>Founder: <span className="text-salon-600 font-semibold">{formatCurrency(totalFounder)}</span></span>
                    </div>
                  </>
                );
              })()}

              {/* Notas */}
              {selectedAppt.notes && (
                <p className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-3">
                  {selectedAppt.notes}
                </p>
              )}
            </div>

            {/* Acciones — separadas del ticket */}
            <div className="px-5 pb-5 space-y-2 border-t border-gray-100 pt-4">
              {selectedAppt.status === 'programada' && (
                <button
                  onClick={() => advanceStatus(selectedAppt)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                >
                  <Clock className="w-4 h-4" /> Iniciar cita
                </button>
              )}
              {selectedAppt.status === 'en_curso' && (
                <button
                  onClick={() => advanceStatus(selectedAppt)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                >
                  <Check className="w-4 h-4" /> Completar cita
                </button>
              )}
              <div className="flex gap-2">
                {selectedAppt.status === 'programada' && (
                  <>
                    <button
                      onClick={() => { cancelAppt(selectedAppt); setShowDetail(false); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Cancelar
                    </button>
                    <button
                      onClick={() => markAsNoShow(selectedAppt)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" /> No Show
                    </button>
                  </>
                )}
                <button
                  onClick={() => { openEdit(selectedAppt); setShowDetail(false); }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    selectedAppt.status === 'programada'
                      ? "flex-1 text-white bg-salon-600 hover:bg-salon-700"
                      : selectedAppt.status === 'en_curso'
                        ? "w-full text-salon-700 bg-salon-50 hover:bg-salon-100"
                        : "w-full text-gray-600 bg-gray-100 hover:bg-gray-200"
                  )}
                >
                  <Pencil className="w-4 h-4" /> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Modal */}
       <Modal open={showModal} onClose={() => { setShowModal(false); setEditingAppt(null); }} title={editingAppt ? 'Editar Cita' : 'Nueva Cita'}>
         <form onSubmit={handleSubmit} className="space-y-4">
           <ClientCombobox value={form.client_id} onChange={(id) => setForm({ ...form, client_id: id })} />
           <DateTimePicker value={form.start_time} onChange={(v) => { setForm({ ...form, start_time: v }); checkForOverlap(); }} />

            {/* Service Selection - Button + Modal Pattern */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Servicios</label>
              
              <button
                type="button"
                onClick={() => {
                  setSelectedInSelector([...selectedServices]);
                  setSelectorArtists({ ...serviceArtists });
                  setSelectorPrices({ ...customPrices });
                  setSelectorSearch('');
                  setSelectorCategoryFilter('');
                  setShowServiceSelector(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-salon-300 hover:text-salon-600 hover:bg-salon-50 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Agregar servicio</span>
              </button>
            </div>

           {/* Selected Services Section - Simple Cards + Config Button */}
           {selectedServices.length > 0 && (
             <>
               <div className="border-t-2 border-salon-200 pt-3 mt-1">
                 <div className="flex items-center gap-2 mb-2.5">
                   <span className="text-sm font-semibold text-gray-700">
                     📋 Servicios seleccionados ({selectedServices.length})
                   </span>
                 </div>
                 
                  <div className="space-y-2">
                    {selectedServices.map((svcId) => {
                      const svc = services.find(s => s.id === svcId);
                      if (!svc) return null;
                      
                      const availableArtists = getAvailableArtistsForService(svc.id, svc.category_id, staff, services);
                      const isVariablePrice = svc.price_type === 'variable';
                      const catIcon = svc.category?.icon || '📋';
                      const isInactive = svc.active === false;
                      
                      const suggestedArtistIds = availableArtists.map(a => a.id);
                      const selectedArtistId = serviceArtists[svcId];
                      const selectedArtist = staff.find(s => s.id === selectedArtistId);
                      const isSelectedArtistSuggested = selectedArtistId && suggestedArtistIds.includes(selectedArtistId);
                      
                      const currentPrice = customPrices[svcId] ?? (isVariablePrice ? (svc.price_from || 0) : (svc.price || 0));
                      
                      function openConfigModal() {
                        setConfiguringServiceId(svcId);
                        setTempArtistId(selectedArtistId || '');
                        setTempCustomPrice(customPrices[svcId] ?? null);
                        setShowServiceConfig(true);
                      }
                      
                      return (
                        <div key={svcId} className={cn(
                          "border border-gray-200 rounded-xl p-3 bg-gray-50",
                          isInactive && "opacity-60"
                        )}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{catIcon}</span>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">{svc.name}</p>
                                {isInactive && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 font-medium">
                                    Inactivo
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {selectedArtist ? (
                                  <span className={cn(
                                    "text-xs",
                                    isSelectedArtistSuggested ? "text-salon-600" : "text-gray-500"
                                  )}>
                                    {selectedArtist.name}
                                    {isSelectedArtistSuggested && (
                                      <span className="ml-1 text-salon-500">(sugerida)</span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Sin artista
                                  </span>
                                )}
                                
                                <span className="text-xs text-gray-400">{svc.duration_min} min</span>
                                
                                <span className={cn(
                                  "text-sm font-semibold",
                                  isVariablePrice ? "text-amber-600" : "text-gray-700"
                                )}>
                                  {formatCurrency(currentPrice)}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={openConfigModal}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-salon-600 hover:bg-salon-100 transition-colors"
                            >
                              <Settings2 className="w-4 h-4" />
                              Configurar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>

               {/* Summary */}
               <div className="flex items-center gap-4 p-3 rounded-xl bg-salon-50">
                 <div className="flex items-center gap-1.5 text-sm text-salon-700">
                   <Clock className="w-4 h-4" /> {totalDuration} min
                 </div>
                 <div className="text-sm font-semibold text-salon-700">
                   {formatCurrency(calculateTotalPrice())}
                 </div>
               </div>
             </>
           )}

          {overlapWarning && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {overlapWarning}
            </div>
          )}

          {/* Color picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '', label: 'Auto', bg: 'bg-gradient-to-br from-gray-200 to-gray-300' },
                { value: 'rose', label: 'Rosa', bg: 'bg-rose-500' },
                { value: 'violet', label: 'Violeta', bg: 'bg-violet-500' },
                { value: 'blue', label: 'Azul', bg: 'bg-blue-500' },
                { value: 'emerald', label: 'Verde', bg: 'bg-emerald-500' },
                { value: 'amber', label: 'Ámbar', bg: 'bg-amber-500' },
                { value: 'cyan', label: 'Cian', bg: 'bg-cyan-500' },
                { value: 'pink', label: 'Fucsia', bg: 'bg-pink-500' },
                { value: 'teal', label: 'Teal', bg: 'bg-teal-500' },
                { value: 'red', label: 'Rojo', bg: 'bg-red-500' },
                { value: 'orange', label: 'Naranja', bg: 'bg-orange-500' },
                { value: 'indigo', label: 'Índigo', bg: 'bg-indigo-500' },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, color: c.value })}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all border-2',
                    c.bg,
                    form.color === c.value ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                  )}
                  title={c.label}
                />
              ))}
             </div>
           </div>

           {!editingAppt && (
             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
               <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-gray-700">Adelanto de S/10</span>
                 <span className="text-xs text-gray-500">(para separar la cita)</span>
               </div>
               <button
                 type="button"
                 onClick={() => setAdvancePaid(!advancePaid)}
                 className={cn(
                   "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-salon-500 focus-visible:ring-offset-2",
                   advancePaid ? "bg-salon-600" : "bg-gray-200"
                 )}
               >
                 <span
                   className={cn(
                     "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                     advancePaid ? "translate-x-5" : "translate-x-0"
                   )}
                 />
               </button>
             </div>
           )}

           <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas especiales..." />

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-gray-100">
            {canDeleteAppt && (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
                onClick={deleteAppt}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Eliminar
              </Button>
            )}
            
            <div className="hidden sm:block flex-1" />
            
            <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { setShowModal(false); setEditingAppt(null); }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={submitting}
                disabled={!form.start_time || (editingAppt && !haveChanges())}
              >
                {submitting ? 'Guardando...' : (editingAppt ? 'Actualizar' : 'Crear cita')}
              </Button>
            </div>
          </div>
          </form>
        </Modal>

        {/* Service Config Modal */}
        <Modal
          open={showServiceConfig}
          onClose={() => setShowServiceConfig(false)}
          title={(() => {
            const svc = services.find(s => s.id === configuringServiceId);
            return `⚙️ Configurar: ${svc?.name || 'Servicio'}`;
          })()}
        >
          {configuringServiceId && (() => {
            const svc = services.find(s => s.id === configuringServiceId);
            if (!svc) return null;
            
            const availableArtists = getAvailableArtistsForService(svc.id, svc.category_id, staff, services);
            const isVariablePrice = svc.price_type === 'variable';
            const suggestedArtistIds = availableArtists.map(a => a.id);
            const isSelectedArtistSuggested = tempArtistId && suggestedArtistIds.includes(tempArtistId);
            const defaultPrice = isVariablePrice ? (svc.price_from || 0) : (svc.price || 0);
            
            function handleSaveConfig() {
              const svcId = configuringServiceId;
              if (!svcId) return;
              
              if (tempArtistId) {
                setServiceArtists({ ...serviceArtists, [svcId]: tempArtistId });
              } else {
                const newMap = { ...serviceArtists };
                delete newMap[svcId];
                setServiceArtists(newMap);
              }
              
              if (tempCustomPrice !== null) {
                setCustomPrices({ ...customPrices, [svcId]: tempCustomPrice });
              }
              
              checkForOverlap();
              setShowServiceConfig(false);
            }
            
            async function handleRemoveService() {
              const svcId = configuringServiceId;
              if (!svcId) return;
              const svc = services.find(s => s.id === svcId);
              if (!svc) return;
              
              const confirmed = await confirm({
                title: 'Quitar servicio',
                message: `¿Quitar "${svc.name}" de la cita?`,
                confirmText: 'Quitar',
                cancelText: 'Cancelar',
                variant: 'warning',
              });
              
              if (!confirmed) return;
              
              setSelectedServices(selectedServices.filter(id => id !== svcId));
              const newMap = { ...serviceArtists };
              delete newMap[svcId];
              setServiceArtists(newMap);
              const newPrices = { ...customPrices };
              delete newPrices[svcId];
              setCustomPrices(newPrices);
              
              setShowServiceConfig(false);
              checkForOverlap();
            }
            
            return (
              <div className="space-y-4">
                {/* Artist */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Artista</label>
                  <select
                    value={tempArtistId}
                    onChange={(e) => setTempArtistId(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-salon-500 focus:border-transparent"
                  >
                    <option value="">Sin artista</option>
                    {availableArtists.map((s: StaffMember) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {isSelectedArtistSuggested && (
                    <p className="text-xs text-salon-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Sugerida para este servicio
                    </p>
                  )}
                  {suggestedArtistIds.length > 1 && (
                    <p className="text-xs text-gray-400">
                      {suggestedArtistIds.length} artistas sugeridos para este servicio
                    </p>
                  )}
                </div>
                
                {/* Price - Always editable */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Precio</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-400 text-sm font-medium select-none">S/</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={tempCustomPrice ?? defaultPrice}
                      onChange={(e) => {
                        setTempCustomPrice(e.target.value ? parseFloat(e.target.value) : 0);
                      }}
                      placeholder={isVariablePrice 
                        ? (svc.price_from ? `Desde ${svc.price_from}` : '0')
                        : (svc.price ? `${svc.price}` : '0')
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent"
                    />
                  </div>
                  {isVariablePrice && svc.price_from && (
                    <p className="text-xs text-amber-600">
                      Rango sugerido: S/{svc.price_from} - {svc.price_to ? `S/${svc.price_to}` : 'Sin límite'}
                    </p>
                  )}
                  {!isVariablePrice && (
                    <p className="text-xs text-gray-400">
                      Precio estándar del servicio: {formatCurrency(svc.price)}
                    </p>
                  )}
                </div>
                
                {/* Duration - read only */}
                <div className="flex items-center gap-2 pt-1 pb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Duración: {svc.duration_min} min</span>
                  <span className="text-xs text-gray-400">(no modificable)</span>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
                    onClick={handleRemoveService}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Quitar servicio
                  </Button>
                  
                  <div className="hidden sm:block flex-1" />
                  
                  <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowServiceConfig(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleSaveConfig}
                    >
                      Guardar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
         </Modal>

        {/* Service Selector Modal */}
        <Modal
          open={showServiceSelector}
          onClose={() => setShowServiceSelector(false)}
          title="Seleccionar servicios"
        >
          {(() => {
            const activeServices = services.filter(s => s.active);
            
            const categoriesForFilter = (() => {
              const byCategory: Record<string, { id: string; name: string; icon: string; sort_order: number }> = {};
              activeServices.forEach(s => {
                if (s.category_id && !byCategory[s.category_id]) {
                  byCategory[s.category_id] = {
                    id: s.category_id,
                    name: s.category?.name || 'Otros',
                    icon: s.category?.icon || '📋',
                    sort_order: s.category?.sort_order ?? 999,
                  };
                }
              });
              return Object.values(byCategory).sort((a, b) => a.sort_order - b.sort_order);
            })();
            
            const filteredServices = activeServices.filter(s => {
              if (selectorSearch) {
                const searchLower = selectorSearch.toLowerCase();
                const matchesSearch = s.name.toLowerCase().includes(searchLower);
                const matchesCategory = (s.category?.name || '').toLowerCase().includes(searchLower);
                if (!matchesSearch && !matchesCategory) return false;
              }
              if (selectorCategoryFilter && s.category_id !== selectorCategoryFilter) {
                return false;
              }
              return true;
            });
            
             function handleToggleService(serviceId: string) {
               const svc = services.find(s => s.id === serviceId);
               
               if (selectedInSelector.includes(serviceId)) {
                 setSelectedInSelector(selectedInSelector.filter(id => id !== serviceId));
                 const newArtists = { ...selectorArtists };
                 delete newArtists[serviceId];
                 setSelectorArtists(newArtists);
                 const newPrices = { ...selectorPrices };
                 delete newPrices[serviceId];
                 setSelectorPrices(newPrices);
               } else {
                 setSelectedInSelector([...selectedInSelector, serviceId]);
                 
                 if (svc && !selectorArtists[serviceId]) {
                   const artists = getAvailableArtistsForService(svc.id, svc.category_id, staff, services);
                   if (artists.length === 1) {
                     setSelectorArtists({ ...selectorArtists, [serviceId]: artists[0].id });
                   }
                 }
                 
                 if (svc && selectorPrices[serviceId] === undefined) {
                   const defaultPrice = svc.price_type === 'variable' 
                     ? (svc.price_from || 0) 
                     : (svc.price || 0);
                   setSelectorPrices({ ...selectorPrices, [serviceId]: defaultPrice });
                 }
                 
                 setTimeout(() => {
                   const element = document.getElementById(`service-selector-${serviceId}`);
                   if (element) {
                     element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                   }
                 }, 100);
               }
             }
            
            function handleConfirmSelection() {
              const newSelectedIds = [...selectedInSelector];
              
              const newArtists: Record<string, string> = {};
              const newPrices: Record<string, number> = {};
              
              newSelectedIds.forEach(svcId => {
                if (selectorArtists[svcId]) {
                  newArtists[svcId] = selectorArtists[svcId];
                }
                if (selectorPrices[svcId] !== undefined && selectorPrices[svcId] !== null) {
                  newPrices[svcId] = selectorPrices[svcId];
                }
              });
              
              setSelectedServices(newSelectedIds);
              setServiceArtists(newArtists);
              setCustomPrices(newPrices);
              
              checkForOverlap();
              setShowServiceSelector(false);
            }
            
            return (
              <div className="space-y-4">
                 {/* Search */}
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input
                     type="text"
                     value={selectorSearch}
                     onChange={(e) => setSelectorSearch(e.target.value)}
                     placeholder="Buscar servicio..."
                     className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500"
                   />
                 </div>
                
                {/* Category filters */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectorCategoryFilter('')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      !selectorCategoryFilter
                        ? 'bg-salon-100 text-salon-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    Todos
                  </button>
                  {categoriesForFilter.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectorCategoryFilter(cat.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                        selectorCategoryFilter === cat.id
                          ? 'bg-salon-100 text-salon-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
                
                {/* Selected count */}
                {selectedInSelector.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-salon-600">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">{selectedInSelector.length} servicio{selectedInSelector.length !== 1 ? 's' : ''} seleccionado{selectedInSelector.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                
                 {/* Services list with inline config */}
                 <div className="space-y-1.5 max-h-80 overflow-y-auto">
                   {filteredServices.length === 0 ? (
                     <div className="py-8 text-center text-gray-400 text-sm">
                       No hay servicios que coincidan
                     </div>
                   ) : (
                     filteredServices.map(svc => {
                       const isSelected = selectedInSelector.includes(svc.id);
                       const isVariablePrice = svc.price_type === 'variable';
                       const catIcon = svc.category?.icon || '📋';
                       
                       const availableArtists = getAvailableArtistsForService(svc.id, svc.category_id, staff, services);
                       const suggestedArtistIds = availableArtists.map(a => a.id);
                       const selectedArtistId = selectorArtists[svc.id];
                       const selectedArtist = staff.find(s => s.id === selectedArtistId);
                       const isSelectedArtistSuggested = selectedArtistId && suggestedArtistIds.includes(selectedArtistId);
                       
                       const currentPrice = selectorPrices[svc.id] ?? (isVariablePrice ? (svc.price_from || 0) : (svc.price || 0));
                       
                       let priceLabel = '';
                       if (isVariablePrice) {
                         if (svc.price_from && svc.price_to) {
                           priceLabel = `S/${svc.price_from}-${svc.price_to}`;
                         } else if (svc.price_from) {
                           priceLabel = `S/${svc.price_from}+`;
                         } else {
                           priceLabel = 'Variable';
                         }
                       } else {
                         priceLabel = `S/${svc.price}`;
                       }
                       
                       const artistOptions = [
                         { value: '', label: 'Sin artista' },
                         ...availableArtists.map(s => ({ value: s.id, label: s.name })),
                       ];
                       
                       return (
                         <div 
                           key={svc.id}
                           id={`service-selector-${svc.id}`}
                           className={cn(
                             'rounded-xl transition-colors overflow-hidden',
                             isSelected ? 'bg-salon-50 border border-salon-200' : 'border border-transparent hover:bg-gray-50'
                           )}
                         >
                           {/* Header - click anywhere (except interactive elements) to toggle selection */}
                           <div 
                             className="flex items-center gap-3 p-2.5 cursor-pointer"
                             onClick={() => handleToggleService(svc.id)}
                           >
                             <div className={cn(
                               'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0',
                               isSelected
                                 ? 'bg-salon-500 border-salon-500'
                                 : 'border-gray-300'
                             )}>
                               {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                             </div>
                             
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                 <span className="text-sm">{catIcon}</span>
                                 <span className="text-sm font-medium text-gray-900 truncate">{svc.name}</span>
                               </div>
                               <div className="flex items-center gap-3 mt-0.5">
                                 <span className="text-xs text-gray-400">{svc.duration_min} min</span>
                                 <span className={cn(
                                   'text-xs font-medium',
                                   isVariablePrice ? 'text-amber-600' : 'text-gray-500'
                                 )}>
                                   {priceLabel}
                                 </span>
                               </div>
                             </div>
                           </div>
                           
                           {/* Expanded section - only when selected */}
                           {isSelected && (
                             <div className="px-3 pb-3 pt-1 ml-8 space-y-3 border-t border-salon-100">
                               {/* Artist - Using Select component */}
                               <div onClick={(e) => e.stopPropagation()}>
                                 <Select
                                   label="Artista"
                                   value={selectedArtistId || ''}
                                   onChange={(val) => {
                                     if (val) {
                                       setSelectorArtists({ ...selectorArtists, [svc.id]: val });
                                     } else {
                                       const newMap = { ...selectorArtists };
                                       delete newMap[svc.id];
                                       setSelectorArtists(newMap);
                                     }
                                   }}
                                   options={artistOptions}
                                   placeholder="Seleccionar artista..."
                                 />
                                 {isSelectedArtistSuggested && selectedArtist && (
                                   <p className="text-xs text-salon-600 flex items-center gap-1 mt-1.5">
                                     <Sparkles className="w-3 h-3" /> 
                                     <span className="font-medium">{selectedArtist.name}</span> sugerida para este servicio
                                   </p>
                                 )}
                                 {!selectedArtistId && suggestedArtistIds.length > 0 && (
                                   <p className="text-xs text-gray-400 mt-1.5">
                                     {suggestedArtistIds.length} artista{suggestedArtistIds.length !== 1 ? 's' : ''} sugerido{suggestedArtistIds.length !== 1 ? 's' : ''}
                                   </p>
                                 )}
                               </div>
                               
                                {/* Price - Following services/page.tsx pattern */}
                                <div onClick={(e) => e.stopPropagation()} className="space-y-1.5">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Precio
                                  </label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                      <span className="text-gray-400 text-sm font-medium select-none">S/</span>
                                    </div>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={currentPrice}
                                      onChange={(e) => {
                                        setSelectorPrices({ 
                                          ...selectorPrices, 
                                          [svc.id]: e.target.value ? parseFloat(e.target.value) : 0 
                                        });
                                      }}
                                      placeholder={isVariablePrice 
                                        ? (svc.price_from ? `Desde ${svc.price_from}` : '0')
                                        : (svc.price ? `${svc.price}` : '0')
                                      }
                                      className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent placeholder:text-gray-300"
                                    />
                                  </div>
                                  {isVariablePrice && svc.price_from && (
                                    <p className="text-xs text-amber-600 mt-1.5">
                                      Rango sugerido: S/{svc.price_from} - {svc.price_to ? `S/${svc.price_to}` : 'Sin límite'}
                                    </p>
                                  )}
                                  {!isVariablePrice && (
                                    <p className="text-xs text-gray-400 mt-1.5">
                                      Precio estándar del servicio: {formatCurrency(svc.price)}
                                    </p>
                                  )}
                                </div>
                             </div>
                           )}
                         </div>
                       );
                     })
                   )}
                 </div>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                  <div className="hidden sm:block flex-1" />
                  
                  <div className="flex flex-1 sm:flex-none gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowServiceSelector(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleConfirmSelection}
                      disabled={selectedInSelector.length === 0}
                    >
                      Agregar ({selectedInSelector.length})
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      </>
  );
}
