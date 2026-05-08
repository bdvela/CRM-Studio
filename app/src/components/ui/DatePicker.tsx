'use client';

import { useState, useEffect } from 'react';
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

export function DatePicker({ value, onChange, label, placeholder = 'Seleccionar fecha' }: DatePickerProps) {
  const date = value ? new Date(value + 'T00:00:00') : null;

  const [day, setDay] = useState<number | null>(date ? date.getDate() : null);
  const [month, setMonth] = useState<number | null>(date ? date.getMonth() : null);
  const [year, setYear] = useState<number | null>(date ? date.getFullYear() : null);

  const [isModified, setIsModified] = useState(false);

  const currentYear = new Date().getFullYear();
  const minYear = 1940;
  
  const years = Array.from(
    { length: currentYear - minYear + 1 },
    (_, i) => currentYear - i
  );

  useEffect(() => {
    if (value && date && !isModified) {
      setDay(date.getDate());
      setMonth(date.getMonth());
      setYear(date.getFullYear());
    }
  }, [value, isModified]);

  function applySelection() {
    if (day !== null && month !== null && year !== null) {
      const maxDays = getDaysInMonth(year, month);
      const actualDay = Math.min(day, maxDays);
      const newDate = new Date(year, month, actualDay);
      const pad = (n: number) => String(n).padStart(2, '0');
      const isoDate = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}`;
      onChange(isoDate);
      setIsModified(false);
    }
  }

  useEffect(() => {
    if (isModified && day !== null && month !== null && year !== null) {
      applySelection();
    }
  }, [day, month, year, isModified]);

  function handleDayChange(newDay: number | null) {
    setDay(newDay);
    setIsModified(true);
  }

  function handleMonthChange(newMonth: number | null) {
    setMonth(newMonth);
    if (newMonth !== null && year !== null && day !== null) {
      const maxDays = getDaysInMonth(year, newMonth);
      if (day > maxDays) {
        setDay(maxDays);
      }
    }
    setIsModified(true);
  }

  function handleYearChange(newYear: number | null) {
    setYear(newYear);
    if (newYear !== null && month !== null && day !== null) {
      const maxDays = getDaysInMonth(newYear, month);
      if (day > maxDays) {
        setDay(maxDays);
      }
    }
    setIsModified(true);
  }

  function clearDate() {
    onChange(null);
    setDay(null);
    setMonth(null);
    setYear(null);
    setIsModified(false);
  }

  const maxDaysForSelection = month !== null && year !== null 
    ? getDaysInMonth(year, month) 
    : 31;

  const daysArray = Array.from({ length: maxDaysForSelection }, (_, i) => i + 1);

  const hasValue = day !== null && month !== null && year !== null;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      
      {/* Dropdowns simples: Día / Mes / Año */}
      <div className="grid grid-cols-3 gap-2">
        {/* DÍA */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Día</label>
          <select
            value={day ?? ''}
            onChange={(e) => handleDayChange(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-salon-500 focus:ring-2 focus:ring-salon-500/20 transition-all cursor-pointer"
          >
            <option value="">--</option>
            {daysArray.map((d) => (
              <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
            ))}
          </select>
        </div>

        {/* MES */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Mes</label>
          <select
            value={month ?? ''}
            onChange={(e) => handleMonthChange(e.target.value !== '' ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-salon-500 focus:ring-2 focus:ring-salon-500/20 transition-all cursor-pointer"
          >
            <option value="">--</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* AÑO */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Año</label>
          <select
            value={year ?? ''}
            onChange={(e) => handleYearChange(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-salon-500 focus:ring-2 focus:ring-salon-500/20 transition-all cursor-pointer"
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
            className="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Quitar fecha
          </button>
        </div>
      )}
    </div>
  );
}
