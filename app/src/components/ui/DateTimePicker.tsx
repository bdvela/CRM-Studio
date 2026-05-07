'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [view, setView] = useState<'closed' | 'date' | 'time'>('closed');
  const [month, setMonth] = useState(new Date());
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);

  const date = value ? new Date(value) : new Date();

  useEffect(() => {
    if (value) {
      setHours(date.getHours());
      setMinutes(date.getMinutes());
    }
  }, []);

  function toggleView(v: 'date' | 'time') {
    setView(view === v ? 'closed' : v);
  }

  function selectDate(day: number) {
    const newDate = new Date(month.getFullYear(), month.getMonth(), day, hours, minutes);
    const pad = (n: number) => String(n).padStart(2, '0');
    const iso = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}T${pad(newDate.getHours())}:${pad(newDate.getMinutes())}`;
    onChange(iso);
  }

  function selectTime(h: number, m: number) {
    setHours(h);
    setMinutes(m);
    if (value) {
      const d = new Date(value);
      d.setHours(h, m);
      const pad = (n: number) => String(n).padStart(2, '0');
      const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`;
      onChange(iso);
    }
  }

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number) {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }

  function prevMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1));
  }

  function nextMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1));
  }

  function goToToday() {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth()));
    selectDate(now.getDate());
    setHours(now.getHours());
    setMinutes(Math.round(now.getMinutes() / 5) * 5);
  }

  const today = new Date();
  const daysInMonth = getDaysInMonth(month.getFullYear(), month.getMonth());
  const firstDay = getFirstDayOfMonth(month.getFullYear(), month.getMonth());
  const prevMonthDays = getDaysInMonth(
    month.getFullYear(),
    month.getMonth() - 1
  );

  const calendarDays: { day: number; current: boolean; today: boolean; selected: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, current: false, today: false, selected: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
    const isSelected = d === date.getDate() && month.getMonth() === date.getMonth() && month.getFullYear() === date.getFullYear();
    calendarDays.push({ day: d, current: true, today: isToday, selected: isSelected });
  }
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({ day: d, current: false, today: false, selected: false });
  }

  const timeSlots: { h: number; m: number }[] = [];
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
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
          onClick={() => toggleView('date')}
          className={cn(
            'flex-1 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-left transition-all',
            view === 'date'
              ? 'border-salon-500 ring-2 ring-salon-500/20 bg-white'
              : 'border-gray-300 bg-white hover:border-gray-400'
          )}
        >
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {value ? format(date, "d 'de' MMMM", { locale: es }) : 'Seleccionar fecha'}
          </span>
        </button>

        {/* Time trigger */}
        <button
          type="button"
          onClick={() => toggleView('time')}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-left transition-all min-w-[110px]',
            view === 'time'
              ? 'border-salon-500 ring-2 ring-salon-500/20 bg-white'
              : 'border-gray-300 bg-white hover:border-gray-400'
          )}
        >
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {value ? format(date, 'HH:mm') : '--:--'}
          </span>
        </button>
      </div>

      {/* Inline picker - stays inside modal */}
      {view !== 'closed' && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
          {view === 'date' ? (
            <>
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth()))}
                  className="text-sm font-semibold text-gray-900"
                >
                  {MONTHS[month.getMonth()]} {month.getFullYear()}
                </button>
                <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Days header */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => d.current && selectDate(d.day)}
                    disabled={!d.current}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center',
                      !d.current && 'text-gray-200 cursor-default',
                      d.current && !d.selected && !d.today && 'text-gray-700 hover:bg-gray-100',
                      d.today && !d.selected && 'bg-salon-50 text-salon-600 font-semibold',
                      d.selected && 'bg-salon-500 text-white font-semibold shadow-sm'
                    )}
                  >
                    {d.day}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={goToToday}
                className="w-full mt-2 py-2 text-xs font-medium text-salon-600 bg-salon-50/50 rounded-lg hover:bg-salon-100 transition-colors"
              >
                Ir a hoy
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Seleccionar hora</h3>
                <button
                  type="button"
                  onClick={() => setView('date')}
                  className="text-xs font-medium text-salon-600 hover:text-salon-700 px-2 py-1 rounded-lg hover:bg-salon-50 transition-colors"
                >
                  ← Cambiar fecha
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto">
                {timeSlots.map((t, i) => {
                  const isSelected = t.h === hours && t.m === minutes;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectTime(t.h, t.m)}
                      className={cn(
                        'py-2 px-1 rounded-lg text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-salon-500 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-100'
                      )}
                    >
                      {String(t.h).padStart(2, '0')}:{String(t.m).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
