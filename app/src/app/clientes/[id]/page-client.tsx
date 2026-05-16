'use client';

import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
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

const ClientFormModal = lazy(() =>
  import('@/components/clientes/ClientFormModal').then(m => ({ default: m.ClientFormModal }))
);

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
  const loadingRef = useRef(!initialClient);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Prefetch modal chunk so edit button click is instant
  useEffect(() => {
    const id = setTimeout(() => {
      import('@/components/clientes/ClientFormModal');
    }, 500);
    return () => clearTimeout(id);
  }, []);

  const handleEditSave = useCallback(async (data: ClientInsert) => {
    if (!client?.id) return;
    setSaving(true);
    try {
      const normalized = normalizePeruPhone(data.phone);
      await updateClient(client.id, { ...data, phone: normalized });
      toast.success('Datos actualizados');
      setEditing(false);
      loadingRef.current = true;
      try {
        const [c, a] = await Promise.all([
          getClientById(client.id),
          getAppointments({ clientId: client.id }),
        ]);
        if (c) setClient(c as Client);
        if (a) setAppointments(a as Appointment[]);
      } catch {
        toast.error('Error al recargar datos');
      } finally {
        loadingRef.current = false;
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

  const formInitialData = useMemo(() => client ? {
    name: client.name,
    phone: client.phone || '',
    email: client.email || '',
    instagram: client.instagram || '',
    status: client.status,
    notes: client.notes || '',
    photo_url: client.photo_url,
  } as ClientInsert : undefined, [client]);

  const handleViewAppointment = useCallback((appt: Appointment) => {
    push(`/citas/${appt.id}`);
  }, [push]);

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
        title={editing ? `Editando: ${client.name}` : client.name}
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
        <div className="animate-fadeInUp stagger-1">
          <ClientDetailProfile client={client} />
        </div>

        <div className="animate-fadeInUp stagger-2">
          <ClientDetailStats
            totalAppointments={client.client_stats?.total_appointments || 0}
            totalSpent={client.client_stats?.total_spent || 0}
            lastVisit={client.client_stats?.last_visit || null}
          />
        </div>

        <div className="animate-fadeInUp stagger-3">
          <ClientAppointmentHistory appointments={appointments} onViewAppointment={handleViewAppointment} />
        </div>
      </div>

      <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="size-8 rounded-full border-2 border-salon-300 border-t-transparent animate-spin" /></div>}>
        <ClientFormModal
          open={editing}
          onClose={() => setEditing(false)}
          onSave={handleEditSave}
          initialData={formInitialData}
          title="Editar clienta"
          submitting={saving}
        />
      </Suspense>
    </>
  );
}
