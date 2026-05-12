'use client';

import { useState, useMemo, useEffect, useRef, useReducer } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, isToday, startOfDay, eachDayOfInterval, getHours, getMinutes, set, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime, isAppointmentPastOrCompleted } from '@/lib/utils';
import { AppointmentDetail } from '@/components/citas/AppointmentDetail';
import { getServiceEmoji } from '@/components/citas/helpers';
import { toast } from 'sonner';

type ViewMode = 'list' | 'day' | 'week' | 'calendar';

type ApptColor = { bg: string; border: string; text: string; solid: string };

const APPT_COLORS: Record<string, ApptColor> = {
  rose:    { bg: 'bg-rose-100',    border: 'border-rose-300',    text: 'text-rose-700',    solid: 'bg-rose-500' },
  violet:  { bg: 'bg-violet-100',  border: 'border-violet-300',  text: 'text-violet-700',  solid: 'bg-violet-500' },
  blue:    { bg: 'bg-blue-100',    border: 'border-blue-300',    text: 'text-blue-700',    solid: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', solid: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-100',   border: 'border-amber-300',   text: 'text-amber-700',   solid: 'bg-amber-500' },
  cyan:    { bg: 'bg-cyan-100',    border: 'border-cyan-300',    text: 'text-cyan-700',    solid: 'bg-cyan-500' },
  pink:    { bg: 'bg-pink-100',    border: 'border-pink-300',    text: 'text-pink-700',    solid: 'bg-pink-500' },
  teal:    { bg: 'bg-teal-100',    border: 'border-teal-300',    text: 'text-teal-700',    solid: 'bg-teal-500' },
  red:     { bg: 'bg-red-100',     border: 'border-red-300',     text: 'text-red-700',     solid: 'bg-red-500' },
  orange:  { bg: 'bg-orange-100',  border: 'border-orange-300',  text: 'text-orange-700',  solid: 'bg-orange-500' },
  indigo:  { bg: 'bg-indigo-100',  border: 'border-indigo-300',  text: 'text-indigo-700',  solid: 'bg-indigo-500' },
};

const DEFAULT_COLOR: ApptColor = { bg: 'bg-salon-100', border: 'border-salon-300', text: 'text-salon-700', solid: 'bg-salon-500' };

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00

function isPastCalendarDay(day: Date, now: Date) {
  return isBefore(startOfDay(day), startOfDay(now));
}

interface CalendarViewProps {
  appointments: any[];
  staff: any[];
  onEdit: (appt: any) => void;
  onCancel: (appt: any) => void;
  onNew: (date: Date) => void;
  onUpdateDate?: (apptId: string, newStart: Date) => void;
  onAdvanceStatus?: (appt: any) => void;
  onMarkAsNoShow?: (appt: any) => void;
}

const DEAD_COLOR: ApptColor = { bg: 'bg-zinc-100', border: 'border-zinc-200', text: 'text-zinc-400', solid: 'bg-zinc-400' };

function getApptColor(appt: any, now?: Date): ApptColor {
  const isDead = appt.status === 'cancelada' || appt.status === 'no_show';
  const isFaded = appt.status === 'completada' || (
    !isDead && new Date(appt.end_time || appt.start_time) < (now || new Date())
  );
  if (isDead || isFaded) return DEAD_COLOR;
  if (appt.color && APPT_COLORS[appt.color]) return APPT_COLORS[appt.color];
  return DEFAULT_COLOR;
}

function getApptHeight(appt: any): string {
  const dur = appt.total_duration_min || 60;
  if (dur <= 45) return 'min-h-[32px]';
  if (dur <= 90) return 'min-h-[48px]';
  if (dur <= 120) return 'min-h-[64px]';
  return 'min-h-[80px]';
}

function MonthView({ monthDays, formattedAppts, currentDate, isMobile, now, onEmptyDayClick, onApptClick }: {
  monthDays: Date[];
  formattedAppts: Map<string, any[]>;
  currentDate: Date;
  isMobile: boolean;
  now: Date;
  onEmptyDayClick: (day: Date) => void;
  onApptClick: (appt: any, e: React.MouseEvent) => void;
}) {
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-7 gap-px mb-px">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-medium text-zinc-400 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden">
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
              role={isPastDay ? undefined : 'button'}
              tabIndex={isPastDay ? -1 : 0}
              className={cn(
                'min-h-[72px] sm:min-h-[100px] flex flex-col p-1 sm:p-1.5 transition-colors',
                isPastDay ? 'opacity-45 cursor-not-allowed bg-zinc-50/50' : 'cursor-pointer',
                isCurrentMonth ? (isPastDay ? 'bg-zinc-50/40' : 'bg-white hover:bg-zinc-50') : 'bg-zinc-50/50',
                isTodayDate && 'bg-salon-50/30'
              )}
            >
              <div className="flex items-center justify-between mb-0.5 shrink-0">
                <span className={cn(
                  'text-xs sm:text-sm font-medium size-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full shrink-0',
                  isTodayDate ? 'bg-salon-500 text-white' : isCurrentMonth ? 'text-zinc-700' : 'text-zinc-300'
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
                  const clientName = appt.client?.name || '—';
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
                      <span className="text-[9px] sm:text-[10px] font-semibold tabular-nums shrink-0">
                        {timeStr}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-medium truncate min-w-0">
                        {emoji && <span className="mr-0.5">{emoji}</span>}
                        {clientName}
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

function WeekView({ weekDays, formattedApptsByHour, now, onEmptyDayClick, onApptClick, onDragStart, onDragOver, onDrop }: {
  weekDays: Date[];
  formattedApptsByHour: Map<string, Map<number, any[]>>;
  now: Date;
  onEmptyDayClick: (day: Date) => void;
  onApptClick: (appt: any, e: React.MouseEvent) => void;
  onDragStart: (appt: any, e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (day: Date, hour: number, e: React.DragEvent) => void;
}) {
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100">
    <div className="min-w-[560px] bg-white">
      <div className="grid grid-cols-8 border-b border-zinc-100">
        <div className="p-3 text-xs text-zinc-400 border-r border-zinc-100 w-16">Hora</div>
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

      <div className="relative" style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
        {weekDays.some(d => isSameDay(d, now)) && (
          <div
            className="absolute left-16 right-0 z-10 pointer-events-none"
            style={{ top: `${(getHours(now) - 7) * 64 + (getMinutes(now) / 60) * 64}px` }}
          >
            <div className="flex items-center">
              <div className="size-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0" />
              <div className="flex-1 h-px bg-red-500" />
            </div>
          </div>
        )}

        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-zinc-50 min-h-[64px]">
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
                  role={isPastDay ? undefined : 'button'}
                  tabIndex={isPastDay ? -1 : 0}
                  onDragOver={onDragOver}
                  onDrop={(e) => { if (!isPastDay) onDrop(day, hour, e); }}
                  className={cn(
                    'border-r border-zinc-50 last:border-r-0 min-h-[64px] transition-colors relative',
                    isPastDay ? 'opacity-45 cursor-not-allowed bg-zinc-50/40' : 'hover:bg-salon-50/20 cursor-pointer',
                    isToday(day) && 'bg-salon-50/10'
                  )}
                >
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
                          'absolute left-0.5 right-0.5 text-left overflow-hidden transition-all',
                          'rounded-lg border-l-[4px] hover:shadow-md',
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
                              'text-[10px] font-bold tabular-nums leading-none shrink-0',
                              colors.solid === 'bg-salon-500' ? 'text-salon-700' : colors.text
                            )}>
                              {appt._timeStr}
                            </span>
                            {height > 26 && (
                              <span className="text-[9px] leading-none truncate opacity-70">
                                {appt.client?.name || '—'}
                              </span>
                            )}
                          </div>
                          {height > 44 && appt.appointment_services?.[0]?.service && (
                            <div className="flex items-center gap-1 mt-0.5 min-w-0">
                              <span className="text-[9px] shrink-0">{appt.appointment_services[0].service.category?.icon}</span>
                              <span className="text-[9px] leading-tight truncate opacity-70">
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
}

function DayView({ currentDate, formattedApptsByHour, now, onEmptyDayClick, onApptClick, onDragStart, onDragOver, onDrop }: {
  currentDate: Date;
  formattedApptsByHour: Map<string, Map<number, any[]>>;
  now: Date;
  onEmptyDayClick: (day: Date) => void;
  onApptClick: (appt: any, e: React.MouseEvent) => void;
  onDragStart: (appt: any, e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (day: Date, hour: number, e: React.DragEvent) => void;
}) {
  const day = currentDate;
  const key = format(day, 'yyyy-MM-dd');

  return (
    <div className="border border-zinc-100 rounded-2xl overflow-hidden bg-white">
      <div className="grid grid-cols-2 border-b border-zinc-100">
        <div className="p-3 text-xs text-zinc-400 border-r border-zinc-100 w-16">Hora</div>
        <div className={cn(
          'p-2 text-center',
          isToday(day) && 'bg-salon-50/30'
        )}>
          <div className="text-xs text-zinc-400">{format(day, 'EEE', { locale: es })}</div>
          <div className={cn(
            'text-lg font-bold mt-0.5',
            isToday(day) ? 'text-salon-600' : 'text-zinc-800'
          )}>
            {format(day, 'd')}
          </div>
        </div>
      </div>

      <div className="relative" style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
        {isSameDay(day, now) && (
          <div
            className="absolute left-16 right-0 z-10 pointer-events-none"
            style={{ top: `${(getHours(now) - 7) * 64 + (getMinutes(now) / 60) * 64}px` }}
          >
            <div className="flex items-center">
              <div className="size-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0" />
              <div className="flex-1 h-px bg-red-500" />
            </div>
          </div>
        )}

        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-2 border-b border-zinc-50 min-h-[64px]">
            <div className="p-2 text-xs text-zinc-300 border-r border-zinc-100 text-right pr-2 relative -top-2">
              {String(hour).padStart(2, '0')}:00
            </div>
            {(() => {
              const hourAppts = formattedApptsByHour.get(key)?.get(hour) || [];
              const isPastDay = isPastCalendarDay(day, now);
              return (
                <div
                  onClick={() => {
                    if (!isPastDay) onEmptyDayClick(set(day, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 }));
                  }}
                  onKeyDown={(e) => {
                    if (!isPastDay && (e.key === 'Enter' || e.key === ' ')) {
                      onEmptyDayClick(set(day, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 }));
                    }
                  }}
                  role={isPastDay ? undefined : 'button'}
                  tabIndex={isPastDay ? -1 : 0}
                  onDragOver={onDragOver}
                  onDrop={(e) => { if (!isPastDay) onDrop(day, hour, e); }}
                  className={cn(
                    'min-h-[64px] transition-colors relative',
                    isPastDay ? 'opacity-45 cursor-not-allowed bg-zinc-50/40' : 'hover:bg-salon-50/20 cursor-pointer',
                    isToday(day) && 'bg-salon-50/10'
                  )}
                >
                  {hourAppts.map((appt) => {
                    const colors = getApptColor(appt);
                    const emoji = getServiceEmoji(appt);
                    const isCancelled = appt.status === 'cancelada';
                    const isPastOrCompleted = isAppointmentPastOrCompleted(appt);
                    const startMin = appt._hour * 60 + appt._minute;
                    const topOffset = ((startMin - hour * 60) / 60) * 64;
                    const dur = appt.total_duration_min || 60;
                    const height = Math.max((dur / 60) * 64, 28);

                    return (
                      <button
                        key={appt.id}
                        type="button"
                        draggable={!isPastOrCompleted}
                        onDragStart={(e) => onDragStart(appt, e)}
                        onClick={(e) => onApptClick(appt, e)}
                        className={cn(
                          'absolute left-0.5 right-0.5 rounded-lg border-l-[3px] px-1.5 py-1 text-left overflow-hidden transition-all hover:shadow-md',
                          colors.bg, colors.border, colors.text,
                          isCancelled && 'opacity-50 line-through',
                          isPastOrCompleted && !isCancelled && 'opacity-50 line-through',
                          !isPastOrCompleted && 'cursor-grab active:cursor-grabbing'
                        )}
                        style={{ top: `${topOffset}px`, height: `${height}px`, zIndex: 2 }}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{emoji}</span>
                          <span className="text-[10px] font-medium truncate">
                            {appt._timeStr} {appt.client?.name || ''}
                          </span>
                        </div>
                        {dur > 45 && (
                          <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                            {appt.title}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CalendarUIState {
  view: 'month' | 'week' | 'day';
  selectedAppt: any;
  showPopover: boolean;
}

const CALENDAR_UI_INIT: CalendarUIState = {
  view: 'month',
  selectedAppt: null,
  showPopover: false,
};

function calendarUIReducer(state: CalendarUIState, action: Partial<CalendarUIState>): CalendarUIState {
  return { ...state, ...action };
}

export function CalendarView({ appointments, staff, onEdit, onCancel, onNew, onUpdateDate, onAdvanceStatus, onMarkAsNoShow }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [ui, dispatchUI] = useReducer(calendarUIReducer, CALENDAR_UI_INIT);
  const draggedAppt = useRef<any>(null);
  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekRangeLabel = useMemo(() => {
    if (ui.view !== 'week') return '';
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `Semana del ${format(start, 'd')} al ${format(end, "d 'de' MMMM", { locale: es })}`;
  }, [currentDate, ui.view]);

  const apptsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    appointments.forEach(appt => {
      const key = format(new Date(appt.start_time), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(appt);
    });
    return map;
  }, [appointments]);

  const formattedAppts = useMemo(() => {
    return new Map(Array.from(apptsByDay.entries()).map(([key, appts]) => [
      key,
      appts.map(appt => {
        const d = new Date(appt.start_time);
        return {
          ...appt,
          _timeStr: format(d, 'HH:mm'),
          _dateStr: format(d, "EEEE d 'de' MMMM", { locale: es }),
          _hour: d.getHours(),
          _minute: d.getMinutes(),
        };
      })
    ]));
  }, [apptsByDay]);

  const formattedApptsByHour = useMemo(() => {
    const dayHourMap = new Map<string, Map<number, any[]>>();

    formattedAppts.forEach((dayAppts, dayKey) => {
      const hourMap = new Map<number, any[]>();
      dayAppts.forEach((appt) => {
        const hour = appt._hour;
        const list = hourMap.get(hour) || [];
        list.push(appt);
        hourMap.set(hour, list);
      });
      dayHourMap.set(dayKey, hourMap);
    });

    return dayHourMap;
  }, [formattedAppts]);

  function goToToday() {
    setCurrentDate(new Date());
  }

  function prev() {
    if (ui.view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (ui.view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  }

  function next() {
    if (ui.view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (ui.view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  }

  function handleApptClick(appt: any, e: React.MouseEvent) {
    e.stopPropagation();
    dispatchUI({ selectedAppt: appt, showPopover: true });
  }

  function handleEmptyDayClick(day: Date) {
    if (isPastCalendarDay(day, now)) {
      toast.error('No puedes agendar en un día pasado');
      return;
    }
    onNew(day);
  }

  function handleDragStart(appt: any, e: React.DragEvent) {
    if (appt.status === 'cancelada' || appt.status === 'completada') {
      e.preventDefault();
      return;
    }
    draggedAppt.current = appt;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appt.id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(day: Date, hour: number, e: React.DragEvent) {
    e.preventDefault();
    if (!draggedAppt.current || !onUpdateDate) return;

    const newStart = new Date(day);
    newStart.setHours(hour, 0, 0, 0);

    const origStart = new Date(draggedAppt.current.start_time);
    if (isSameDay(newStart, origStart)) {
      newStart.setMinutes(getMinutes(origStart));
    }

    onUpdateDate(draggedAppt.current.id, newStart);
    draggedAppt.current = null;
    toast.success('Cita movida');
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
         <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl shrink-0 w-full sm:w-auto">
            {(['month', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => dispatchUI({ view: v })}
                className={cn(
                   'flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-lg transition-all',
                   ui.view === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                 )}
              >
                {v === 'month' ? 'Mes' : 'Semana'}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-1 min-w-0 w-full sm:w-auto sm:justify-start">
            <button onClick={prev} className="p-1.5 sm:p-2 rounded-xl hover:bg-zinc-100 transition-colors shrink-0">
              <ChevronLeft className="size-4 sm:w-5 sm:h-5 text-zinc-600" />
            </button>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-900 text-center capitalize min-w-[90px] sm:min-w-[140px] truncate">
               {ui.view === 'week'
                ? <span className="sm:hidden">{format(currentDate, "'Sem' d MMM", { locale: es })}</span>
                : null}
             {ui.view === 'week'
                ? <span className="hidden sm:inline">{weekRangeLabel}</span>
                : format(currentDate, 'MMMM yyyy', { locale: es })}
           </h2>
           <button onClick={next} className="p-1.5 sm:p-2 rounded-xl hover:bg-zinc-100 transition-colors shrink-0">
             <ChevronRight className="size-4 sm:w-5 sm:h-5 text-zinc-600" />
           </button>
            <button
              onClick={goToToday}
              className="ml-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-salon-600 hover:bg-salon-50 rounded-xl transition-colors border border-salon-200 shrink-0"
            >
              Hoy
            </button>
          </div>
       </div>

      {/* Calendar */}
      {ui.view === 'month' ? (
        <MonthView
          monthDays={monthDays}
          formattedAppts={formattedAppts}
          currentDate={currentDate}
          isMobile={isMobile}
          now={now}
          onEmptyDayClick={handleEmptyDayClick}
          onApptClick={handleApptClick}
        />
      ) : ui.view === 'week' ? (
        <WeekView
          weekDays={weekDays}
          formattedApptsByHour={formattedApptsByHour}
          now={now}
          onEmptyDayClick={handleEmptyDayClick}
          onApptClick={handleApptClick}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ) : (
        <DayView
          currentDate={currentDate}
          formattedApptsByHour={formattedApptsByHour}
          now={now}
          onEmptyDayClick={handleEmptyDayClick}
          onApptClick={handleApptClick}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      )}

      {/* Appointment Popover */}
      {ui.showPopover && ui.selectedAppt && (
        <AppointmentDetail
          appt={ui.selectedAppt}
          onClose={() => dispatchUI({ showPopover: false })}
          onEdit={(appt) => { onEdit(appt); }}
          onCancel={(appt) => { onCancel(appt); }}
          onAdvanceStatus={(appt) => { onAdvanceStatus?.(appt); }}
          onMarkAsNoShow={(appt) => { onMarkAsNoShow?.(appt); }}
        />
      )}
    </div>
  );
}
