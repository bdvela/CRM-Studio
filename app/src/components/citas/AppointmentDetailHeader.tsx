'use client';

import { memo, useEffect, useState, useMemo, Fragment } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AppointmentDetailHeaderProps } from './types-detail';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { formatTime, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Pencil, Phone, Instagram, CalendarDays, Clock } from 'lucide-react';

const STATUS_BADGE: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
  programada: 'info',
  en_curso: 'warning',
  completada: 'success',
  cancelada: 'danger',
  no_show: 'danger',
};

const STEPS = ['programada', 'en_curso', 'completada'] as const;

function DetailActions({ appointment, onEdit, onCancel, onAdvanceStatus, onMarkAsNoShow }: {
  appointment: AppointmentDetailHeaderProps['appointment'];
  onEdit: AppointmentDetailHeaderProps['onEdit'];
  onCancel: AppointmentDetailHeaderProps['onCancel'];
  onAdvanceStatus: AppointmentDetailHeaderProps['onAdvanceStatus'];
  onMarkAsNoShow: AppointmentDetailHeaderProps['onMarkAsNoShow'];
}) {
  if (appointment.status === 'programada') {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" onClick={onAdvanceStatus}>Iniciar cita</Button>
        <Button size="sm" variant="outline" onClick={onEdit}>Editar</Button>
        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" variant="ghost" className="text-zinc-400" onClick={onMarkAsNoShow}>No Show</Button>
      </div>
    );
  }
  if (appointment.status === 'en_curso') {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onAdvanceStatus}>Completar cita</Button>
        <Button size="sm" variant="outline" onClick={onEdit}>Editar</Button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-end">
      <Button size="sm" variant="outline" onClick={onEdit}>Editar</Button>
    </div>
  );
}

export const AppointmentDetailHeader = memo(function AppointmentDetailHeader({
  appointment, onEdit, onCancel, onAdvanceStatus, onMarkAsNoShow, onGoToClient,
}: AppointmentDetailHeaderProps) {
  const dateStr = format(new Date(appointment.start_time), "EEEE d 'de' MMMM", { locale: es }).toLowerCase();
  const timeRange = `${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time || appointment.start_time)}`;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (appointment.status !== 'programada') return;
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [appointment.status]);

  const timeStatus = useMemo(() => {
    if (appointment.status !== 'programada') return null;
    const diffMs = new Date(appointment.start_time).getTime() - now;
    if (diffMs < 0) return <span className="text-xs text-red-500 font-medium">Atrasada</span>;
    const diffH = Math.round(diffMs / 3600000);
    if (diffH < 1) return <span className="text-xs text-amber-500 font-medium">En menos de 1 hora</span>;
    if (diffH < 24) return <span className="text-xs text-amber-500 font-medium">En {diffH}h</span>;
    const diffD = Math.round(diffH / 24);
    return diffD === 1
      ? <span className="text-xs text-zinc-400">Mañana</span>
      : <span className="text-xs text-zinc-400">En {diffD} días</span>;
  }, [appointment.start_time, appointment.status, now]);

  const currentIdx = STEPS.indexOf(appointment.status as typeof STEPS[number]);
  const isAllCompleted = appointment.status === 'completada';
  const showStepper = appointment.status !== 'cancelada' && appointment.status !== 'no_show';

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => appointment.client_id && onGoToClient(appointment.client_id)}
              className="size-14 rounded-full bg-gradient-to-br from-salon-500/90 via-salon-400/50 to-salon-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow-md shadow-salon-500/20 cursor-pointer hover:opacity-90 transition-opacity"
              aria-label={`Ir al perfil de ${appointment.client?.name || 'Sin clienta'}`}
              title="Ver perfil de clienta"
            >
              {(appointment.client?.name || 'S')[0].toUpperCase()}
            </button>
            <div className="min-w-0">
              <button
                onClick={() => appointment.client_id && onGoToClient(appointment.client_id)}
                className="text-lg font-bold text-zinc-900 truncate block hover:text-salon-600 transition-colors text-left"
                title="Ver perfil de clienta"
              >
                {appointment.client?.name || 'Sin clienta'}
              </button>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={STATUS_BADGE[appointment.status] || 'default'}>
                  {APPOINTMENT_STATUS_LABELS[appointment.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                {appointment.client?.phone && (
                  <a href={`tel:${appointment.client.phone}`} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-salon-600 transition-colors">
                    <Phone className="size-3" aria-hidden="true" />
                    {appointment.client.phone}
                  </a>
                )}
                {appointment.client?.instagram && (
                  <a href={`https://instagram.com/${appointment.client.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-salon-600 transition-colors">
                    <Instagram className="size-3" aria-hidden="true" />
                    {appointment.client.instagram}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <DetailActions
              appointment={appointment}
              onEdit={onEdit}
              onCancel={onCancel}
              onAdvanceStatus={onAdvanceStatus}
              onMarkAsNoShow={onMarkAsNoShow}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <CalendarDays className="size-4 text-zinc-400" aria-hidden="true" />
            <span className="capitalize">{dateStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Clock className="size-4 text-zinc-400" aria-hidden="true" />
            <span>{timeRange}</span>
            <span className="text-xs text-zinc-400">({appointment.total_duration_min} min)</span>
            {timeStatus}
          </div>
        </div>

        {showStepper && (
          <div className="flex items-center gap-1 pt-4 border-t border-zinc-100">
            {STEPS.map((s, i) => {
              const isDone = i < currentIdx || (isAllCompleted && i === currentIdx);
              const isActive = i === currentIdx && !isAllCompleted;

              return (
              <Fragment key={s}>
                <div className={cn(
                  'flex items-center gap-1.5 text-xs font-medium',
                  isDone ? 'text-emerald-600' : isActive ? 'text-salon-600' : 'text-zinc-300'
                )}>
                  <div className={cn(
                    'size-6 rounded-full flex items-center justify-center',
                    isDone ? 'bg-emerald-100' : isActive ? 'bg-salon-100' : 'bg-zinc-100'
                  )}>
                    {isDone || isAllCompleted
                      ? <Check className="size-3.5" aria-hidden="true" />
                      : <span className="text-xs">{i + 1}</span>
                    }
                  </div>
                  <span className="text-sm font-medium">{APPOINTMENT_STATUS_LABELS[s]}</span>
                </div>
                {i < 2 && (
                  <div className={cn('flex-1 h-0.5 rounded-full', isDone ? 'bg-emerald-300' : 'bg-zinc-200')} />
                )}
              </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
