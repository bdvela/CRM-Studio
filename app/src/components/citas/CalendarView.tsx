'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, isToday, startOfDay, eachDayOfInterval, getHours, getMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, X, Pencil, XCircle, User, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatTime } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { toast } from 'sonner';

export type ViewMode = 'list' | 'day' | 'week' | 'calendar';

const SERVICE_EMOJIS: Record<string, string> = {
  sistema_unas: '💅',
  pedicura: '🦶',
  makeup: '💄',
  pestanas: '👁️',
  cejas: '✨',
};

const ARTIST_COLORS = [
  { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700', solid: 'bg-rose-500' },
  { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-700', solid: 'bg-violet-500' },
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', solid: 'bg-blue-500' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', solid: 'bg-emerald-500' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', solid: 'bg-amber-500' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700', solid: 'bg-cyan-500' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-700', solid: 'bg-pink-500' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-700', solid: 'bg-teal-500' },
];

const CUSTOM_COLORS: Record<string, typeof ARTIST_COLORS[0]> = {
  rose: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700', solid: 'bg-rose-500' },
  violet: { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-700', solid: 'bg-violet-500' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', solid: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', solid: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', solid: 'bg-amber-500' },
  cyan: { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700', solid: 'bg-cyan-500' },
  pink: { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-700', solid: 'bg-pink-500' },
  teal: { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-700', solid: 'bg-teal-500' },
  red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', solid: 'bg-red-500' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', solid: 'bg-orange-500' },
  indigo: { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-700', solid: 'bg-indigo-500' },
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00

interface CalendarViewProps {
  appointments: any[];
  staff: any[];
  onEdit: (appt: any) => void;
  onCancel: (appt: any) => void;
  onNew: (date: Date) => void;
  onUpdateDate?: (apptId: string, newStart: Date) => void;
}

function getApptColor(appt: any, staff: any[]) {
  // Custom color takes priority
  if (appt.color && CUSTOM_COLORS[appt.color]) {
    return CUSTOM_COLORS[appt.color];
  }
  // Fallback to artist color
  const artistId = appt.artist_id;
  if (!artistId) return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-500', solid: 'bg-gray-400' };
  const idx = staff.findIndex(s => s.id === artistId);
  if (idx < 0) return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-500', solid: 'bg-gray-400' };
  return ARTIST_COLORS[idx % ARTIST_COLORS.length];
}

function getServiceEmoji(appt: any): string {
  const svc = appt.appointment_services?.[0]?.service;
  if (svc?.category) return SERVICE_EMOJIS[svc.category] || '📋';
  return '📋';
}

function getApptHeight(appt: any): string {
  const dur = appt.total_duration_min || 60;
  if (dur <= 45) return 'min-h-[32px]';
  if (dur <= 90) return 'min-h-[48px]';
  if (dur <= 120) return 'min-h-[64px]';
  return 'min-h-[80px]';
}

export function CalendarView({ appointments, staff, onEdit, onCancel, onNew, onUpdateDate }: CalendarViewProps) {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [draggedAppt, setDraggedAppt] = useState<any>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
        setSelectedAppt(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    if (view !== 'week') return '';
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `Semana del ${format(start, 'd')} al ${format(end, "d 'de' MMMM", { locale: es })}`;
  }, [currentDate, view]);

  const apptsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    appointments.forEach(appt => {
      const key = format(new Date(appt.start_time), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(appt);
    });
    return map;
  }, [appointments]);

  function goToToday() {
    setCurrentDate(new Date());
  }

  function prev() {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  }

  function next() {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  }

  function handleApptClick(appt: any, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedAppt(appt);
    setShowPopover(true);
  }

  function handleEmptyDayClick(day: Date) {
    onNew(day);
  }

  function handleDragStart(appt: any, e: React.DragEvent) {
    if (appt.status === 'cancelada' || appt.status === 'completada') {
      e.preventDefault();
      return;
    }
    setDraggedAppt(appt);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appt.id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(day: Date, hour: number, e: React.DragEvent) {
    e.preventDefault();
    if (!draggedAppt || !onUpdateDate) return;

    const newStart = new Date(day);
    newStart.setHours(hour, 0, 0, 0);

    // Preserve original minutes if dropping on same day
    const origStart = new Date(draggedAppt.start_time);
    if (isSameDay(newStart, origStart)) {
      newStart.setMinutes(getMinutes(origStart));
    }

    onUpdateDate(draggedAppt.id, newStart);
    setDraggedAppt(null);
    toast.success('Cita movida');
  }

  // ─── Month View ─────────────────────────────────────────────────────────
  function renderMonthView() {
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return (
      <div className="space-y-0">
        {/* Header */}
        <div className="grid grid-cols-7 gap-px mb-px">
          {dayNames.map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
          {monthDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayAppts = apptsByDay.get(key) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={key}
                onClick={() => handleEmptyDayClick(day)}
                className={cn(
                  'min-h-[90px] p-1.5 transition-colors cursor-pointer',
                  isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50',
                  isTodayDate && 'bg-salon-50/30'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isTodayDate ? 'bg-salon-500 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayAppts.length > 3 && (
                    <span className="text-[10px] text-gray-400">+{dayAppts.length - 3} más</span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {dayAppts.slice(0, 3).map((appt) => {
                    const colors = getApptColor(appt, staff);
                    const emoji = getServiceEmoji(appt);
                    const isCancelled = appt.status === 'cancelada';
                    const isCompleted = appt.status === 'completada';

                    return (
                      <button
                        key={appt.id}
                        type="button"
                        onClick={(e) => handleApptClick(appt, e)}
                        className={cn(
                          'w-full text-left px-1.5 py-0.5 rounded text-xs truncate border-l-2 transition-all',
                          colors.bg, colors.border, colors.text,
                          getApptHeight(appt),
                          isCancelled && 'opacity-40 line-through',
                          isCompleted && 'opacity-70'
                        )}
                      >
                        <span className="mr-0.5">{emoji}</span>
                        {format(new Date(appt.start_time), 'HH:mm')} {appt.client?.name || 'Sin clienta'}
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

  // ─── Week View ──────────────────────────────────────────────────────────
  function renderWeekView() {
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const now = new Date();

    return (
      <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-gray-100">
          <div className="p-3 text-xs text-gray-400 border-r border-gray-100 w-16">Hora</div>
          {weekDays.map((day, i) => (
            <div key={i} className={cn(
              'p-2 text-center border-r border-gray-50 last:border-r-0',
              isToday(day) && 'bg-salon-50/30'
            )}>
              <div className="text-xs text-gray-400">{dayNames[i]}</div>
              <div className={cn(
                'text-lg font-bold mt-0.5',
                isToday(day) ? 'text-salon-600' : 'text-gray-800'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative" style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
          {/* Current time line */}
          {weekDays.some(d => isSameDay(d, now)) && (
            <div
              className="absolute left-16 right-0 z-10 pointer-events-none"
              style={{ top: `${(getHours(now) - 7) * 64 + (getMinutes(now) / 60) * 64}px` }}
            >
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0" />
                <div className="flex-1 h-px bg-red-500" />
              </div>
            </div>
          )}

          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-50 min-h-[64px]">
              <div className="p-2 text-xs text-gray-300 border-r border-gray-100 text-right pr-2 relative -top-2">
                {String(hour).padStart(2, '0')}:00
              </div>
              {weekDays.map((day, dayIdx) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayAppts = apptsByDay.get(key) || [];
                const hourAppts = dayAppts.filter(a => getHours(new Date(a.start_time)) === hour);

                return (
                  <div
                    key={dayIdx}
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(hour, 0, 0, 0);
                      handleEmptyDayClick(d);
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(day, hour, e)}
                    className={cn(
                      'border-r border-gray-50 last:border-r-0 min-h-[64px] hover:bg-salon-50/20 transition-colors cursor-pointer relative',
                      isToday(day) && 'bg-salon-50/10'
                    )}
                  >
                    {hourAppts.map((appt) => {
                      const colors = getApptColor(appt, staff);
                      const emoji = getServiceEmoji(appt);
                      const isCancelled = appt.status === 'cancelada';
                      const isCompleted = appt.status === 'completada';
                      const startMin = getHours(new Date(appt.start_time)) * 60 + getMinutes(new Date(appt.start_time));
                      const topOffset = ((startMin - hour * 60) / 60) * 64;
                      const dur = appt.total_duration_min || 60;
                      const height = Math.max((dur / 60) * 64, 28);

                      return (
                        <button
                          key={appt.id}
                          type="button"
                          draggable
                          onDragStart={(e) => handleDragStart(appt, e)}
                          onClick={(e) => handleApptClick(appt, e)}
                          className={cn(
                            'absolute left-0.5 right-0.5 rounded-lg border-l-[3px] px-1.5 py-1 text-left overflow-hidden transition-all hover:shadow-md',
                            colors.bg, colors.border, colors.text,
                            isCancelled && 'opacity-40 line-through',
                            isCompleted && 'opacity-70',
                            !(isCancelled || isCompleted) && 'cursor-grab active:cursor-grabbing'
                          )}
                          style={{ top: `${topOffset}px`, height: `${height}px`, zIndex: 2 }}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{emoji}</span>
                            <span className="text-[10px] font-medium truncate">
                              {format(new Date(appt.start_time), 'HH:mm')} {appt.client?.name || ''}
                            </span>
                          </div>
                          {height > 40 && (
                            <div className="text-[9px] text-gray-500 truncate mt-0.5">
                              {appt.title} · {dur}min
                            </div>
                          )}
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          {(['month', 'week'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {v === 'month' ? 'Mes' : 'Semana'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
            {view === 'week' ? weekRangeLabel : format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <button onClick={next} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        {staff.filter(s => s.active).slice(0, 6).map((s, i) => {
          const colors = ARTIST_COLORS[i % ARTIST_COLORS.length];
          return (
            <div key={s.id} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded-full', colors.solid)} />
              <span>{s.name}</span>
            </div>
          );
        })}
      </div>

      {/* Calendar */}
      {view === 'month' ? renderMonthView() : renderWeekView()}

      {/* Appointment Popover */}
      {showPopover && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowPopover(false)}>
          <div ref={popoverRef} className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative">
              <div className={cn(
                'h-2',
                getApptColor(selectedAppt, staff).solid
              )} />
              <button
                onClick={() => setShowPopover(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{getServiceEmoji(selectedAppt)}</span>
                  <h3 className="text-lg font-semibold">{selectedAppt.title}</h3>
                </div>
                <p className={cn(
                  'text-sm font-medium',
                  selectedAppt.status === 'cancelada' ? 'text-red-500' : 'text-gray-500'
                )}>
                  {APPOINTMENT_STATUS_LABELS[selectedAppt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{format(new Date(selectedAppt.start_time), "EEEE d 'de' MMMM", { locale: es })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {formatTime(selectedAppt.start_time)} — {formatTime(selectedAppt.end_time || selectedAppt.start_time)}
                    {' '}({selectedAppt.total_duration_min} min)
                  </span>
                </div>
                {selectedAppt.client && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{selectedAppt.client.name}</span>
                  </div>
                )}
                {selectedAppt.artist && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{selectedAppt.artist.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold">{formatCurrency(selectedAppt.total_price)}</span>
                </div>
              </div>

              {selectedAppt.appointment_services?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedAppt.appointment_services.map((as: any, i: number) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                      {SERVICE_EMOJIS[as.service?.category] || ''} {as.service?.name}
                    </span>
                  ))}
                </div>
              )}

              {selectedAppt.notes && (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">{selectedAppt.notes}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {selectedAppt.status !== 'cancelada' && selectedAppt.status !== 'completada' && (
                  <button
                    onClick={() => { onCancel(selectedAppt); setShowPopover(false); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Cancelar
                  </button>
                )}
                <button
                  onClick={() => { onEdit(selectedAppt); setShowPopover(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-salon-600 hover:bg-salon-700 transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
