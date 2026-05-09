'use client';

import { useEffect, useState } from 'react';
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

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { confirm } = useConfirm();
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<ClientInsert | null>(null);
  const [initialEditForm, setInitialEditForm] = useState<ClientInsert | null>(null);

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
      setLoading(false);
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
    setInitialEditForm({ ...formData });
    setShowEditModal(true);
  }

  function haveChanges(): boolean {
    if (!editForm || !initialEditForm) return false;
    if (editForm.name !== initialEditForm.name) return true;
    if (editForm.phone !== initialEditForm.phone) return true;
    if (editForm.email !== initialEditForm.email) return true;
    if (editForm.instagram !== initialEditForm.instagram) return true;
    if (editForm.status !== initialEditForm.status) return true;
    if (editForm.notes !== initialEditForm.notes) return true;
    if (editForm.photo_url !== initialEditForm.photo_url) return true;
    return false;
  }

  function isEditFormValid(): boolean {
    if (!editForm) return false;
    return editForm.name.trim().length > 0;
  }

  async function handleSave() {
    if (!client || !editForm) return;
    setSaving(true);
    try {
      await updateClient(client.id, editForm);
      toast.success('Datos actualizados');
      setShowEditModal(false);
      load();
    } catch (e) {
      toast.error('Error al actualizar');
    } finally {
      setSaving(false);
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
    setDeleting(true);
    try {
      await deleteClient(client.id);
      toast.success('Clienta eliminada');
      router.push('/clientes');
    } catch (e) {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 animate-spin rounded-full border-4 border-salon-500 border-t-transparent" /></div>;
  if (!client) return <div className="p-8 text-center text-gray-400">Clienta no encontrada</div>;

  return (
    <>
      <Header action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>
          <Button size="sm" onClick={openEditModal}>
            <Edit className="w-4 h-4 mr-1" /> Editar
          </Button>
        </div>
      } />

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
        {/* Profile Card */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold text-2xl flex-shrink-0">
                {client.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold">{client.name}</h2>
                  <Badge variant={statusBadge[client.status]}>{statusLabels[client.status]}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{client.phone}</span>}
                  {client.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{client.email}</span>}
                  {client.instagram && <span className="flex items-center gap-1.5"><Instagram className="w-4 h-4" />{client.instagram}</span>}
                </div>
              </div>
            </div>

            {client.notes && (
              <div className="mt-4 p-3 rounded-xl bg-gray-50 text-sm text-gray-600">
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
                <CalendarDays className="w-6 h-6 mx-auto text-salon-500 mb-2" />
                <p className="text-2xl font-bold">{client.client_stats.total_appointments}</p>
                <p className="text-xs text-gray-400">Citas totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <DollarSign className="w-6 h-6 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(client.client_stats.total_spent)}</p>
                <p className="text-xs text-gray-400">Total gastado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <Clock className="w-6 h-6 mx-auto text-accent-500 mb-2" />
                <p className="text-sm font-bold">{client.client_stats.last_visit ? formatDate(client.client_stats.last_visit) : '—'}</p>
                <p className="text-xs text-gray-400">Última visita</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointment History */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="w-5 h-5" /> Historial de citas
            </h3>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">Sin citas registradas</p>
            ) : (
              <div className="space-y-2">
                {appointments.map((appt) => (
                  <Card key={appt.id} className="hover:shadow-sm transition-all">
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="text-center w-16">
                        <p className="text-sm font-bold">{formatTime(appt.start_time)}</p>
                        <p className="text-xs text-gray-400">{formatDate(appt.start_time)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{appt.title}</p>
                        {appt.artist && <p className="text-xs text-gray-400">{appt.artist.name}</p>}
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
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); }} title="Editar Clienta">
        <form onSubmit={(e) => { e.preventDefault(); if (isEditFormValid() && haveChanges()) handleSave(); }} className="space-y-4">
          {editForm && (
            <>
              <Input label="Nombre *" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nombre completo" />
              <Input label="Teléfono" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Teléfono" />
              <Input label="Email" type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@ejemplo.com" />
              <Input label="Instagram" value={editForm.instagram || ''} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} placeholder="@usuario" />
               <Select label="Estado" value={editForm.status} onChange={(value) => setEditForm({ ...editForm, status: value as ClientInsert['status'] })} options={[
                 { value: 'prospecto', label: 'Prospecto' },
                 { value: 'activa', label: 'Activa' },
                 { value: 'inactiva', label: 'Inactiva' },
                 { value: 'vip', label: 'VIP' },
               ]} />
              <Textarea label="Notas" value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Preferencias, alergias, notas..." />

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 order-last sm:order-none"
                  loading={deleting}
                  onClick={handleDelete}
                >
                  {!deleting && <Trash2 className="w-4 h-4 mr-1" />}
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
                
                <div className="hidden sm:block flex-1" />
                
                <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setShowEditModal(false); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={saving}
                    disabled={!isEditFormValid() || !haveChanges()}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
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
