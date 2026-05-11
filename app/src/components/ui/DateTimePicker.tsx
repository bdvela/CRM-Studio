'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [panel, setPanel] = useState<'closed' | 'date' | 'time'>('closed');
  const [month, setMonth] = useState(() => (value ? new Date(value) : new Date()));
  const timeRef = useRef<HTMLDivElement>(null);

  const parsed = value ? new Date(value) : null;

  function buildISO(d: Date, h: number, m: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`;
  }

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

  useEffect(() => {
    if (panel === 'time' && timeRef.current) {
      const sel = timeRef.current.querySelector('[data-selected="true"]');
      if (sel) setTimeout(() => sel.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    }
  }, [panel]);

  const today = new Date();

  function getDaysInMonth(y: number, mo: number) {
    return new Date(y, mo + 1, 0).getDate();
  }
  function getFirstDayOfWeek(y: number, mo: number) {
    const d = new Date(y, mo, 1).getDay();
    return d === 0 ? 6 : d - 1;
  }

  const daysInMonth = getDaysInMonth(month.getFullYear(), month.getMonth());
  const firstDay = getFirstDayOfWeek(month.getFullYear(), month.getMonth());
  const prevDays = getDaysInMonth(month.getFullYear(), month.getMonth() - 1);

  const calDays: { day: number; curr: boolean; isToday: boolean; isSel: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    calDays.push({ day: prevDays - i, curr: false, isToday: false, isSel: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calDays.push({
      day: d,
      curr: true,
      isToday:
        d === today.getDate() &&
        month.getMonth() === today.getMonth() &&
        month.getFullYear() === today.getFullYear(),
      isSel:
        !!parsed &&
        d === parsed.getDate() &&
        month.getMonth() === parsed.getMonth() &&
        month.getFullYear() === parsed.getFullYear(),
    });
  }
  while (calDays.length < 42) {
    calDays.push({ day: calDays.length - firstDay - daysInMonth + 1, curr: false, isToday: false, isSel: false });
  }

  const timeSlots: { h: number; m: number }[] = [];
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 21 && m > 0) break;
      timeSlots.push({ h, m });
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">Fecha y hora</label>

      <div className="flex gap-2">
        {/* Date trigger */}
        <button
          type="button"
          onClick={() => setPanel(panel === 'date' ? 'closed' : 'date')}
          className={cn(
            'flex-1 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-left transition-all',
            panel === 'date'
              ? 'border-salon-500 ring-2 ring-salon-500/20 bg-white'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <span className="text-base leading-none">📅</span>
          <span className={cn('flex-1 truncate', parsed ? 'text-gray-900 font-medium' : 'text-gray-400')}>
            {parsed ? format(parsed, "EEE d 'de' MMM", { locale: es }) : 'Seleccionar fecha'}
          </span>
        </button>

        {/* Time trigger */}
        <button
          type="button"
          onClick={() => { if (parsed) setPanel(panel === 'time' ? 'closed' : 'time'); }}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all min-w-[88px]',
            !parsed && 'opacity-40 cursor-not-allowed',
            panel === 'time'
              ? 'border-salon-500 ring-2 ring-salon-500/20 bg-white'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <span className="text-base leading-none">🕐</span>
          <span className={cn('tabular-nums font-medium', parsed ? 'text-gray-900' : 'text-gray-400')}>
            {parsed ? format(parsed, 'HH:mm') : '--:--'}
          </span>
        </button>
      </div>

      {/* Expanded panel */}
      {panel !== 'closed' && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {panel === 'date' ? (
            <div className="p-3">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth()))}
                  className="text-sm font-semibold text-gray-900 hover:text-salon-600 px-2 py-1 rounded-lg hover:bg-salon-50 transition-colors"
                >
                  {MONTHS[month.getMonth()]} {month.getFullYear()}
                </button>
                <button
                  type="button"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_LETTERS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {calDays.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => d.curr && selectDate(d.day)}
                    disabled={!d.curr}
                    className={cn(
                      'h-9 w-full rounded-lg text-sm font-medium transition-all flex items-center justify-center',
                      !d.curr && 'text-gray-200 cursor-default',
                      d.curr && !d.isSel && !d.isToday && 'text-gray-700 hover:bg-salon-50 hover:text-salon-700',
                      d.isToday && !d.isSel && 'text-salon-600 font-bold ring-1 ring-inset ring-salon-300',
                      d.isSel && 'bg-salon-500 text-white font-bold shadow-sm'
                    )}
                  >
                    {d.day}
                  </button>
                ))}
              </div>

              {/* Today shortcut */}
              <button
                type="button"
                onClick={() => {
                  setMonth(new Date(today.getFullYear(), today.getMonth()));
                  selectDate(today.getDate());
                }}
                className="w-full mt-3 py-2 text-xs font-semibold text-salon-600 rounded-xl hover:bg-salon-50 transition-colors"
              >
                Hoy
              </button>
            </div>
          ) : (
            <div>
              {/* Time header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setPanel('date')}
                  className="flex items-center gap-1 text-xs font-semibold text-salon-600 hover:text-salon-700 px-2 py-1 rounded-lg hover:bg-salon-50 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Cambiar fecha
                </button>
                <span className="text-xs font-semibold text-gray-500 capitalize">
                  {parsed && format(parsed, "EEE d 'de' MMM", { locale: es })}
                </span>
              </div>

              {/* Time grid */}
              <div ref={timeRef} className="p-2 grid grid-cols-3 gap-1 max-h-[204px] overflow-y-auto">
                {timeSlots.map((t, i) => {
                  const isSel = !!parsed && t.h === parsed.getHours() && t.m === parsed.getMinutes();
                  return (
                    <button
                      key={i}
                      type="button"
                      data-selected={isSel ? 'true' : 'false'}
                      onClick={() => selectTime(t.h, t.m)}
                      className={cn(
                        'py-2 rounded-lg text-sm font-medium transition-all tabular-nums',
                        isSel
                          ? 'bg-salon-500 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-salon-50 hover:text-salon-700'
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
