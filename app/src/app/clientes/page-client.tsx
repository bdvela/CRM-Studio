'use client';

import { useEffect, useState, useReducer, useRef } from 'react';
import { getClients, createClient, updateClient, deleteClient, getClientById, getAppointments } from '@/lib/db/queries';
import type { Client, ClientInsert, ClientStatus } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { FlagPeru } from '@/components/ui/FlagPeru';
import { formatCurrency, formatDate, formatTime, normalizePeruPhone, formatPeruPhoneForInput } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { useConfirm } from '@/context/confirm-context';
import {
  Users, Plus, Search, Phone, Mail, Instagram, CalendarDays,
  DollarSign, Clock, Trash2, Edit, X, User, Calendar,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { AppointmentStatus } from '@/types/database';

const FORM_INIT: ClientInsert = {
  name: '', phone: '', email: '', instagram: '', status: 'prospecto', notes: '', photo_url: null,
};

const EDIT_FORM_INIT: ClientInsert = {
  name: '', phone: '', email: '', instagram: '', status: 'prospecto', notes: '', photo_url: null,
};

function formReducer(state: ClientInsert, action: Partial<ClientInsert>) {
  return { ...state, ...action };
}

const statusBadge: Record<string, 'success' | 'warning' | 'danger' | 'purple'> = {
  prospecto: 'warning', activa: 'success', inactiva: 'danger', vip: 'purple',
};
const statusLabels: Record<string, string> = {
  prospecto: 'Prospecto', activa: 'Activa', inactiva: 'Inactiva', vip: 'VIP',
};

const STATUS_OPTIONS = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'prospecto' as const, label: 'Prospecto' },
  { value: 'activa' as const, label: 'Activa' },
  { value: 'inactiva' as const, label: 'Inactiva' },
  { value: 'vip' as const, label: 'VIP' },
];

const statusConfigByStatus = {
  completada: { color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
  programada: { color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
  cancelada: { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
  no_show: { color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' },
  en_curso: { color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
};

function groupByStatus(clients: Client[]): Record<string, Client[]> {
  return clients.reduce((acc, c) => {
    const key = c.status;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<string, Client[]>);
}

const STATUS_ORDER: ClientStatus[] = ['activa', 'vip', 'prospecto', 'inactiva'];

interface ClientesUIState {
  loading: boolean;
  submitting: boolean;
  showCreateModal: boolean;
  showDetailModal: boolean;
  viewingClient: Client | null;
  editingClient: Client | null;
  clientAppointments: any[];
  search: string;
  statusFilter: string;
  activeModalTab: 'info' | 'history';
  saving: boolean;
  deleting: boolean;
}

const CLIENTS_UI_INIT: ClientesUIState = {
  loading: true, submitting: false, showCreateModal: false,
  showDetailModal: false, viewingClient: null, editingClient: null,
  clientAppointments: [], search: '', statusFilter: 'all',
  activeModalTab: 'info', saving: false, deleting: false,
};

function clientesUIReducer(state: ClientesUIState, action: Partial<ClientesUIState>): ClientesUIState {
  return { ...state, ...action };
}

export default function ClientesPage({ initialClients }: { initialClients?: Client[] }) {
  const { push } = useRouter();
  const { confirm } = useConfirm();
  const [clients, setClients] = useState<Client[]>(initialClients || []);
  const [ui, dispatchUI] = useReducer(clientesUIReducer, { ...CLIENTS_UI_INIT, loading: !initialClients });
  const [form, dispatchForm] = useReducer(formReducer, FORM_INIT);
  const [editForm, dispatchEditForm] = useReducer(formReducer, EDIT_FORM_INIT);
  const skipInitialLoad = useRef(!!initialClients);
  const initialEditFormRef = useRef<ClientInsert | null>(null);

  async function load() {
    try {
      const data = await getClients();
      setClients(data as unknown as Client[]);
    } catch (e) {
      console.error(e);
    } finally {
      dispatchUI({ loading: false });
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) { skipInitialLoad.current = false; return; }
    load();
  }, []);

  async function openDetail(client: Client) {
    try {
      const [fullClient, appointments] = await Promise.all([
        getClientById(client.id),
        getAppointments({ clientId: client.id }),
      ]);
      dispatchUI({
        viewingClient: fullClient as unknown as Client,
        clientAppointments: appointments,
        showDetailModal: true,
        activeModalTab: 'info',
      });
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar datos');
    }
  }

  function closeDetail() {
    dispatchUI({ showDetailModal: false, viewingClient: null, editingClient: null, clientAppointments: [] });
  }

  function openEdit() {
    if (!ui.viewingClient) return;
    const client = ui.viewingClient;
    const formData: ClientInsert = {
      name: client.name, phone: client.phone || '', email: client.email || '',
      instagram: client.instagram || '', status: client.status, notes: client.notes || '', photo_url: client.photo_url,
    };
    dispatchEditForm(formData);
    initialEditFormRef.current = { ...formData };
    dispatchUI({ editingClient: client });
  }

  function haveEditChanges(): boolean {
    if (!editForm || !initialEditFormRef.current) return false;
    return Object.keys(editForm).some(key => {
      const k = key as keyof ClientInsert;
      return editForm[k] !== initialEditFormRef.current?.[k];
    });
  }

  function isEditFormValid(): boolean {
    return editForm.name.trim().length > 0;
  }

  async function handleEditSave() {
    if (!ui.editingClient || !isEditFormValid()) return;
    dispatchUI({ saving: true });
    try {
      await updateClient(ui.editingClient.id, editForm);
      toast.success('Datos actualizados');
      dispatchUI({ editingClient: null });
      load();
      const [updated] = await Promise.all([
        getClientById(ui.editingClient.id),
        getAppointments({ clientId: ui.editingClient.id }),
      ]);
      dispatchUI({ viewingClient: updated as unknown as Client });
    } catch (e) {
      toast.error('Error al actualizar');
    } finally {
      dispatchUI({ saving: false });
    }
  }

  async function handleDelete() {
    if (!ui.viewingClient) return;
    const confirmed = await confirm({
      title: 'Eliminar clienta',
      message: `¿Eliminar a ${ui.viewingClient.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar', cancelText: 'Cancelar', variant: 'danger',
    });
    if (!confirmed) return;
    dispatchUI({ deleting: true });
    try {
      await deleteClient(ui.viewingClient.id);
      toast.success('Clienta eliminada');
      closeDetail();
      load();
    } catch (e) {
      toast.error('Error al eliminar');
    } finally {
      dispatchUI({ deleting: false });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (ui.submitting) return;
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    const normalizedPhone = normalizePeruPhone(form.phone);
    const formToSave = { ...form, phone: normalizedPhone };
    dispatchUI({ submitting: true });
    try {
      await createClient(formToSave);
      toast.success('Clienta creada');
      dispatchUI({ showCreateModal: false });
      dispatchForm(FORM_INIT);
      load();
    } catch (e) {
      toast.error('Error al crear');
    } finally {
      dispatchUI({ submitting: false });
    }
  }

  const filteredBySearch = clients.filter((c) =>
    c.name.toLowerCase().includes(ui.search.toLowerCase()) ||
    (c.phone || '').includes(ui.search) ||
    (c.instagram || '').toLowerCase().includes(ui.search.toLowerCase())
  );
  const filtered = ui.statusFilter === 'all'
    ? filteredBySearch
    : filteredBySearch.filter(c => c.status === ui.statusFilter);
  const grouped = groupByStatus(filtered);

  return (
    <>
      <Header title="Clientes" action={
        <Button size="sm" onClick={() => dispatchUI({ showCreateModal: true })}>
          <Plus className="size-4 mr-1" /> Nueva
        </Button>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o Instagram..."
              value={ui.search}
              onChange={(e) => dispatchUI({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-t-white/50 border-b-white/20 border-l-white/30 border-r-white/30 bg-white/40 backdrop-blur-lg text-base focus:outline-none focus:ring-2 focus:ring-salon-500/50 focus:border-salon-500/50"
            />
          </div>
          <div className="w-full sm:w-48 flex-shrink-0">
            <Select
              value={ui.statusFilter}
              onChange={(value) => dispatchUI({ statusFilter: value })}
              options={STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            />
          </div>
        </div>

        {/* Client List */}
        {ui.loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={'skel-' + i} className="h-16 rounded-2xl bg-zinc-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-zinc-400">
            <Users className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay clientas {ui.search ? 'que coincidan' : 'registradas'}</p>
          </CardContent></Card>
        ) : ui.statusFilter === 'all' ? (
          <div className="space-y-6">
            {STATUS_ORDER.map((status) => {
              const items = grouped[status] || [];
              if (items.length === 0) return null;
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={statusBadge[status]} className="text-xs">{statusLabels[status]}</Badge>
                    <span className="text-xs text-zinc-400">{items.length} clienta{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((client) => (
                      <ClientCard key={client.id} client={client} onClick={() => openDetail(client)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((client) => (
              <ClientCard key={client.id} client={client} onClick={() => openDetail(client)} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={ui.showCreateModal} onClose={() => dispatchUI({ showCreateModal: false })} title="Nueva Clienta">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={(value) => dispatchForm({ name: value })} placeholder="Nombre completo" minLength={2} maxLength={100} />
          <Input label="Teléfono" leftPrefix={<FlagPeru className="size-5" />} value={form.phone || ''} onChange={(value) => dispatchForm({ phone: formatPeruPhoneForInput(value) })} placeholder="987 654 321" maxLength={11} />
          <Input label="Email" type="email" value={form.email || ''} onChange={(value) => dispatchForm({ email: value })} placeholder="email@ejemplo.com" maxLength={100} />
          <Input label="Instagram" value={form.instagram || ''} onChange={(value) => dispatchForm({ instagram: value })} placeholder="@usuario" maxLength={50} />
          <Select label="Estado" value={form.status} onChange={(value) => dispatchForm({ status: value as ClientInsert['status'] })} options={[
            { value: 'prospecto', label: 'Prospecto' },
            { value: 'activa', label: 'Activa' },
            { value: 'inactiva', label: 'Inactiva' },
            { value: 'vip', label: 'VIP' },
          ]} />
          <Textarea label="Notas" value={form.notes || ''} onChange={(value) => dispatchForm({ notes: value })} placeholder="Preferencias, alergias, etc." maxLength={500} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => dispatchUI({ showCreateModal: false })}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={ui.submitting}>{ui.submitting ? 'Guardando...' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={ui.showDetailModal}
        onClose={closeDetail}
        title="Detalle de clienta"
      >
        {ui.viewingClient && (
          <div>
            {ui.editingClient ? (
              /* Edit Mode */
              <div>
                <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6 pb-4 sm:pb-5 border-b border-zinc-100">
                  <div className="size-12 sm:size-14 rounded-full bg-gradient-to-br from-salon-100 to-accent-100 flex items-center justify-center text-salon-600 font-bold text-lg sm:text-xl shadow-inner">
                    {ui.viewingClient.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900">{ui.viewingClient.name}</h3>
                    <p className="text-xs sm:text-sm text-zinc-400">Editando información</p>
                  </div>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleEditSave(); }} className="space-y-4">
                  <Input label="Nombre" value={editForm.name} onChange={(value) => dispatchEditForm({ name: value })} placeholder="Nombre completo" minLength={2} maxLength={100} />
                  <Input label="Teléfono" value={editForm.phone || ''} onChange={(value) => dispatchEditForm({ phone: value })} placeholder="987 654 321" maxLength={11} />
                  <Input label="Email" type="email" value={editForm.email || ''} onChange={(value) => dispatchEditForm({ email: value })} placeholder="email@ejemplo.com" maxLength={100} />
                  <Input label="Instagram" value={editForm.instagram || ''} onChange={(value) => dispatchEditForm({ instagram: value })} placeholder="@usuario" maxLength={50} />
                  <Select label="Estado" value={editForm.status} onChange={(value) => dispatchEditForm({ status: value as ClientInsert['status'] })} options={[
                    { value: 'prospecto', label: 'Prospecto' },
                    { value: 'activa', label: 'Activa' },
                    { value: 'inactiva', label: 'Inactiva' },
                    { value: 'vip', label: 'VIP' },
                  ]} />
                  <Textarea label="Notas" value={editForm.notes || ''} onChange={(value) => dispatchEditForm({ notes: value })} placeholder="Preferencias, alergias, notas..." maxLength={500} />
                  <div className="flex gap-2 sm:gap-3 pt-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => dispatchUI({ editingClient: null })}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" loading={ui.saving} disabled={!isEditFormValid() || !haveEditChanges()}>
                      {ui.saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-5 sm:space-y-6">
                {/* Profile Section */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="size-14 sm:size-16 rounded-full bg-gradient-to-br from-salon-100 to-accent-100 flex items-center justify-center text-salon-600 font-bold text-xl sm:text-2xl shadow-inner ring-4 ring-white">
                    {ui.viewingClient.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-900 truncate">{ui.viewingClient.name}</h3>
                    <Badge variant={statusBadge[ui.viewingClient.status]} className="mt-1.5 text-xs">{statusLabels[ui.viewingClient.status]}</Badge>
                  </div>
                </div>

                {/* Contact Section */}
                {(ui.viewingClient.phone || ui.viewingClient.email || ui.viewingClient.instagram) && (
                  <div className="space-y-1.5 sm:space-y-2 py-1">
                    {ui.viewingClient.phone && (
                      <a href={`tel:${ui.viewingClient.phone}`} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                        <div className="size-8 sm:size-9 rounded-lg border border-t-white/50 border-b-white/20 border-l-white/30 border-r-white/30 bg-white/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-salon-100/60 transition-colors">
                          <Phone className="size-3.5 sm:size-4 text-zinc-400 group-hover:text-salon-500" />
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs text-zinc-400">Teléfono</p>
                          <p className="text-xs sm:text-sm font-medium text-zinc-700">{ui.viewingClient.phone}</p>
                        </div>
                      </a>
                    )}
                    {ui.viewingClient.email && (
                      <a href={`mailto:${ui.viewingClient.email}`} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                        <div className="size-8 sm:size-9 rounded-lg border border-t-white/50 border-b-white/20 border-l-white/30 border-r-white/30 bg-white/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-salon-100/60 transition-colors">
                          <Mail className="size-3.5 sm:size-4 text-zinc-400 group-hover:text-salon-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-zinc-400">Email</p>
                          <p className="text-xs sm:text-sm font-medium text-zinc-700 truncate">{ui.viewingClient.email}</p>
                        </div>
                      </a>
                    )}
                    {ui.viewingClient.instagram && (
                      <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl">
                        <div className="size-8 sm:size-9 rounded-lg border border-t-white/50 border-b-white/20 border-l-white/30 border-r-white/30 bg-white/40 backdrop-blur-sm flex items-center justify-center">
                          <Instagram className="size-3.5 sm:size-4 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs text-zinc-400">Instagram</p>
                          <p className="text-xs sm:text-sm font-medium text-zinc-700">{ui.viewingClient.instagram}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats Section */}
                {ui.viewingClient.client_stats && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="p-3 sm:p-4 rounded-xl border border-t-white/50 border-b-white/20 border-l-white/30 border-r-white/30 bg-white/40 backdrop-blur-lg text-center">
                    <CalendarDays className="size-4 sm:size-5 mx-auto text-salon-500 mb-1.5 sm:mb-2" />
                    <p className="text-lg sm:text-xl font-bold text-zinc-900">{ui.viewingClient.client_stats.total_appointments}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-400 mt-1">Citas</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl border border-t-white/50 border-b-white/20 border-l-white/30 border-r-white/30 bg-white/40 backdrop-blur-lg text-center">
                    <DollarSign className="size-4 sm:size-5 mx-auto text-green-500 mb-1.5 sm:mb-2" />
                    <p className="text-base sm:text-lg font-bold text-zinc-900">{formatCurrency(ui.viewingClient.client_stats.total_spent)}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-400 mt-1">Total</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl border border-t-white/50 border-b-white/20 border-l-white/30 border-r-white/30 bg-white/40 backdrop-blur-lg text-center">
                      <Clock className="size-4 sm:size-5 mx-auto text-accent-500 mb-1.5 sm:mb-2" />
                      <p className="text-xs sm:text-sm font-bold text-zinc-900">
                        {ui.viewingClient.client_stats.last_visit ? formatDate(ui.viewingClient.client_stats.last_visit) : '—'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-zinc-400 mt-1">Última</p>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {ui.viewingClient.notes && (
                  <div className="p-3 sm:p-4 rounded-xl border border-amber-200/30 bg-amber-50/40 backdrop-blur-sm">
                    <div className="flex items-start gap-2">
                      <svg className="size-3.5 sm:size-4 text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                      <p className="text-xs sm:text-sm text-amber-800 leading-relaxed break-words whitespace-pre-wrap min-w-0">{ui.viewingClient.notes}</p>
                    </div>
                  </div>
                )}

                {/* Appointments Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                    <CalendarDays className="size-3.5 sm:size-4 text-zinc-400" />
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900">Última cita</h4>
                  </div>
                  {ui.clientAppointments.length === 0 ? (
                      <div className="text-center py-6 sm:py-8 px-4 rounded-xl border border-t-white/50 border-b-white/20 border-l-white/30 border-r-white/30 bg-white/40 backdrop-blur-lg">
                      <CalendarDays className="size-6 sm:size-8 mx-auto text-zinc-300 mb-2" />
                      <p className="text-xs sm:text-sm text-zinc-400">Sin citas registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ui.clientAppointments.slice(0, 1).map((appt) => {
                        const statusKey = appt.status as keyof typeof statusConfigByStatus;
                        const sc = statusConfigByStatus[statusKey] || statusConfigByStatus.completada;
                        return (
                          <div key={appt.id} className="p-2.5 sm:p-3 rounded-xl border border-t-white/50 border-b-white/20 border-l-white/30 border-r-white/30 bg-white/40 backdrop-blur-lg hover:bg-white/60 hover:backdrop-blur-xl transition-all duration-300">
                            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                              <p className="font-medium text-xs sm:text-sm text-zinc-900 flex-1 min-w-0 truncate">{appt.title}</p>
                              <p className="text-xs sm:text-sm font-semibold text-zinc-900 flex-shrink-0">{formatCurrency(appt.total_price)}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-zinc-400">
                                <span>{formatDate(appt.start_time)}</span>
                                <span>·</span>
                                <span>{formatTime(appt.start_time)}</span>
                                {appt.artist && (
                                  <>
                                    <span>·</span>
                                    <span>{appt.artist.name}</span>
                                  </>
                                )}
                              </div>
                              <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} flex-shrink-0`}>
                                {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:gap-3 pt-2 border-t border-zinc-100">
                  <Button type="button" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={handleDelete} loading={ui.deleting}>
                    <Trash2 className="size-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">{ui.deleting ? 'Eliminando...' : 'Eliminar'}</span>
                    <span className="sm:hidden">{ui.deleting ? '...' : 'Eliminar'}</span>
                  </Button>
                  <Button type="button" className="flex-1" onClick={openEdit}>
                    <Edit className="size-4 mr-1.5 sm:mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-all w-full box-border" onClick={onClick}>
      <CardContent className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-4">
        <div className="size-10 sm:size-12 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold flex-shrink-0">
          {client.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium truncate sm:max-w-none md:max-w-none">{client.name}</p>
            <Badge variant={statusBadge[client.status] || 'default'} className="flex-shrink-0">
              {statusLabels[client.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
            {client.phone && (
              <span className="flex items-center gap-1 break-all"><Phone className="size-3 flex-shrink-0" />{client.phone}</span>
            )}
            {client.instagram && (
              <span className="flex items-center gap-1 break-all overflow-wrap:anywhere"><Instagram className="size-3 flex-shrink-0" />{client.instagram}</span>
            )}
          </div>
        </div>
        <div className="text-right hidden sm:block flex-shrink-0">
          {client.client_stats && (
            <>
              <p className="text-sm font-semibold">{formatCurrency(client.client_stats.total_spent)}</p>
              <p className="text-xs text-zinc-400">{client.client_stats.total_appointments} citas</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}