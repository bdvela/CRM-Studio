'use client';

import { useEffect, useState, useRef, useReducer } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClientById, getAppointments, updateClient, deleteClient } from '@/lib/db/queries';
import type { Client, ClientInsert, AppointmentStatus } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import {
  Phone, Mail, Instagram, CalendarDays, DollarSign,
  Clock, ArrowLeft, Edit, Save, Trash2, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/confirm-context';

const statusBadge: Record<string, 'success' | 'warning' | 'danger' | 'purple'> = {
  prospecto: 'warning', activa: 'success', inactiva: 'danger', vip: 'purple',
};
const statusLabels: Record<string, string> = {
  prospecto: 'Prospecto', activa: 'Activa', inactiva: 'Inactiva', vip: 'VIP',
};

interface ClientDetailUIState {
  saving: boolean;
  deleting: boolean;
  showEditModal: boolean;
}

const DETAIL_UI_INIT: ClientDetailUIState = {
  saving: false,
  deleting: false,
  showEditModal: false,
};

function detailUIReducer(state: ClientDetailUIState, action: Partial<ClientDetailUIState>): ClientDetailUIState {
  return { ...state, ...action };
}

export default function ClientDetailPage({ initialData }: {
  initialData?: {
    client: Client | null;
    appointments: any[];
  };
}) {
  const params = useParams();
  const { push, back } = useRouter();
  const { confirm } = useConfirm();
  const [client, setClient] = useState<Client | null>(initialData?.client || null);
  const [appointments, setAppointments] = useState<any[]>(initialData?.appointments || []);
  const loadingRef = useRef(!initialData);
  const [ui, dispatchUI] = useReducer(detailUIReducer, DETAIL_UI_INIT);
  const [editForm, setEditForm] = useState<ClientInsert | null>(null);
  const initialEditFormRef = useRef<ClientInsert | null>(null);
  const skipInitialLoad = useRef(!!initialData);

  async function load() {
    try {
      const [c, a] = await Promise.all([
        getClientById(params.id as string),
        getAppointments({ clientId: params.id as string }),
      ]);
      setClient(c as unknown as Client);
      setAppointments(a as any[]);
    } catch (e) {
      console.error(e);
    } finally {
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }

    load();
  }, [params.id]);

  function openEditModal() {
    if (!client) return;
    const formData: ClientInsert = {
      name: client.name, phone: client.phone || '', email: client.email || '',
      instagram: client.instagram || '', status: client.status, notes: client.notes || '', photo_url: client.photo_url,
    };
    setEditForm(formData);
    initialEditFormRef.current = { ...formData };
    dispatchUI({ showEditModal: true });
  }

  function haveChanges(): boolean {
    if (!editForm || !initialEditFormRef.current) return false;
    if (editForm.name !== initialEditFormRef.current.name) return true;
    if (editForm.phone !== initialEditFormRef.current.phone) return true;
    if (editForm.email !== initialEditFormRef.current.email) return true;
    if (editForm.instagram !== initialEditFormRef.current.instagram) return true;
    if (editForm.status !== initialEditFormRef.current.status) return true;
    if (editForm.notes !== initialEditFormRef.current.notes) return true;
    if (editForm.photo_url !== initialEditFormRef.current.photo_url) return true;
    return false;
  }

  function isEditFormValid(): boolean {
    if (!editForm) return false;
    return editForm.name.trim().length > 0;
  }

  async function handleSave() {
    if (!client || !editForm) return;
    dispatchUI({ saving: true });
    try {
      await updateClient(client.id, editForm);
      toast.success('Datos actualizados');
      dispatchUI({ showEditModal: false });
      load();
    } catch (e) {
      toast.error('Error al actualizar');
    } finally {
      dispatchUI({ saving: false });
    }
  }

  async function handleDelete() {
    if (!client) return;
    const confirmed = await confirm({
      title: 'Eliminar clienta',
      message: `¿Eliminar a ${client.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    dispatchUI({ deleting: true });
    try {
      await deleteClient(client.id);
      toast.success('Clienta eliminada');
      push('/clientes');
    } catch (e) {
      toast.error('Error al eliminar');
    } finally {
      dispatchUI({ deleting: false });
    }
  }

  function handleEditFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditFormValid() && haveChanges()) handleSave();
  }

  if (loadingRef.current) return <div className="p-8 flex justify-center"><div className="size-8 animate-spin rounded-full border-4 border-salon-500 border-t-transparent" /></div>;
  if (!client) return <div className="p-8 text-center text-zinc-400">Clienta no encontrada</div>;

  return (
    <>
      <Header action={
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm" onClick={() => back()} className="px-2 sm:px-3">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline ml-1">Volver</span>
          </Button>
          <Button size="sm" onClick={openEditModal} className="px-2 sm:px-3">
            <Edit className="size-4" />
            <span className="hidden sm:inline ml-1">Editar</span>
          </Button>
        </div>
      } />

      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        {/* Profile Card */}
        <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-50">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="size-7 sm:size-8 rounded-lg bg-salon-50 flex items-center justify-center">
                <User className="size-3.5 sm:size-4 text-salon-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-zinc-900">Perfil</h2>
                <p className="text-[10px] sm:text-xs text-zinc-400">Datos de la clienta</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="size-11 sm:size-12 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold text-lg sm:text-xl flex-shrink-0">
                {client.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-semibold truncate">{client.name}</h2>
                  <Badge variant={statusBadge[client.status]} className="text-[10px] sm:text-xs">{statusLabels[client.status]}</Badge>
                </div>
                <div className="mt-2 sm:mt-3 flex flex-col xs:flex-row xs:flex-wrap gap-1.5 sm:gap-4 text-xs sm:text-sm text-zinc-500">
                  {client.phone && (
                    <span className="flex items-center gap-1.5 truncate">
                      <Phone className="size-3.5 flex-shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </span>
                  )}
                  {client.email && (
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3.5 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </span>
                  )}
                  {client.instagram && (
                    <span className="flex items-center gap-1.5 truncate">
                      <Instagram className="size-3.5 flex-shrink-0" />
                      <span className="truncate">{client.instagram}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {client.notes && (
              <div className="mt-4 p-3 rounded-xl bg-zinc-50 text-xs sm:text-sm text-zinc-600 line-clamp-3">
                {client.notes}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {client.client_stats && (
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="rounded-2xl bg-white border border-zinc-100 p-3 sm:p-4 text-center shadow-sm">
              <CalendarDays className="size-4 sm:size-5 mx-auto text-salon-500 mb-1.5 sm:mb-2" />
              <p className="text-lg sm:text-xl font-bold">{client.client_stats.total_appointments}</p>
              <p className="text-[10px] sm:text-xs text-zinc-400">Citas totales</p>
            </div>
            <div className="rounded-2xl bg-white border border-zinc-100 p-3 sm:p-4 text-center shadow-sm">
              <DollarSign className="size-4 sm:size-5 mx-auto text-green-500 mb-1.5 sm:mb-2" />
              <p className="text-lg sm:text-xl font-bold">{formatCurrency(client.client_stats.total_spent)}</p>
              <p className="text-[10px] sm:text-xs text-zinc-400">Total gastado</p>
            </div>
            <div className="rounded-2xl bg-white border border-zinc-100 p-3 sm:p-4 text-center shadow-sm col-span-1 sm:col-span-2 lg:col-span-2">
              <Clock className="size-4 sm:size-5 mx-auto text-accent-500 mb-1.5 sm:mb-2" />
              <p className="text-sm sm:text-base font-bold">{client.client_stats.last_visit ? formatDate(client.client_stats.last_visit) : '—'}</p>
              <p className="text-[10px] sm:text-xs text-zinc-400">Última visita</p>
            </div>
          </div>
        )}

        {/* Appointment History */}
        <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-50">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="size-7 sm:size-8 rounded-lg bg-salon-50 flex items-center justify-center">
                <CalendarDays className="size-3.5 sm:size-4 text-salon-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-zinc-900">Historial de citas</h2>
                <p className="text-[10px] sm:text-xs text-zinc-400">{appointments.length} {appointments.length === 1 ? 'cita' : 'citas'}</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            {appointments.length === 0 ? (
              <div className="text-center py-8 sm:py-10">
                <div className="size-12 sm:size-14 rounded-2xl bg-zinc-50 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <CalendarDays className="size-6 sm:size-7 text-zinc-300" />
                </div>
                <p className="text-xs sm:text-sm text-zinc-400">Sin citas registradas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.map((appt) => (
                  <div key={appt.id} className="min-w-0">
                    <div className="rounded-xl border border-zinc-100 p-3 sm:p-4 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-center w-12 sm:w-14 flex-shrink-0">
                          <p className="text-xs sm:text-sm font-bold">{formatTime(appt.start_time)}</p>
                          <p className="text-[10px] sm:text-xs text-zinc-400">{formatDate(appt.start_time)}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{appt.title}</p>
                          {appt.artist && <p className="text-[10px] sm:text-xs text-zinc-400 truncate">{appt.artist.name}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs sm:text-sm font-semibold">{formatCurrency(appt.total_price)}</p>
                          <Badge variant={appt.status === 'completada' ? 'success' : appt.status === 'programada' ? 'info' : 'danger'} className="text-[10px] sm:text-xs">
                            {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
<Modal open={ui.showEditModal} onClose={() => { dispatchUI({ showEditModal: false }); }} title="Editar Clienta">
         <form onSubmit={handleEditFormSubmit} className="space-y-4">
           {editForm && (
             <>
               <Input label="Nombre *" value={editForm.name} onChange={(value) => setEditForm(prev => ({ ...prev, name: value } as ClientInsert))} placeholder="Nombre completo" minLength={2} maxLength={100} />
               <Input label="Teléfono" value={editForm.phone || ''} onChange={(value) => setEditForm(prev => ({ ...prev, phone: value } as ClientInsert))} placeholder="Teléfono" maxLength={11} />
               <Input label="Email" type="email" value={editForm.email || ''} onChange={(value) => setEditForm(prev => ({ ...prev, email: value } as ClientInsert))} placeholder="email@ejemplo.com" maxLength={100} />
               <Input label="Instagram" value={editForm.instagram || ''} onChange={(value) => setEditForm(prev => ({ ...prev, instagram: value } as ClientInsert))} placeholder="@usuario" maxLength={50} />
                <Select label="Estado" value={editForm.status} onChange={(value) => setEditForm(prev => ({ ...prev, status: value as ClientInsert['status'] } as ClientInsert))} options={[
                  { value: 'prospecto', label: 'Prospecto' },
                  { value: 'activa', label: 'Activa' },
                  { value: 'inactiva', label: 'Inactiva' },
                  { value: 'vip', label: 'VIP' },
                ]} />
               <Textarea label="Notas" value={editForm.notes || ''} onChange={(value) => setEditForm(prev => ({ ...prev, notes: value } as ClientInsert))} placeholder="Preferencias, alergias, notas..." maxLength={500} />

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
                  loading={ui.deleting}
                  onClick={handleDelete}
                >
                  {!ui.deleting && <Trash2 className="size-4 mr-1" />}
                  {ui.deleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
                
                <div className="hidden sm:block flex-1" />
                
                <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { dispatchUI({ showEditModal: false }); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={ui.saving}
                    disabled={!isEditFormValid() || !haveChanges()}
                  >
                    {ui.saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </Modal>
    </>
  );
}
