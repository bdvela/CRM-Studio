'use client';

import { useState, useMemo, useEffect, useRef, useReducer, memo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, addMonths, subMonths, addWeeks, subWeeks, isToday, eachDayOfInterval, getMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPastCalendarDay } from './calendar-utils';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { AppointmentDetail } from '@/components/citas/AppointmentDetail';
import type { AppointmentWithDetails, CalendarAppointment } from './types';
import { toast } from 'sonner';

interface CalendarViewProps {
  appointments: AppointmentWithDetails[];
  staff: any[];
  onEdit: (appt: AppointmentWithDetails) => void;
  onCancel: (appt: AppointmentWithDetails) => void;
  onNew: (date: Date) => void;
  onUpdateDate?: (apptId: string, newStart: Date) => void;
  onAdvanceStatus?: (appt: AppointmentWithDetails) => void;
  onMarkAsNoShow?: (appt: AppointmentWithDetails) => void;
}

interface CalendarUIState {
  view: 'month' | 'week' | 'day';
  selectedAppt: CalendarAppointment | null;
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

export const CalendarView = memo(function CalendarView({ appointments, staff, onEdit, onCancel, onNew, onUpdateDate, onAdvanceStatus, onMarkAsNoShow }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [ui, dispatchUI] = useReducer(calendarUIReducer, CALENDAR_UI_INIT);
  const draggedAppt = useRef<CalendarAppointment | null>(null);
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
    const endFormatted = format(end, "d 'de' MMMM", { locale: es }).toLowerCase();
    return `Semana del ${format(start, 'd')} al ${endFormatted}`;
  }, [currentDate, ui.view]);

  const apptsByDay = useMemo(() => {
    const map = new Map<string, AppointmentWithDetails[]>();
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
        } as CalendarAppointment;
      })
    ]));
  }, [apptsByDay]);

  const formattedApptsByHour = useMemo(() => {
    const dayHourMap = new Map<string, Map<number, CalendarAppointment[]>>();
    formattedAppts.forEach((dayAppts, dayKey) => {
      const hourMap = new Map<number, CalendarAppointment[]>();
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

  function handleApptClick(appt: CalendarAppointment, e: React.MouseEvent) {
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

  function handleDragStart(appt: CalendarAppointment, e: React.DragEvent) {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
         <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl shrink-0 w-full sm:w-auto">
            {(['month', 'week', 'day'] as const).map(v => (
              <button
                key={v}
                onClick={() => dispatchUI({ view: v })}
                className={cn(
                   'flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-lg transition-all',
                   ui.view === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                 )}
              >
                {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-1 min-w-0 w-full sm:w-auto sm:justify-start">
            <button onClick={prev} className="p-1.5 sm:p-2 rounded-xl hover:bg-zinc-100 transition-colors shrink-0" aria-label="Anterior">
              <ChevronLeft className="size-4 sm:w-5 sm:h-5 text-zinc-600" />
            </button>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-900 text-center min-w-[90px] sm:min-w-[140px] truncate">
              {ui.view === 'day'
                ? format(currentDate, "d 'de' MMMM yyyy", { locale: es }).toLowerCase()
                : ui.view === 'week'
                  ? <span className="sm:hidden">{format(currentDate, "'Sem' d MMM", { locale: es })}</span>
                  : null}
             {ui.view === 'week'
                 ? <span className="hidden sm:inline">{weekRangeLabel}</span>
                 : ui.view === 'month'
                    ? (() => { const m = format(currentDate, 'MMMM yyyy', { locale: es }); return m.charAt(0).toUpperCase() + m.slice(1); })()
                   : null}
           </h2>
           <button onClick={next} className="p-1.5 sm:p-2 rounded-xl hover:bg-zinc-100 transition-colors shrink-0" aria-label="Siguiente">
             <ChevronRight className="size-4 sm:w-5 sm:h-5 text-zinc-600" />
           </button>
            <button
              onClick={goToToday}
              className="ml-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-salon-600 hover:bg-salon-50 rounded-xl transition-colors border border-salon-200 shrink-0"
              aria-label="Ir a hoy"
            >
              Hoy
            </button>
          </div>
       </div>

      <div key={ui.view} className="animate-fadeIn">
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

      </div>
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
});
