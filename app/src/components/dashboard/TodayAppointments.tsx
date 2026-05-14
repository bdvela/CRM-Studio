'use client';

import { useMemo } from 'react';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import type { AppointmentDTO } from './types';
import { EmptyState } from '@/components/ui/empty-state';

interface Props {
  appointments: AppointmentDTO[];
  onNavigate: (path: string) => void;
}

const statusColors: Record<string, string> = {
  programada: 'bg-blue-50 text-blue-700 border-blue-200',
  en_curso: 'bg-amber-50 text-amber-700 border-amber-200',
  completada: 'bg-green-50 text-green-700 border-green-200',
  cancelada: 'bg-red-50 text-red-700 border-red-200',
  no_show: 'bg-orange-50 text-orange-700 border-orange-200',
};

const avatarColors = [
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function TodayAppointments({ appointments, onNavigate }: Props) {
  const activeAppointments = useMemo(
    () => appointments.filter((appt) => appt.status === 'programada' || appt.status === 'en_curso'),
    [appointments]
  );
  const visibleAppointments = activeAppointments.length > 0 ? activeAppointments : appointments;
  const hasActive = activeAppointments.length > 0;

  return (
    <div className="lg:col-span-2">
      <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-salon-50 flex items-center justify-center">
              <CalendarDays className="size-4 text-salon-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Citas de hoy</h2>
              <p className="text-xs text-zinc-400">
                {appointments.length === 0
                  ? 'Sin citas agendadas'
                  : `${appointments.length} cita${appointments.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/citas')}
            className="text-sm text-salon-600 hover:text-salon-700 font-medium flex items-center gap-1 transition-colors"
          >
            Ver todas <ArrowRight className="size-4" />
          </button>
        </div>

        <div className="p-4">
          {appointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No hay citas para hoy"
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('/citas')}
                  className="text-sm text-salon-600 font-medium hover:text-salon-700"
                >
                  + Agendar nueva cita
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {!hasActive && (
                <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  Mostrando todas las citas del día (ninguna activa)
                </div>
              )}
              {visibleAppointments.map((appt) => (
                <div
                  key={appt.id}
                  onClick={() => onNavigate('/citas')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate('/citas'); }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group active:scale-[0.99]"
                >
                  <div className="text-center w-14 flex-shrink-0">
                    <p className="text-sm font-bold text-zinc-900">{formatTime(appt.start_time)}</p>
                    <p className="text-xs text-zinc-400">{appt.total_duration_min} min</p>
                  </div>
                  <div className="w-px h-10 bg-zinc-100" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`size-7 rounded-full bg-gradient-to-br ${getAvatarColor(appt.client?.name || '?')} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {(appt.client?.name || '?')[0].toUpperCase()}
                      </div>
                      <p className="font-medium text-sm truncate">{appt.client?.name || 'Sin clienta'}</p>
                    </div>
                    <p className="text-xs text-zinc-400 ml-9 mt-0.5 truncate">
                      {appt.artist?.name || 'Sin artista'} · {appt.title}
                    </p>
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${statusColors[appt.status] || ''}`}>
                    {APPOINTMENT_STATUS_LABELS[appt.status as keyof typeof APPOINTMENT_STATUS_LABELS] || appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
