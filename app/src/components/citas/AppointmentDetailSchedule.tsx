'use client';

import { useEffect, useState, memo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AppointmentDetailScheduleProps } from './types-detail';
import { formatTime } from '@/lib/utils';
import { CalendarDays, Clock } from 'lucide-react';

export const AppointmentDetailSchedule = memo(function AppointmentDetailSchedule({ appointment }: AppointmentDetailScheduleProps) {
  const dateStr = format(new Date(appointment.start_time), "EEEE d 'de' MMMM", { locale: es });
  const timeRange = `${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time || appointment.start_time)}`;
  const [timeStatus, setTimeStatus] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (appointment.status !== 'programada') return;
    const update = () => {
      const diffMs = new Date(appointment.start_time).getTime() - Date.now();
      if (diffMs < 0) setTimeStatus(<span className="text-xs text-red-500 font-medium">Atrasada</span>);
      else {
        const diffH = Math.round(diffMs / 3600000);
        if (diffH < 1) setTimeStatus(<span className="text-xs text-amber-500 font-medium">En menos de 1 hora</span>);
        else if (diffH < 24) setTimeStatus(<span className="text-xs text-amber-500 font-medium">En {diffH}h</span>);
        else {
          const diffD = Math.round(diffH / 24);
          setTimeStatus(diffD === 1
            ? <span className="text-xs text-zinc-400">Mañana</span>
            : <span className="text-xs text-zinc-400">En {diffD} días</span>);
        }
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [appointment.start_time, appointment.status]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="size-8 rounded-lg bg-salon-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <CalendarDays className="size-4 text-salon-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Fecha</p>
            <p className="font-medium text-zinc-900 capitalize">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="size-8 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <Clock className="size-4 text-accent-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Horario</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-zinc-900">{timeRange}</span>
              <span className="text-xs text-zinc-400">({appointment.total_duration_min} min)</span>
              {timeStatus}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
