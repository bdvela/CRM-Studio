'use client';

import { useEffect, useRef, useEffectEvent, useState, startTransition } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseEvent = useEffectEvent(onClose);
  const [modalState, setModalState] = useState<'closed' | 'open' | 'exiting'>(open ? 'open' : 'closed');
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef(0);

  useEffect(() => {
    startTransition(() => {
      if (open) {
        setModalState('open');
      } else {
        setModalState(prev => prev === 'open' ? 'exiting' : prev);
      }
    });
  }, [open]);

  useEffect(() => {
    if (modalState !== 'exiting') return;
    exitTimerRef.current = setTimeout(() => setModalState('closed'), 150);
    return () => { if (exitTimerRef.current) clearTimeout(exitTimerRef.current); };
  }, [modalState]);

  useEffect(() => {
    if (modalState !== 'open') return;
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
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      previousFocusRef.current?.focus();
    };
  }, [modalState]);

  // ─── Swipe-to-dismiss — imperative non-passive listeners ─────────────────────
  // Must be non-passive to call preventDefault() and stop scroll container
  // from stealing the touch event.
  useEffect(() => {
    if (modalState !== 'open') return;
    const handle = handleRef.current;
    if (!handle) return;

    function start(e: TouchEvent) {
      dragStartY.current = e.touches[0].clientY;
      dragCurrentY.current = 0;
      if (dialogRef.current) dialogRef.current.style.transition = 'none';
    }

    function move(e: TouchEvent) {
      if (dragStartY.current === null) return;
      e.preventDefault();
      const dy = Math.max(0, e.touches[0].clientY - dragStartY.current);
      dragCurrentY.current = dy;
      if (dialogRef.current) {
        dialogRef.current.style.transform = `translateY(${dy}px)`;
      }
      if (backdropRef.current) {
        backdropRef.current.style.opacity = String(Math.max(0, 1 - dy / 250));
      }
    }

    function end() {
      if (dragStartY.current === null) return;
      const dy = dragCurrentY.current;
      dragStartY.current = null;
      dragCurrentY.current = 0;
      const spring = 'transform 280ms cubic-bezier(0.23,1,0.32,1)';

      if (dy > 120) {
        if (dialogRef.current) {
          dialogRef.current.style.transition = spring;
          dialogRef.current.style.transform = 'translateY(100%)';
        }
        setTimeout(() => onCloseEvent(), 220);
      } else {
        if (dialogRef.current) {
          dialogRef.current.style.transition = spring;
          dialogRef.current.style.transform = '';
          setTimeout(() => { if (dialogRef.current) dialogRef.current.style.transition = ''; }, 280);
        }
        if (backdropRef.current) backdropRef.current.style.opacity = '';
      }
    }

    handle.addEventListener('touchstart', start, { passive: true });
    handle.addEventListener('touchmove', move, { passive: false });
    handle.addEventListener('touchend', end, { passive: true });

    return () => {
      handle.removeEventListener('touchstart', start);
      handle.removeEventListener('touchmove', move);
      handle.removeEventListener('touchend', end);
    };
  }, [modalState]);

  if (modalState === 'closed') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        ref={backdropRef}
        className={cn(
          'fixed inset-0',
          modalState === 'exiting' ? 'animate-[fadeOut_150ms_ease-out_forwards]' : 'animate-fadeIn'
        )}
        onClick={onClose}
        role="presentation"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />
      {/* flex-col so handle+header are outside the scroll area */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[80vh] sm:max-h-[85vh] flex flex-col',
          modalState === 'exiting'
            ? 'animate-[zoomOut95_150ms_cubic-bezier(0.23,1,0.32,1)_forwards]'
            : 'animate-in zoom-in-95'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        {/* Drag handle — outside overflow-y-auto so touch events aren't intercepted */}
        <div
          ref={handleRef}
          className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
          aria-hidden="true"
        >
          <div className="w-10 h-1 rounded-full bg-zinc-300" />
        </div>

        {/* Header — outside scroll area */}
        <div className="flex-shrink-0 bg-white border-b border-zinc-100 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
          {title ? (
            <h2 className="text-lg font-semibold text-zinc-900 truncate pr-4">{title}</h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
