'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/src/style.css';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, X } from 'lucide-react';

interface CalendarRangeInputProps {
  value: { from: string; to: string };
  onChange: (range: { from: string; to: string }) => void;
  label?: string;
}

export function CalendarRangeInput({ value, onChange, label }: CalendarRangeInputProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const fromDate = value.from ? new Date(value.from + 'T00:00:00') : undefined;
  const toDate = value.to ? new Date(value.to + 'T00:00:00') : undefined;
  const selected: DateRange = { from: fromDate, to: toDate };

  const displayText = fromDate && toDate
    ? `${format(fromDate, "d MMM", { locale: es })} – ${format(toDate, "d MMM, yyyy", { locale: es })}`
    : 'Seleccionar rango';

  const calcPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    if (viewW < 640) {
      setPopoverStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 60,
      });
      return;
    }

    const popoverW = 320;
    let left = rect.left;
    if (left + popoverW > viewW - 16) left = viewW - popoverW - 16;
    if (left < 16) left = 16;

    let top = rect.bottom + 8;
    const estimatedH = 390;
    if (top + estimatedH > viewH - 16) top = rect.top - estimatedH - 8;

    setPopoverStyle({
      position: 'fixed',
      top,
      left,
      zIndex: 60,
    });
  };

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onChange({
        from: format(range.from, 'yyyy-MM-dd'),
        to: format(range.to, 'yyyy-MM-dd'),
      });
      setOpen(false);
    } else if (range?.from) {
      onChange({
        from: format(range.from, 'yyyy-MM-dd'),
        to: value.to,
      });
    }
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) return;
      setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      calcPosition();
      window.addEventListener('resize', calcPosition);
      window.addEventListener('scroll', calcPosition, true);
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', calcPosition);
      window.removeEventListener('scroll', calcPosition, true);
    };
  }, [open]);

  const hasRange = fromDate && toDate;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-zinc-700">{label}</label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 sm:py-3 text-base text-left focus:outline-none focus:ring-2 focus:ring-salon-500"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="size-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
          <span className={hasRange ? 'text-zinc-900 truncate' : 'text-zinc-400 truncate'}>{displayText}</span>
        </div>
        {hasRange && (
          <X
            className="size-4 text-zinc-400 hover:text-red-500 flex-shrink-0 transition-colors"
            aria-hidden="true"
            onClick={(e) => { e.stopPropagation(); onChange({ from: '', to: '' }); }}
          />
        )}
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="rounded-2xl border border-zinc-200 bg-white shadow-xl p-2 sm:p-3"
          >
            <DayPicker
              mode="range"
              selected={selected}
              onSelect={handleSelect}
              locale={es}
              style={{
                '--rdp-accent-color': '#db2777',
                '--rdp-accent-background-color': '#fce7f3',
              } as React.CSSProperties}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
