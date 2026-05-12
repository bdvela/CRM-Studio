'use client';

import { useEffect, useState, useRef, useReducer } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClientById, getAppointments, updateClient, deleteClient } from '@/lib/db/queries';
import type { Client, ClientInsert, AppointmentStatus } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  Clock, ArrowLeft, Edit, Save, Trash2,
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

export default function ClientDetailPage() {
  const params = useParams();
  const { push, back } = useRouter();
  const { confirm } = useConfirm();
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const loadingRef = useRef(true);
  const [ui, dispatchUI] = useReducer(detailUIReducer, DETAIL_UI_INIT);
  const [editForm, setEditForm] = useState<ClientInsert | null>(null);
  const initialEditFormRef = useRef<ClientInsert | null>(null);

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

  useEffect(() => { load(); }, [params.id]);

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => back()}>
            <ArrowLeft className="size-4 mr-1" /> Volver
          </Button>
          <Button size="sm" onClick={openEditModal}>
            <Edit className="size-4 mr-1" /> Editar
          </Button>
        </div>
      } />

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
        {/* Profile Card */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-start gap-5">
              <div className="size-16 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold text-2xl flex-shrink-0">
                {client.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold">{client.name}</h2>
                  <Badge variant={statusBadge[client.status]}>{statusLabels[client.status]}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-500">
                  {client.phone && <span className="flex items-center gap-1.5"><Phone className="size-4" />{client.phone}</span>}
                  {client.email && <span className="flex items-center gap-1.5"><Mail className="size-4" />{client.email}</span>}
                  {client.instagram && <span className="flex items-center gap-1.5"><Instagram className="size-4" />{client.instagram}</span>}
                </div>
              </div>
            </div>

            {client.notes && (
              <div className="mt-4 p-3 rounded-xl bg-zinc-50 text-sm text-zinc-600">
                {client.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {client.client_stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4 text-center">
                <CalendarDays className="size-6 mx-auto text-salon-500 mb-2" />
                <p className="text-2xl font-bold">{client.client_stats.total_appointments}</p>
                <p className="text-xs text-zinc-400">Citas totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <DollarSign className="size-6 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(client.client_stats.total_spent)}</p>
                <p className="text-xs text-zinc-400">Total gastado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <Clock className="size-6 mx-auto text-accent-500 mb-2" />
                <p className="text-sm font-bold">{client.client_stats.last_visit ? formatDate(client.client_stats.last_visit) : '—'}</p>
                <p className="text-xs text-zinc-400">Última visita</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointment History */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="size-5" /> Historial de citas
            </h3>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-center py-8 text-zinc-400 text-sm">Sin citas registradas</p>
            ) : (
              <div className="space-y-2">
                {appointments.map((appt) => (
                  <Card key={appt.id} className="hover:shadow-sm transition-all">
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="text-center w-16">
                        <p className="text-sm font-bold">{formatTime(appt.start_time)}</p>
                        <p className="text-xs text-zinc-400">{formatDate(appt.start_time)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{appt.title}</p>
                        {appt.artist && <p className="text-xs text-zinc-400">{appt.artist.name}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(appt.total_price)}</p>
                        <Badge variant={appt.status === 'completada' ? 'success' : appt.status === 'programada' ? 'info' : 'danger'} className="text-xs">
                          {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal open={ui.showEditModal} onClose={() => { dispatchUI({ showEditModal: false }); }} title="Editar Clienta">
         <form onSubmit={handleEditFormSubmit} className="space-y-4">
          {editForm && (
            <>
              <Input label="Nombre *" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value } as ClientInsert))} placeholder="Nombre completo" />
              <Input label="Teléfono" value={editForm.phone || ''} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value } as ClientInsert))} placeholder="Teléfono" />
              <Input label="Email" type="email" value={editForm.email || ''} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value } as ClientInsert))} placeholder="email@ejemplo.com" />
              <Input label="Instagram" value={editForm.instagram || ''} onChange={(e) => setEditForm(prev => ({ ...prev, instagram: e.target.value } as ClientInsert))} placeholder="@usuario" />
               <Select label="Estado" value={editForm.status} onChange={(value) => setEditForm(prev => ({ ...prev, status: value as ClientInsert['status'] } as ClientInsert))} options={[
                 { value: 'prospecto', label: 'Prospecto' },
                 { value: 'activa', label: 'Activa' },
                 { value: 'inactiva', label: 'Inactiva' },
                 { value: 'vip', label: 'VIP' },
               ]} />
              <Textarea label="Notas" value={editForm.notes || ''} onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value } as ClientInsert))} placeholder="Preferencias, alergias, notas..." />

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
