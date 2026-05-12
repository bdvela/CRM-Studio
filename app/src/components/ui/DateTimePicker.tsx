'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

function buildISO(d: Date, h: number, m: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`;
}

function getDaysInMonth(y: number, mo: number) {
  return new Date(y, mo + 1, 0).getDate();
}

function getFirstDayOfWeek(y: number, mo: number) {
  const d = new Date(y, mo, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [panel, setPanel] = useState<'closed' | 'date' | 'time'>('closed');
  const [month, setMonth] = useState(() => (value ? new Date(value) : new Date()));
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  const parsed = value ? new Date(value) : null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const daysInMonth = getDaysInMonth(month.getFullYear(), month.getMonth());
  const firstDay = getFirstDayOfWeek(month.getFullYear(), month.getMonth());

  useEffect(() => {
    if (panel !== 'time' || !timeRef.current) return;
    const sel = timeRef.current.querySelector('[data-selected="true"]');
    if (sel) {
      const id = setTimeout(() => sel.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
      return () => clearTimeout(id);
    }
    const nowH = new Date().getHours();
        const targetHour = Math.max(5, Math.min(nowH, 23));
    const targetRow = timeRef.current.querySelector(`[data-hour="${targetHour}"]`);
    if (targetRow) {
      const id = setTimeout(() => targetRow.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
      return () => clearTimeout(id);
    }
  }, [panel]);

  useEffect(() => {
    if (panel === 'closed') return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanel('closed');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panel]);

  function selectDate(day: number) {
    const h = parsed ? parsed.getHours() : 9;
    const m = parsed ? parsed.getMinutes() : 0;
    const newDate = new Date(month.getFullYear(), month.getMonth(), day);
    onChange(buildISO(newDate, h, m));
    setPanel('time');
  }

  function selectTime(h: number, m: number) {
    if (!parsed) return;
    onChange(buildISO(parsed, h, m));
    setPanel('closed');
  }

  function goPrevMonth() { setMonth(d => new Date(d.getFullYear(), d.getMonth() - 1)); }
  function goNextMonth() { setMonth(d => new Date(d.getFullYear(), d.getMonth() + 1)); }

  function selectToday() {
    const d = new Date();
    setMonth(new Date(d.getFullYear(), d.getMonth()));
    const h = parsed ? parsed.getHours() : 9;
    const m = parsed ? parsed.getMinutes() : 0;
    onChange(buildISO(d, h, m));
    setPanel('time');
  }

  const calDays: { day: number; curr: boolean; isToday: boolean; isSel: boolean; isPast: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    calDays.push({ day: getDaysInMonth(month.getFullYear(), month.getMonth() - 1) - i, curr: false, isToday: false, isSel: false, isPast: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(month.getFullYear(), month.getMonth(), d);
    calDays.push({
      day: d, curr: true,
      isToday: date.getTime() === today.getTime(),
      isSel: !!parsed && d === parsed.getDate() && month.getMonth() === parsed.getMonth() && month.getFullYear() === parsed.getFullYear(),
      isPast: date < today,
    });
  }
  while (calDays.length < 42) {
    calDays.push({ day: calDays.length - firstDay - daysInMonth + 1, curr: false, isToday: false, isSel: false, isPast: false });
  }

  const timeSlots: { h: number; m: number }[] = [];
  for (let h = 5; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      timeSlots.push({ h, m });
    }
  }

  const dateLabel = parsed ? format(parsed, "EEE d 'de' MMM", { locale: es }) : 'Seleccionar fecha';
  const timeLabel = parsed ? format(parsed, 'HH:mm') : '--:--';

  return (
    <div ref={containerRef} className="space-y-1.5">
      <label htmlFor="datetime-date-btn" className="block text-sm font-medium text-zinc-700">Fecha y hora</label>

      <div className="flex gap-2">
        <button
          type="button"
          id="datetime-date-btn"
          onClick={() => setPanel(panel === 'date' ? 'closed' : 'date')}
          className={cn(
            'flex-1 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-left transition-all',
            panel === 'date'
              ? 'border-salon-500 ring-2 ring-salon-500/20 bg-white'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          )}
        >
          <CalendarDays className="size-4 text-zinc-500" />
          <span className={cn('flex-1 truncate', parsed ? 'text-zinc-900 font-medium' : 'text-zinc-400')}>
            {dateLabel}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { if (parsed) setPanel(panel === 'time' ? 'closed' : 'time'); }}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all min-w-[88px]',
            !parsed && 'opacity-40 cursor-not-allowed',
            panel === 'time'
              ? 'border-salon-500 ring-2 ring-salon-500/20 bg-white'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          )}
        >
          <Clock className="size-4 text-zinc-500" />
          <span className={cn('tabular-nums font-medium', parsed ? 'text-zinc-900' : 'text-zinc-400')}>
            {timeLabel}
          </span>
        </button>
      </div>

      {panel !== 'closed' && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {panel === 'date' ? (
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <ChevronLeft className="size-4 text-zinc-600" />
                </button>
                <span className="text-sm font-semibold text-zinc-900">
                  {MONTHS[month.getMonth()]} {month.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <ChevronRight className="size-4 text-zinc-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {DAY_LETTERS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-zinc-400 py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {calDays.map((d, i) => (
                  <button
                    key={d.curr ? `day-${d.day}` : `cal-${i}`}
                    type="button"
                    onClick={() => d.curr && !d.isPast && selectDate(d.day)}
                    disabled={!d.curr || d.isPast}
                    className={cn(
                      'h-9 w-full rounded-lg text-sm font-medium transition-all flex items-center justify-center',
                      !d.curr && 'text-zinc-200 cursor-default',
                      d.isPast && 'text-zinc-300 cursor-default',
                      d.curr && !d.isSel && !d.isToday && !d.isPast && 'text-zinc-700 hover:bg-salon-50 hover:text-salon-700',
                      d.isToday && !d.isSel && 'text-salon-600 font-bold ring-1 ring-inset ring-salon-300',
                      d.isSel && 'bg-salon-500 text-white font-bold shadow-sm'
                    )}
                  >
                    {d.day}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={selectToday}
                className="w-full mt-3 py-2 text-xs font-semibold text-salon-600 rounded-xl hover:bg-salon-50 transition-colors"
              >
                Hoy
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-zinc-100">
                <button
                  type="button"
                  onClick={() => setPanel('date')}
                  className="flex items-center gap-1 text-xs font-semibold text-salon-600 hover:text-salon-700 px-2 py-1 rounded-lg hover:bg-salon-50 transition-colors"
                >
                  <ChevronLeft className="size-3.5" /> Cambiar fecha
                </button>
                <span className="text-xs font-semibold text-zinc-500 capitalize">
                  {parsed && format(parsed, "EEE d 'de' MMM", { locale: es })}
                </span>
              </div>

              <div ref={timeRef} className="p-2 grid grid-cols-3 gap-1 max-h-[212px] overflow-y-auto">
                {timeSlots.map((t) => {
                  const isSel = !!parsed && t.h === parsed.getHours() && t.m === parsed.getMinutes();
                  return (
                    <button
                      key={`${t.h}-${t.m}`}
                      type="button"
                      data-selected={isSel ? 'true' : 'false'}
                      data-hour={t.h}
                      onClick={() => selectTime(t.h, t.m)}
                      className={cn(
                        'py-2 rounded-lg text-sm font-medium transition-all tabular-nums',
                        isSel
                          ? 'bg-salon-500 text-white shadow-sm'
                          : 'text-zinc-700 hover:bg-salon-50 hover:text-salon-700'
                      )}
                    >
                      {String(t.h).padStart(2, '0')}:{String(t.m).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
