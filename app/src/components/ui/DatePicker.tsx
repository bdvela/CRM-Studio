'use client';

import { startTransition, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Select } from './select';

const MONTHS = [
  { value: '0', label: 'Enero', days: 31 },
  { value: '1', label: 'Febrero', days: 28 },
  { value: '2', label: 'Marzo', days: 31 },
  { value: '3', label: 'Abril', days: 30 },
  { value: '4', label: 'Mayo', days: 31 },
  { value: '5', label: 'Junio', days: 30 },
  { value: '6', label: 'Julio', days: 31 },
  { value: '7', label: 'Agosto', days: 31 },
  { value: '8', label: 'Septiembre', days: 30 },
  { value: '9', label: 'Octubre', days: 31 },
  { value: '10', label: 'Noviembre', days: 30 },
  { value: '11', label: 'Diciembre', days: 31 },
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

type DateParts = { day: string | null; month: string | null; year: string | null };

function dateFromValue(value: string | null): DateParts {
  if (!value) return { day: null, month: null, year: null };
  const d = new Date(value + 'T00:00:00');
  return { day: String(d.getDate()), month: String(d.getMonth()), year: String(d.getFullYear()) };
}

function toIsoDate(day: number, month: number, year: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [dp, setDp] = useState<DateParts>(() => dateFromValue(value));

  useEffect(() => {
    startTransition(() => {
      setDp(dateFromValue(value));
    });
  }, [value]);

  const currentYear = new Date().getFullYear();
  const minYear = 1940;
  
  const years = Array.from(
    { length: currentYear - minYear + 1 },
    (_, i) => String(currentYear - i)
  );

  function emitChange(updated: DateParts) {
    if (updated.day !== null && updated.month !== null && updated.year !== null) {
      const dayNum = Number(updated.day);
      const monthNum = Number(updated.month);
      const yearNum = Number(updated.year);
      const maxDays = getDaysInMonth(yearNum, monthNum);
      const actualDay = Math.min(dayNum, maxDays);
      onChange(toIsoDate(actualDay, monthNum, yearNum));
    }
  }

  function handleDayChange(newDay: string) {
    const updated = { ...dp, day: newDay || null };
    setDp(updated);
    emitChange(updated);
  }

  function handleMonthChange(newMonth: string) {
    let updated = { ...dp, month: newMonth || null };
    if (newMonth && dp.year !== null && dp.day !== null) {
      const maxDays = getDaysInMonth(Number(dp.year), Number(newMonth));
      if (Number(dp.day) > maxDays) {
        updated = { ...updated, day: String(maxDays) };
      }
    }
    setDp(updated);
    emitChange(updated);
  }

  function handleYearChange(newYear: string) {
    let updated = { ...dp, year: newYear || null };
    if (newYear && dp.month !== null && dp.day !== null) {
      const maxDays = getDaysInMonth(Number(newYear), Number(dp.month));
      if (Number(dp.day) > maxDays) {
        updated = { ...updated, day: String(maxDays) };
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
    ? getDaysInMonth(Number(dp.year), Number(dp.month)) 
    : 31;

  const daysOptions = Array.from({ length: maxDaysForSelection }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1).padStart(2, '0'),
  }));

  const monthOptions = MONTHS.map(m => ({ value: String(m.value), label: m.label }));

  const yearOptions = years.map(y => ({ value: y, label: y }));

  const hasValue = dp.day !== null && dp.month !== null && dp.year !== null;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-zinc-700">{label}</label>
      )}
      
      <div className="grid grid-cols-3 gap-2">
        <Select
          label="Día"
          options={daysOptions}
          value={dp.day ?? ''}
          onChange={handleDayChange}
          placeholder="--"
        />
        <Select
          label="Mes"
          options={monthOptions}
          value={dp.month ?? ''}
          onChange={handleMonthChange}
          placeholder="--"
        />
        <Select
          label="Año"
          options={yearOptions}
          value={dp.year ?? ''}
          onChange={handleYearChange}
          placeholder="--"
        />
      </div>

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
