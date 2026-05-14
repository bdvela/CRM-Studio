'use client';

import { format, isSameMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { isAppointmentPastOrCompleted } from '@/lib/utils';
import { getApptColor, isPastCalendarDay } from './calendar-utils';
import type { CalendarAppointment } from './types';

export function MonthView({ monthDays, formattedAppts, currentDate, isMobile, now, onEmptyDayClick, onApptClick }: {
  monthDays: Date[];
  formattedAppts: Map<string, CalendarAppointment[]>;
  currentDate: Date;
  isMobile: boolean;
  now: Date;
  onEmptyDayClick: (day: Date) => void;
  onApptClick: (appt: CalendarAppointment, e: React.MouseEvent) => void;
}) {
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-7 gap-px mb-px">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-medium text-zinc-400 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden" role="grid" aria-label="Calendario mensual">
        {monthDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayAppts = formattedAppts.get(key) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const isPastDay = isPastCalendarDay(day, now);
          const maxVisible = isMobile ? 2 : 4;
          return (
            <div
              key={key}
              onClick={() => { if (!isPastDay) onEmptyDayClick(day); }}
              onKeyDown={(e) => { if (!isPastDay && (e.key === 'Enter' || e.key === ' ')) onEmptyDayClick(day); }}
              role="gridcell"
              tabIndex={0}
              aria-disabled={isPastDay}
              aria-selected={isTodayDate}
              className={cn(
                'min-h-[80px] sm:min-h-[110px] flex flex-col p-1 sm:p-1.5 transition-colors',
                isPastDay ? 'cursor-not-allowed bg-zinc-50' : 'cursor-pointer',
                isCurrentMonth ? (isPastDay ? 'bg-zinc-50' : 'bg-white hover:bg-zinc-50') : 'bg-zinc-50/50',
                isTodayDate && 'bg-salon-50/30'
              )}
              aria-label={`${format(day, "d 'de' MMMM")}${isTodayDate ? ', hoy' : ''}${isPastDay ? ', pasado' : ''}`}
              aria-current={isTodayDate ? 'date' : undefined}
            >
              <div className="flex items-center justify-between mb-0.5 shrink-0">
                <span className={cn(
                  'text-xs sm:text-sm font-medium size-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full shrink-0',
                  isTodayDate ? 'bg-salon-500 text-white' : isCurrentMonth ? (isPastDay ? 'text-zinc-300' : 'text-zinc-700') : 'text-zinc-200'
                )}>
                  {format(day, 'd')}
                </span>
                {dayAppts.length > maxVisible && (
                  <span className="text-[10px] font-semibold text-zinc-400 tabular-nums">
                    +{dayAppts.length - maxVisible}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-0.5 min-h-0 overflow-hidden">
                {dayAppts.slice(0, maxVisible).map((appt) => {
                  const colors = getApptColor(appt);
                  const isDead = appt.status === 'cancelada' || appt.status === 'no_show';
                  const isFaded = !isDead && isAppointmentPastOrCompleted(appt);
                  const timeStr = appt._timeStr;
                  const emoji = appt.appointment_services?.[0]?.service?.category?.icon;
                  return (
                    <button
                      key={appt.id}
                      type="button"
                      onClick={(e) => onApptClick(appt, e)}
                      className={cn(
                        'w-full text-left flex items-center gap-1 rounded-[4px] px-1 py-0.5 transition-all overflow-hidden',
                        colors.solid === 'bg-salon-500' ? 'bg-salon-100' : colors.bg,
                        colors.solid === 'bg-salon-500' ? 'border-l-[3px] border-salon-400' : `border-l-[3px] ${colors.border}`,
                        isDead && 'opacity-50 line-through',
                        isFaded && 'opacity-50 line-through',
                      )}
                    >
                      <span className="text-[10px] sm:text-xs font-semibold tabular-nums shrink-0">
                        {timeStr}
                      </span>
                      <span className="text-xs sm:text-sm font-medium truncate min-w-0">
                        {emoji && <span className="mr-0.5">{emoji}</span>}
                        {appt.client?.name || '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
