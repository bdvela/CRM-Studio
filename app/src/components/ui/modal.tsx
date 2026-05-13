'use client';

import { useEffect, useEffectEvent } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const onCloseEvent = useEffectEvent(onClose);
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseEvent();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div
        className="relative w-full sm:max-w-lg md:max-w-xl bg-white/50 backdrop-blur-2xl border border-t-white/60 border-b-white/20 border-l-white/30 border-r-white/30 rounded-t-3xl sm:rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.08)] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        <div className="sticky top-0 bg-white/50 backdrop-blur-2xl border-b border-white/20 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
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
