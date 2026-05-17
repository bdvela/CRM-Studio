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
  const contentRef  = useRef<HTMLDivElement>(null);
  const dragZoneRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseEvent = useEffectEvent(onClose);
  const [modalState, setModalState] = useState<'closed' | 'open' | 'exiting'>(open ? 'open' : 'closed');
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didDrag = useRef(false);

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
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseEvent(); };
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const els = dialogRef.current.querySelectorAll<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      );
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener('keydown', onEsc);
    document.addEventListener('keydown', onTab);
    requestAnimationFrame(() =>
      dialogRef.current?.querySelector<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      )?.focus()
    );
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('keydown', onTab);
      previousFocusRef.current?.focus();
    };
  }, [modalState]);

  // ─── Shared dismiss logic ────────────────────────────────────────────────────
  function applyDismiss(dy: number, dialog: HTMLDivElement) {
    const spring     = 'transform 300ms cubic-bezier(0.32,0.72,0,1)';
    const threshold  = dialog.getBoundingClientRect().height * 0.35;
    if (dy > threshold) {
      dialog.style.transition = spring;
      dialog.style.transform  = 'translateY(100%)';
      setTimeout(() => onCloseEvent(), 260);
    } else {
      dialog.style.transition = spring;
      dialog.style.transform  = '';
      setTimeout(() => { dialog.style.transition = ''; }, 300);
      if (backdropRef.current) backdropRef.current.style.opacity = '';
    }
  }

  // ─── Drag zone (handle + header) — pointer events, reliable ─────────────────
  useEffect(() => {
    if (modalState !== 'open') return;
    const zone   = dragZoneRef.current;
    const dialog = dialogRef.current as HTMLDivElement;
    if (!zone || !dialog) return;

    let startY = 0;
    let dy     = 0;
    let active = false;

    function onDown(e: PointerEvent) {
      if (e.pointerType === 'mouse') return;
      active = true;
      startY = e.clientY;
      dy     = 0;
      didDrag.current = false;
      dialog.style.animation  = 'none';
      dialog.style.transition = 'none';
      zone!.setPointerCapture(e.pointerId);
    }
    function onMove(e: PointerEvent) {
      if (!active) return;
      dy = Math.max(0, e.clientY - startY);
      if (dy > 5) didDrag.current = true;
      dialog.style.transform = `translateY(${dy}px)`;
      if (backdropRef.current)
        backdropRef.current.style.opacity = String(Math.max(0, 1 - dy / 300));
    }
    function onUp() {
      if (!active) return;
      active = false;
      applyDismiss(dy, dialog);
    }

    zone.addEventListener('pointerdown',   onDown);
    zone.addEventListener('pointermove',   onMove);
    zone.addEventListener('pointerup',     onUp);
    zone.addEventListener('pointercancel', onUp);
    return () => {
      zone.removeEventListener('pointerdown',   onDown);
      zone.removeEventListener('pointermove',   onMove);
      zone.removeEventListener('pointerup',     onUp);
      zone.removeEventListener('pointercancel', onUp);
    };
  }, [modalState]);

  // ─── Content area — native touch, activates only when scrolled to top ────────
  useEffect(() => {
    if (modalState !== 'open') return;
    const content = contentRef.current;
    const dialog  = dialogRef.current as HTMLDivElement;
    if (!content || !dialog) return;

    let startY        = 0;
    let startScrollTop = 0;
    let dismissing    = false;
    let dy            = 0;

    // Dynamically toggle touch-action so preventDefault works when at top
    function syncTouchAction() {
      if (!content) return;
      content.style.touchAction = content.scrollTop <= 0 ? 'none' : 'pan-y';
    }
    syncTouchAction();
    content.addEventListener('scroll', syncTouchAction, { passive: true });

    function onStart(e: TouchEvent) {
      startY         = e.touches[0].clientY;
      startScrollTop = content?.scrollTop ?? 0;
      dismissing     = false;
      dy             = 0;
    }
    function onMove(e: TouchEvent) {
      const deltaY = e.touches[0].clientY - startY;
      // Only dismiss: started at top AND moving down
      if (startScrollTop <= 0 && deltaY > 0) {
        dismissing = true;
        dy = deltaY;
        e.preventDefault();
        dialog.style.animation  = 'none';
        dialog.style.transition = 'none';
        dialog.style.transform  = `translateY(${dy}px)`;
        if (backdropRef.current)
          backdropRef.current.style.opacity = String(Math.max(0, 1 - dy / 300));
        didDrag.current = dy > 5;
      }
    }
    function onEnd() {
      if (!dismissing) return;
      dismissing = false;
      applyDismiss(dy, dialog);
    }

    content.addEventListener('touchstart', onStart,  { passive: true });
    content.addEventListener('touchmove',  onMove,   { passive: false });
    content.addEventListener('touchend',   onEnd,    { passive: true });
    content.addEventListener('touchcancel', onEnd,   { passive: true });

    return () => {
      content.removeEventListener('scroll',      syncTouchAction);
      content.removeEventListener('touchstart',  onStart);
      content.removeEventListener('touchmove',   onMove);
      content.removeEventListener('touchend',    onEnd);
      content.removeEventListener('touchcancel', onEnd);
    };
  }, [modalState]);

  function onBackdropClick() {
    if (didDrag.current) { didDrag.current = false; return; }
    onClose();
  }

  if (modalState === 'closed') return null;

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
          'relative w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col',
          modalState === 'exiting'
            ? 'animate-[zoomOut95_150ms_cubic-bezier(0.23,1,0.32,1)_forwards]'
            : 'animate-in zoom-in-95'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        {/* Drag zone: handle bar + header — touch-none so pointer events work */}
        <div ref={dragZoneRef} className="flex-shrink-0 select-none touch-none" aria-hidden="true">
          <div className="sm:hidden flex justify-center pt-2 pb-0">
            <div className="w-9 h-1 rounded-full bg-zinc-300" />
          </div>
          <div className="bg-white border-b border-zinc-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
            {title
              ? <span className="text-base sm:text-lg font-semibold text-zinc-900 truncate">{title}</span>
              : <div />}
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

        {/* Content — touch-action toggled by JS based on scrollTop */}
        <div ref={contentRef} className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
