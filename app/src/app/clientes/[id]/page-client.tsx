'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getClientById, getAppointments, updateClient, deleteClient } from '@/lib/db/queries';
import type { Client, ClientInsert, Appointment } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/confirm-context';
import { normalizePeruPhone } from '@/lib/utils';
import { ClientDetailProfile } from '@/components/clientes/ClientDetailProfile';
import { ClientDetailStats } from '@/components/clientes/ClientDetailStats';
import { ClientAppointmentHistory } from '@/components/clientes/ClientAppointmentHistory';
import { ClientFormModal } from '@/components/clientes/ClientFormModal';

export default function ClienteDetailClient({
  initialClient,
  initialAppointments,
}: {
  initialClient?: Client;
  initialAppointments?: Appointment[];
}) {
  const { push } = useRouter();
  const { confirm } = useConfirm();
  const [client, setClient] = useState<Client | null>(initialClient || null);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments || []);
  const [loading, setLoading] = useState(!initialClient);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEditSave = useCallback(async (data: ClientInsert) => {
    if (!client?.id) return;
    setSaving(true);
    try {
      const normalized = normalizePeruPhone(data.phone);
      await updateClient(client.id, { ...data, phone: normalized });
      toast.success('Datos actualizados');
      setEditing(false);
      setLoading(true);
      try {
        const [c, a] = await Promise.all([
          getClientById(client.id),
          getAppointments({ clientId: client.id }),
        ]);
        if (c) setClient(c as Client);
        if (a) setAppointments(a as Appointment[]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setSaving(false);
    }
  }, [client]);

  const handleDelete = useCallback(async () => {
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
      push('/clientes');
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(false);
    }
  }, [client, confirm, push]);

  if (!client) {
    return (
      <>
        <Header title="Clienta no encontrada" />
        <div className="p-4 md:p-8 max-w-7xl mx-auto text-center">
          <p className="text-zinc-500 mb-4">La clienta no existe o fue eliminada.</p>
          <Button variant="outline" onClick={() => push('/clientes')}>Volver a Clientas</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={editing ? 'Editando' : client.name}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4 mr-1" /> Editar
            </Button>
            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleDelete} loading={deleting}>
              <Trash2 className="size-4 mr-1" /> Eliminar
            </Button>
            <Button size="sm" variant="outline" onClick={() => push('/clientes')}>
              <ArrowLeft className="size-4 mr-1" /> Volver
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <ClientDetailProfile client={client} />

        <ClientDetailStats
          totalAppointments={client.client_stats?.total_appointments || 0}
          totalSpent={client.client_stats?.total_spent || 0}
          lastVisit={client.client_stats?.last_visit || null}
        />

        <ClientAppointmentHistory appointments={appointments} />
      </div>

      <ClientFormModal
        open={editing}
        onClose={() => setEditing(false)}
        onSave={handleEditSave}
        initialData={{
          name: client.name,
          phone: client.phone || '',
          email: client.email || '',
          instagram: client.instagram || '',
          status: client.status,
          notes: client.notes || '',
          photo_url: client.photo_url,
        }}
        title="Editar clienta"
        submitting={saving}
      />
    </>
  );
}
