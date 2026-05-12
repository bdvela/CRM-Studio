'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';

const MONTHS = [
  { value: 0, label: 'Enero', days: 31 },
  { value: 1, label: 'Febrero', days: 28 },
  { value: 2, label: 'Marzo', days: 31 },
  { value: 3, label: 'Abril', days: 30 },
  { value: 4, label: 'Mayo', days: 31 },
  { value: 5, label: 'Junio', days: 30 },
  { value: 6, label: 'Julio', days: 31 },
  { value: 7, label: 'Agosto', days: 31 },
  { value: 8, label: 'Septiembre', days: 30 },
  { value: 9, label: 'Octubre', days: 31 },
  { value: 10, label: 'Noviembre', days: 30 },
  { value: 11, label: 'Diciembre', days: 31 },
];

function getDaysInMonth(year: number, month: number): number {
  if (month === 1) {
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
      return 29;
    }
    return 28;
  }
  return MONTHS[month].days;
}

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
}

type DateParts = { day: number | null; month: number | null; year: number | null };

function dateFromValue(value: string | null): DateParts {
  if (!value) return { day: null, month: null, year: null };
  const d = new Date(value + 'T00:00:00');
  return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
}

function toIsoDate(day: number, month: number, year: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [dp, setDp] = useState<DateParts>(() => dateFromValue(value));
  const prevValue = useRef(value);

  if (value !== prevValue.current) {
    prevValue.current = value;
    setDp(dateFromValue(value));
  }

  const currentYear = new Date().getFullYear();
  const minYear = 1940;
  
  const years = Array.from(
    { length: currentYear - minYear + 1 },
    (_, i) => currentYear - i
  );

  function emitChange(updated: DateParts) {
    if (updated.day !== null && updated.month !== null && updated.year !== null) {
      const maxDays = getDaysInMonth(updated.year, updated.month);
      const actualDay = Math.min(updated.day, maxDays);
      onChange(toIsoDate(actualDay, updated.month, updated.year));
    }
  }

  function handleDayChange(newDay: number | null) {
    const updated = { ...dp, day: newDay };
    setDp(updated);
    emitChange(updated);
  }

  function handleMonthChange(newMonth: number | null) {
    let updated = { ...dp, month: newMonth };
    if (newMonth !== null && dp.year !== null && dp.day !== null) {
      const maxDays = getDaysInMonth(dp.year, newMonth);
      if (dp.day > maxDays) {
        updated = { ...updated, day: maxDays };
      }
    }
    setDp(updated);
    emitChange(updated);
  }

  function handleYearChange(newYear: number | null) {
    let updated = { ...dp, year: newYear };
    if (newYear !== null && dp.month !== null && dp.day !== null) {
      const maxDays = getDaysInMonth(newYear, dp.month);
      if (dp.day > maxDays) {
        updated = { ...updated, day: maxDays };
      }
    }
    setDp(updated);
    emitChange(updated);
  }

  function clearDate() {
    const cleared: DateParts = { day: null, month: null, year: null };
    setDp(cleared);
    onChange(null);
  }

  const maxDaysForSelection = dp.month !== null && dp.year !== null 
    ? getDaysInMonth(dp.year, dp.month) 
    : 31;

  const daysArray = Array.from({ length: maxDaysForSelection }, (_, i) => i + 1);

  const hasValue = dp.day !== null && dp.month !== null && dp.year !== null;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-zinc-700">{label}</label>
      )}
      
      {/* Dropdowns simples: Día / Mes / Año */}
      <div className="grid grid-cols-3 gap-2">
        {/* DÍA */}
        <div className="space-y-1">
          <label htmlFor="dp-day" className="text-xs text-zinc-500 font-medium">Día</label>
           <select id="dp-day"
             value={dp.day ?? ''}
             onChange={(e) => handleDayChange(e.target.value ? Number(e.target.value) : null)}
             className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 bg-white focus:border-salon-500 focus:ring-2 focus:ring-salon-500/20 transition-all cursor-pointer"
           >
            <option value="">--</option>
            {daysArray.map((d) => (
              <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
            ))}
          </select>
        </div>

        {/* MES */}
        <div className="space-y-1">
          <label htmlFor="dp-month" className="text-xs text-zinc-500 font-medium">Mes</label>
           <select id="dp-month"
             value={dp.month ?? ''}
             onChange={(e) => handleMonthChange(e.target.value !== '' ? Number(e.target.value) : null)}
             className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 bg-white focus:border-salon-500 focus:ring-2 focus:ring-salon-500/20 transition-all cursor-pointer"
           >
            <option value="">--</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* AÑO */}
        <div className="space-y-1">
          <label htmlFor="dp-year" className="text-xs text-zinc-500 font-medium">Año</label>
           <select id="dp-year"
             value={dp.year ?? ''}
             onChange={(e) => handleYearChange(e.target.value ? Number(e.target.value) : null)}
             className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 bg-white focus:border-salon-500 focus:ring-2 focus:ring-salon-500/20 transition-all cursor-pointer"
           >
            <option value="">--</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botón para limpiar */}
      {hasValue && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearDate}
            className="text-xs text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <X className="size-3" />
            Quitar fecha
          </button>
        </div>
      )}
    </div>
  );
}
