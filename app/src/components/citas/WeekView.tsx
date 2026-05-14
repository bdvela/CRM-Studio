'use client';

import { format, isToday, set, getHours, getMinutes } from 'date-fns';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { isAppointmentPastOrCompleted } from '@/lib/utils';
import { getApptColor, isPastCalendarDay, HOURS } from './calendar-utils';
import type { CalendarAppointment } from './types';

export const WeekView = memo(function WeekView({ weekDays, formattedApptsByHour, now, onEmptyDayClick, onApptClick, onDragStart, onDragOver, onDrop }: {
  weekDays: Date[];
  formattedApptsByHour: Map<string, Map<number, CalendarAppointment[]>>;
  now: Date;
  onEmptyDayClick: (day: Date) => void;
  onApptClick: (appt: CalendarAppointment, e: React.MouseEvent) => void;
  onDragStart: (appt: CalendarAppointment, e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (day: Date, hour: number, e: React.DragEvent) => void;
}) {
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100">
    <div className="min-w-0 bg-white">
      <div className="grid grid-cols-[44px_repeat(7,1fr)] sm:grid-cols-[56px_repeat(7,1fr)] border-b border-zinc-100">
        <div className="p-2 text-xs text-zinc-400 border-r border-zinc-100 text-right pr-2">Hora</div>
        {weekDays.map((day, i) => (
          <div key={day.toISOString()} className={cn(
            'p-2 text-center border-r border-zinc-50 last:border-r-0',
            isToday(day) && 'bg-salon-50/30'
          )}>
            <div className="text-xs text-zinc-400">{dayNames[i]}</div>
            <div className={cn(
              'text-lg font-bold mt-0.5',
              isToday(day) ? 'text-salon-600' : 'text-zinc-800'
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      <div className="relative" style={{ maxHeight: 'calc(100dvh - 340px)', overflowY: 'auto' }}>
        {weekDays.some(d => isToday(d)) && (
          <div
            className="absolute left-11 sm:left-16 right-0 z-10 pointer-events-none"
            style={{ top: `${(getHours(now) - 7) * 64 + (getMinutes(now) / 60) * 64}px` }}
          >
            <div className="flex items-center">
              <div className="size-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0" />
              <div className="flex-1 h-px bg-red-500" />
            </div>
          </div>
        )}

        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-[44px_repeat(7,1fr)] sm:grid-cols-[56px_repeat(7,1fr)] border-b border-zinc-50 min-h-[64px]">
            <div className="p-2 text-xs text-zinc-300 border-r border-zinc-100 text-right pr-2 relative -top-2">
              {String(hour).padStart(2, '0')}:00
            </div>
            {weekDays.map((day, dayIdx) => {
              const key = format(day, 'yyyy-MM-dd');
              const hourAppts = formattedApptsByHour.get(key)?.get(hour) || [];
              const isPastDay = isPastCalendarDay(day, now);

              return (
                <div
                  key={key}
                  onClick={() => {
                    if (!isPastDay) onEmptyDayClick(set(day, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 }));
                  }}
                  onKeyDown={(e) => {
                    if (!isPastDay && (e.key === 'Enter' || e.key === ' ')) {
                      onEmptyDayClick(set(day, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 }));
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-disabled={isPastDay}
                  onDragOver={onDragOver}
                  onDrop={(e) => { if (!isPastDay) onDrop(day, hour, e); }}
                  className={cn(
                    'group border-r border-zinc-50 last:border-r-0 min-h-[64px] transition-colors relative',
                    isPastDay ? 'cursor-not-allowed bg-zinc-50' : 'hover:bg-salon-50/20 cursor-pointer',
                    isToday(day) && 'bg-salon-50/10'
                  )}
                >
                  {hourAppts.length === 0 && !isPastDay && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <span className="text-xs text-salon-400 font-medium">+ Crear aquí</span>
                    </div>
                  )}
                  {hourAppts.map((appt) => {
                    const colors = getApptColor(appt);
                    const isDead = appt.status === 'cancelada' || appt.status === 'no_show';
                    const isFaded = !isDead && isAppointmentPastOrCompleted(appt);
                    const startMin = appt._hour * 60 + appt._minute;
                    const topOffset = ((startMin - hour * 60) / 60) * 64;
                    const dur = appt.total_duration_min || 60;
                    const height = Math.max((dur / 60) * 64, 28);

                    return (
                      <button
                        key={appt.id}
                        type="button"
                        draggable={!isDead && !isFaded}
                        onDragStart={(e) => onDragStart(appt, e)}
                        onClick={(e) => onApptClick(appt, e)}
                        className={cn(
                          'absolute left-0.5 right-0.5 text-left overflow-hidden transition-shadow transition-colors',
                          'rounded-lg border-l-[4px] shadow-sm hover:shadow-md',
                          colors.bg, colors.border, colors.text,
                          isDead && 'opacity-50 line-through',
                          isFaded && 'opacity-50 line-through',
                          !isDead && !isFaded && 'cursor-grab active:cursor-grabbing'
                        )}
                        style={{ top: `${topOffset}px`, height: `${height}px`, zIndex: 2 }}
                      >
                        <div className="px-1.5 py-1 h-full flex flex-col justify-center min-h-0">
                          <div className="flex items-center gap-1">
                            <span className={cn(
                              'text-xs font-bold tabular-nums leading-none shrink-0',
                              colors.solid === 'bg-salon-500' ? 'text-salon-700' : colors.text
                            )}>
                              {appt._timeStr}
                            </span>
                            {height > 26 && (
                              <span className="text-xs leading-none truncate opacity-70">
                                {appt.client?.name || '—'}
                              </span>
                            )}
                          </div>
                          {height > 44 && appt.appointment_services?.[0]?.service && (
                            <div className="flex items-center gap-1 mt-0.5 min-w-0">
                              <span className="text-xs shrink-0">{appt.appointment_services[0].service.category?.icon}</span>
                              <span className="text-xs leading-tight truncate opacity-70">
                                {appt.appointment_services[0].service.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
});
