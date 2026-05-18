'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/src/style.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, X } from 'lucide-react';

interface CalendarInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  portalContainer?: HTMLElement;
  scrollContainer?: HTMLElement | null;
}

export function CalendarInput({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar fecha',
  portalContainer,
  scrollContainer,
}: CalendarInputProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const selected = value ? new Date(value + 'T00:00:00') : undefined;

  const displayText = selected
    ? format(selected, "d 'de' MMMM, yyyy", { locale: es })
    : placeholder;

  const calcPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    // On small screens, center it
    if (viewW < 640) {
      setPopoverStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 70,
      });
      return;
    }

    // Desktop: below the trigger, right-aligned if near edge
    const popoverW = 320;
    let left = rect.left;
    if (left + popoverW > viewW - 16) left = viewW - popoverW - 16;
    if (left < 16) left = 16;

    // Use actual rendered height; fall back to estimate only if not yet in DOM
    const popoverH = popoverRef.current?.getBoundingClientRect().height || 390;
    let top = rect.bottom + 8;
    if (top + popoverH > viewH - 16) top = rect.top - popoverH - 8;
    if (top < 8) top = 8;

    setPopoverStyle({
      position: 'fixed',
      top,
      left,
      zIndex: 70,
    });
  };

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    }
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  // Close on outside click
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

  // Initial position + reposition on resize/scroll
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      calcPosition();
      window.addEventListener('resize', calcPosition);
      window.addEventListener('scroll', calcPosition, true);
      scrollContainer?.addEventListener('scroll', calcPosition, { passive: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', calcPosition);
      window.removeEventListener('scroll', calcPosition, true);
      scrollContainer?.removeEventListener('scroll', calcPosition);
    };
  }, [open, scrollContainer]);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-zinc-700">{label}</label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 sm:py-3 text-base text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-salon-500"
      >
        <CalendarDays className="size-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
        <span className={selected ? 'text-zinc-900' : 'text-zinc-400'}>{displayText}</span>
        {selected && (
          <X
            className="size-4 text-zinc-400 hover:text-red-500 flex-shrink-0 ml-auto transition-colors"
            aria-hidden="true"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
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
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              locale={es}
              style={{
                '--rdp-accent-color': '#db2777',
                '--rdp-accent-background-color': '#fce7f3',
              } as React.CSSProperties}
            />
          </div>,
          portalContainer || document.body
        )}
    </div>
  );
}
