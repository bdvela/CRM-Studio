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
  const dialogRef   = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseEvent = useEffectEvent(onClose);
  const [modalState, setModalState] = useState<'closed' | 'open' | 'exiting'>(open ? 'open' : 'closed');
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* drag state — refs, no re-renders */
  const dragging    = useRef(false);
  const startY      = useRef(0);
  const currentDY   = useRef(0);
  const didDrag     = useRef(false); // block backdrop click after drag

  useEffect(() => {
    startTransition(() => {
      if (open) setModalState('open');
      else setModalState(prev => prev === 'open' ? 'exiting' : prev);
    });
  }, [open]);

  useEffect(() => {
    if (modalState !== 'exiting') return;
    exitTimerRef.current = setTimeout(() => setModalState('closed'), 150);
    return () => { if (exitTimerRef.current) clearTimeout(exitTimerRef.current); };
  }, [modalState]);

  useEffect(() => {
    if (modalState !== 'open') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [modalState]);

  useEffect(() => {
    if (modalState !== 'open') return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseEvent(); };
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      )?.focus();
    });
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      previousFocusRef.current?.focus();
    };
  }, [modalState]);

  /* ─── drag handlers ─────────────────────────────────────────────────────── */

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse') return;
    dragging.current  = true;
    didDrag.current   = false;
    startY.current    = e.clientY;
    currentDY.current = 0;
    if (dialogRef.current) {
      // Stop CSS animation — animations override inline style.transform,
      // so dialog.style.transform would have no visual effect without this.
      dialogRef.current.style.animation = 'none';
      dialogRef.current.style.transition = 'none';
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dy = Math.max(0, e.clientY - startY.current);
    currentDY.current = dy;
    if (dy > 5) didDrag.current = true;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.style.transform = `translateY(${dy}px)`;
    if (backdropRef.current) {
      backdropRef.current.style.opacity = String(Math.max(0, 1 - dy / 300));
    }
  }

  function onUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    const dy   = currentDY.current;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const spring = 'transform 300ms cubic-bezier(0.32,0.72,0,1)';
    const threshold = dialog.getBoundingClientRect().height * 0.35;

    if (dy > threshold) {
      dialog.style.transition = spring;
      dialog.style.transform = 'translateY(100%)';
      setTimeout(() => onCloseEvent(), 260);
    } else {
      dialog.style.transition = spring;
      dialog.style.transform = '';
      setTimeout(() => { dialog.style.transition = ''; }, 300);
      if (backdropRef.current) backdropRef.current.style.opacity = '';
    }
  }

  function onBackdropClick() {
    // Ignore if the user just finished a drag — pointer landed on backdrop
    if (didDrag.current) { didDrag.current = false; return; }
    onClose();
  }

  if (modalState === 'closed') return null;

  const dragHandlers = { onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        ref={backdropRef}
        className={cn(
          'fixed inset-0',
          modalState === 'exiting' ? 'animate-[fadeOut_150ms_ease-out_forwards]' : 'animate-fadeIn'
        )}
        onClick={onBackdropClick}
        role="presentation"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />
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
        {/* Drag zone — always in DOM, touch-none stops browser scroll on this area */}
        <div {...dragHandlers} className="flex-shrink-0 select-none touch-none cursor-grab" aria-hidden="true">
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-zinc-300" />
          </div>
          <div className="bg-white border-b border-zinc-100 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
            {title ? (
              <span className="text-lg font-semibold text-zinc-900 truncate">{title}</span>
            ) : <div />}
            {/* X — desktop only, swipe handles mobile dismiss */}
            <button
              onPointerDownCapture={e => e.stopPropagation()}
              onClick={onClose}
              className="hidden sm:flex p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors flex-shrink-0"
              aria-label="Cerrar"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
