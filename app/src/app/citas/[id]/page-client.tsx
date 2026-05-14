'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAppointmentById, updateAppointment } from '@/lib/db/queries';
import type { AppointmentWithDetails } from '@/components/citas/types';
import { Header } from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/context/confirm-context';
import {
  AppointmentDetailHeader,
  AppointmentDetailStepper,
  AppointmentDetailSchedule,
  AppointmentDetailServices,
  AppointmentDetailCommissions,
  AppointmentDetailBalance,
  AppointmentDetailActions,
  AppointmentDetailNotes,
} from '@/components/citas/detail';

function LoadingSkeleton() {
  return (
    <>
      <Header title="Cita" />
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse" role="status" aria-label="Cargando cita">
        <div className="h-28 rounded-2xl bg-zinc-200" />
        <div className="h-14 rounded-2xl bg-zinc-200" />
        <div className="h-20 rounded-2xl bg-zinc-200" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="h-48 rounded-2xl bg-zinc-200" />
            <div className="h-28 rounded-2xl bg-zinc-200" />
          </div>
          <div className="space-y-6">
            <div className="h-32 rounded-2xl bg-zinc-200" />
            <div className="h-24 rounded-2xl bg-zinc-200" />
          </div>
        </div>
        <div className="h-36 rounded-2xl bg-zinc-200" />
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
  const [showEditModal, setShowEditModal] = useState(false);

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
    const ok = await confirm('¿Cancelar esta cita?', 'La cita se marcará como cancelada.');
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
      toast.success(nextStatus === 'en_curso' ? 'Cita iniciada' : 'Cita completada');
      load();
    } catch {
      toast.error('Error al actualizar estado');
    }
  }, [appointment, load]);

  const handleMarkAsNoShow = useCallback(async () => {
    if (!appointment) return;
    const ok = await confirm('¿Marcar como No Show?', 'La clienta no asistió a la cita.');
    if (!ok) return;
    try {
      await updateAppointment(appointment.id, { status: 'no_show' });
      toast.success('Cita marcada como No Show');
      load();
    } catch {
      toast.error('Error al actualizar');
    }
  }, [appointment, confirm, load]);

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

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300" key={appointment.id}>
        <AppointmentDetailHeader
          appointment={appointment}
          onBack={() => push('/citas')}
          onEdit={() => setShowEditModal(true)}
          onGoToClient={(id) => push('/clientes/' + id)}
        />
        <AppointmentDetailStepper status={appointment.status} />
        <AppointmentDetailSchedule appointment={appointment} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <AppointmentDetailServices
              appointment={appointment}
              onGoToStaff={(id) => push('/staff/' + id)}
            />
            <AppointmentDetailCommissions appointment={appointment} />
          </div>
          <div className="space-y-6">
            <AppointmentDetailBalance appointment={appointment} />
            <AppointmentDetailNotes notes={appointment.notes} />
          </div>
        </div>
        <AppointmentDetailActions
          appointment={appointment}
          onEdit={() => setShowEditModal(true)}
          onCancel={handleCancel}
          onAdvanceStatus={handleAdvanceStatus}
          onMarkAsNoShow={handleMarkAsNoShow}
        />
      </div>
    </>
  );
}
