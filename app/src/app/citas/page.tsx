'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAppointments, getStaff, getServices } from '@/lib/db/queries';
import { createAppointment, updateAppointment, checkOverlap } from '@/lib/db/queries';
import { ClientCombobox } from '@/components/citas/ClientCombobox';
import type { AppointmentInsert, AppointmentStatus, ServiceCategory, PaymentKind } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { CalendarView } from '@/components/citas/CalendarView';
import { formatCurrency, formatTime, formatDate, startOfToday, endOfToday, startOfWeek, cn } from '@/lib/utils';
import { SERVICE_CATEGORY_LABELS, APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { CalendarDays, Plus, Clock, User, DollarSign, AlertTriangle, Check, Pencil, XCircle, X, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

type ListFilter = 'list' | 'day' | 'week';
type ViewMode = 'list' | 'calendar';

const SERVICE_EMOJIS: Record<string, string> = {
  sistema_unas: '💅',
  pedicura: '🦶',
  makeup: '💄',
  pestanas: '👁️',
  cejas: '✨',
};

function getServiceEmoji(appt: any): string {
  const svc = appt.appointment_services?.[0]?.service;
  if (svc?.category) return SERVICE_EMOJIS[svc.category] || '📋';
  return '📋';
}

function toLocalISO(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CitasPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [listFilter, setListFilter] = useState<ListFilter>('list');
  const [filterArtist, setFilterArtist] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: '',
    client_id: '',
    artist_id: '',
    start_time: '',
    status: 'programada' as AppointmentInsert['status'],
    notes: '',
    color: '',
  });

  async function load() {
    setLoading(true);
    try {
      let dateFrom: string | undefined;
      let dateTo: string | undefined;

      if (listFilter === 'day') {
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
        getServices(),
      ]);
      setAppointments(appts as any[]);
      setStaff(s as any[]);
      setServices(svcs as any[]);
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

  const totalPrice = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + Number(s.price), 0);

  const totalDuration = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + Number(s.duration_min), 0);

  async function checkForOverlap() {
    if (!form.artist_id || !form.start_time || totalDuration === 0) return;
    const start = new Date(form.start_time);
    const end = new Date(start.getTime() + totalDuration * 60000);
    const overlaps = await checkOverlap(form.artist_id, start.toISOString(), end.toISOString());
    if (overlaps.length > 0) {
      setOverlapWarning(`⚠️ Conflicto con: ${overlaps[0].title}`);
    } else {
      setOverlapWarning(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.start_time) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    const startTime = new Date(form.start_time);
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    const apptData: AppointmentInsert & { serviceIds?: string[] } = {
      title: form.title || 'Cita',
      client_id: form.client_id || null,
      artist_id: form.artist_id || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: form.status,
      total_price: totalPrice,
      total_duration_min: totalDuration,
      notes: form.notes || null,
      color: form.color || null,
      overlap_detected: !!overlapWarning,
      serviceIds: selectedServices,
    };

    try {
      if (editingAppt) {
        await updateAppointment(editingAppt.id, apptData);
        toast.success('Cita actualizada');
      } else {
        await createAppointment(apptData);
        toast.success('Cita creada');
      }
      setShowModal(false);
      setEditingAppt(null);
      load();
    } catch (e: any) {
      toast.error('Error: ' + (e.message || 'No se pudo guardar'));
    }
  }

  function openEdit(appt: any) {
    setEditingAppt(appt);
    setForm({
      title: appt.title,
      client_id: appt.client_id || '',
      artist_id: appt.artist_id || '',
      start_time: toLocalISO(appt.start_time),
      status: appt.status,
      notes: appt.notes || '',
      color: appt.color || '',
    });
    // Pre-select services
    const svcIds = appt.appointment_services?.map((as: any) => as.service_id) || [];
    setSelectedServices(svcIds);
    setShowModal(true);
  }

  function openNew() {
    setEditingAppt(null);
    setForm({
      title: '',
      client_id: '',
      artist_id: '',
      start_time: '',
      status: 'programada',
      notes: '',
      color: '',
    });
    setSelectedServices([]);
    setOverlapWarning(null);
    setShowModal(true);
  }

  function openNewForDate(date: Date) {
    setEditingAppt(null);
    const timeStr = date.toISOString().slice(0, 16);
    setForm({
      title: '',
      client_id: '',
      artist_id: '',
      start_time: timeStr,
      status: 'programada',
      notes: '',
      color: '',
    });
    setSelectedServices([]);
    setOverlapWarning(null);
    setShowModal(true);
  }

  async function cancelAppt(appt: any) {
    if (!confirm(`¿Cancelar la cita "${appt.title}"?`)) return;
    try {
      await updateAppointment(appt.id, { status: 'cancelada' });
      toast.success('Cita cancelada');
      load();
    } catch (e) {
      toast.error('Error al cancelar');
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
                    className="hover:border-salon-300 transition-all cursor-pointer"
                    onClick={() => { setSelectedAppt(appt); setShowDetail(true); }}
                  >
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="text-center w-14 flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{formatTime(appt.start_time)}</p>
                        <p className="text-xs text-gray-400">{appt.total_duration_min} min</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{appt.title}</p>
                        <p className="text-xs text-gray-400">
                          {appt.client?.name && `${appt.client.name} · `}{appt.artist?.name}
                        </p>
                        {appt.appointment_services?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {appt.appointment_services.map((as: any, i: number) => (
                              <Badge key={i} variant="default" className="text-[10px]">
                                {as.service.name}
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
            <div className="relative">
              <div className={cn(
                'h-2',
                selectedAppt.status === 'cancelada' ? 'bg-red-500'
                : selectedAppt.status === 'completada' ? 'bg-emerald-500'
                : 'bg-salon-500'
              )} />
              <button
                onClick={() => setShowDetail(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{getServiceEmoji(selectedAppt)}</span>
                  <h3 className="text-lg font-semibold">{selectedAppt.title}</h3>
                </div>
                <p className={cn(
                  'text-sm font-medium',
                  selectedAppt.status === 'cancelada' ? 'text-red-500' : 'text-gray-500'
                )}>
                  {APPOINTMENT_STATUS_LABELS[selectedAppt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{format(new Date(selectedAppt.start_time), "EEEE d 'de' MMMM", { locale: es })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {formatTime(selectedAppt.start_time)} — {formatTime(selectedAppt.end_time || selectedAppt.start_time)}
                    {' '}({selectedAppt.total_duration_min} min)
                  </span>
                </div>
                {selectedAppt.client && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{selectedAppt.client.name}</span>
                  </div>
                )}
                {selectedAppt.artist && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{selectedAppt.artist.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold">{formatCurrency(selectedAppt.total_price)}</span>
                </div>
              </div>

              {selectedAppt.appointment_services?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedAppt.appointment_services.map((as: any, i: number) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                      {SERVICE_EMOJIS[as.service?.category] || ''} {as.service?.name}
                    </span>
                  ))}
                </div>
              )}

              {selectedAppt.notes && (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">{selectedAppt.notes}</p>
              )}

              <div className="flex gap-2 pt-2">
                {selectedAppt.status !== 'cancelada' && selectedAppt.status !== 'completada' && (
                  <button
                    onClick={() => { cancelAppt(selectedAppt); setShowDetail(false); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Cancelar
                  </button>
                )}
                <button
                  onClick={() => { openEdit(selectedAppt); setShowDetail(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-salon-600 hover:bg-salon-700 transition-colors"
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
          <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Manicure + Pedicure" />
          <ClientCombobox value={form.client_id} onChange={(id) => setForm({ ...form, client_id: id })} />
          <Select label="Artista" value={form.artist_id} onChange={(e) => { setForm({ ...form, artist_id: e.target.value }); checkForOverlap(); }} options={[
            { value: '', label: 'Seleccionar...' },
            ...staff.map((s: any) => ({ value: s.id, label: s.name }))
          ]} />
          <DateTimePicker value={form.start_time} onChange={(v) => { setForm({ ...form, start_time: v }); checkForOverlap(); }} />

          {/* Service Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Servicios</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {services.map((svc: any) => (
                <label key={svc.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(svc.id)}
                    onChange={(e) => {
                      setSelectedServices(e.target.checked
                        ? [...selectedServices, svc.id]
                        : selectedServices.filter(id => id !== svc.id)
                      );
                    }}
                    className="rounded border-gray-300 text-salon-600 focus:ring-salon-500"
                  />
                  <span className="text-sm flex-1">{svc.name}</span>
                  <span className="text-xs text-gray-400">{svc.duration_min} min</span>
                  <span className="text-sm font-medium">{formatCurrency(Number(svc.price))}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedServices.length > 0 && (
            <div className="flex items-center gap-4 p-3 rounded-xl bg-salon-50">
              <div className="flex items-center gap-1.5 text-sm text-salon-700">
                <Clock className="w-4 h-4" /> {totalDuration} min
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-salon-700">
                <DollarSign className="w-4 h-4" /> {formatCurrency(totalPrice)}
              </div>
            </div>
          )}

          {overlapWarning && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {overlapWarning}
            </div>
          )}

          <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentInsert['status'] })} options={Object.entries(APPOINTMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />

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

          <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas especiales..." />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingAppt(null); }}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={!form.start_time}>
              <Check className="w-4 h-4 mr-1" /> {editingAppt ? 'Actualizar' : 'Crear cita'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
