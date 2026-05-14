'use client';

import { useEffect, useRef, useEffectEvent, useState } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseEvent = useEffectEvent(onClose);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional exit animation trigger
      setExiting(false);
    } else if (mounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional exit animation trigger
      setExiting(true);
      exitTimerRef.current = setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, 150);
    }
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mounted is intentionally excluded
  }, [open]);

  useEffect(() => {
    if (!mounted || exiting) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseEvent();
    }

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      previousFocusRef.current?.focus();
    };
  }, [mounted, exiting]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className={cn(
          'fixed inset-0',
          exiting ? 'animate-[fadeOut_150ms_ease-out_forwards]' : 'animate-fadeIn'
        )}
        onClick={onClose}
        role="presentation"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto',
          exiting
            ? 'animate-[zoomOut95_150ms_cubic-bezier(0.23,1,0.32,1)_forwards]'
            : 'animate-in zoom-in-95'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
          {title ? (
            <h2 className="text-lg font-semibold text-zinc-900 truncate pr-4">{title}</h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
