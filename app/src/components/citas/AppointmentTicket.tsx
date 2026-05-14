'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, X, Check, Pencil, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { cn, formatCurrency, formatTime } from '@/lib/utils';
import { DEPOSIT_AMOUNT } from '@/lib/constants';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import type { AppointmentWithDetails, AppointmentServiceWithDetails, AppointmentBalance } from './types';

const statusHeaderColors: Record<string, string> = {
  cancelada: 'bg-red-500',
  completada: 'bg-emerald-500',
  en_curso: 'bg-amber-500',
  no_show: 'bg-zinc-500',
};

interface AppointmentTicketProps {
  appt: AppointmentWithDetails;
  onClose: () => void;
  onEdit: (appt: AppointmentWithDetails) => void;
  onCancel?: (appt: AppointmentWithDetails) => void;
  onAdvanceStatus?: (appt: AppointmentWithDetails) => void;
  onMarkAsNoShow?: (appt: AppointmentWithDetails) => void;
  onViewDetail?: (appt: AppointmentWithDetails) => void;
  closeOnOverlay?: boolean;
}

export function AppointmentTicket({
  appt, onClose, onEdit, onCancel, onAdvanceStatus, onMarkAsNoShow, onViewDetail, closeOnOverlay = true,
}: AppointmentTicketProps) {
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [exiting, setExiting] = useState(false);
  const headerColor = statusHeaderColors[appt.status] || 'bg-salon-500';
  const dateStr = format(new Date(appt.start_time), "EEEE d 'de' MMMM", { locale: es });
  const uniqueArtists = [...new Set(appt.appointment_services?.flatMap((as) => as.artist?.name ? [as.artist.name] : []))];
  const timeRange = useMemo(
    () => `${formatTime(appt.start_time)} - ${formatTime(appt.end_time || appt.start_time)}`,
    [appt.start_time, appt.end_time]
  );

  const handleClose = useCallback((afterClose?: () => void) => {
    setExiting(true);
    setTimeout(() => {
      onClose();
      afterClose?.();
    }, 150);
  }, [onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        exiting
          ? 'animate-[fadeOut_150ms_ease-out_forwards]'
          : 'bg-black/20 backdrop-blur-sm'
      )}
      aria-label={`Detalle de cita: ${appt.client?.name || 'Sin clienta'}`}
      onClick={closeOnOverlay ? () => handleClose() : undefined}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden',
          exiting
            ? 'animate-[zoomOut95_150ms_cubic-bezier(0.23,1,0.32,1)_forwards]'
            : 'animate-in fade-in zoom-in-95 duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className={cn('px-5 py-3 flex items-center justify-between', headerColor)}>
          <span className="text-xs font-bold text-white tracking-widest uppercase">
            {APPOINTMENT_STATUS_LABELS[appt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
          </span>
          <button onClick={() => handleClose()} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="size-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">{appt.client?.name || 'Sin clienta'}</h3>
              {uniqueArtists.length > 0 && (
                <p className="text-sm text-zinc-500 mt-0.5">con {uniqueArtists.join(', ')}</p>
              )}
            </div>
            <p className="text-xl font-bold text-zinc-900 shrink-0 tabular-nums">
              {formatCurrency(appt.total_price)}
            </p>
          </div>

          <div className="border-t border-dashed border-zinc-200" />

          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <CalendarIcon className="size-4 text-zinc-400 flex-shrink-0" />
              <span className="text-zinc-700 capitalize">{dateStr}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="size-4 text-zinc-400 flex-shrink-0" />
              <span className="text-zinc-700">
                {timeRange}
                <span className="text-zinc-400 ml-2">({appt.total_duration_min} min)</span>
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-200" />

          {appt.appointment_services && appt.appointment_services.length > 0 && (
            <div className="max-h-[160px] overflow-y-auto space-y-2.5">
              {appt.appointment_services.map((as) => (
                <div key={as.service_id || as.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base shrink-0">{as.service?.category?.icon || '📋'}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{as.service?.name}</p>
                      {as.artist?.name && <p className="text-xs text-zinc-400">{as.artist.name}</p>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 tabular-nums">
                    {formatCurrency(Number(as.service_price ?? as.service?.price) || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {appt.notes && (
            <p className="text-xs text-zinc-500 italic border-l-2 border-zinc-200 pl-3">{appt.notes}</p>
          )}

          {appt.appointment_balance && (() => {
            const total = Number(appt.total_price || 0);
            const paid = Number(appt.appointment_balance.total_paid || 0);
            const pending = Number(appt.appointment_balance.pending_balance || 0);
            return (
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-zinc-50 p-3">
                <div className="text-center">
                  <p className="text-[10px] text-zinc-400">Total</p>
                  <p className="text-sm font-semibold text-zinc-900 tabular-nums">{formatCurrency(total)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-400">Pagado</p>
                  <p className="text-sm font-semibold text-emerald-600 tabular-nums">{formatCurrency(paid)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-400">Por cobrar</p>
                  <p className={`text-sm font-semibold tabular-nums ${pending > 0 ? 'text-amber-600' : 'text-zinc-400'}`}>
                    {formatCurrency(pending)}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="px-5 pb-5 space-y-3 border-t border-zinc-100 pt-4">
          {appt.status === 'programada' && onAdvanceStatus && (
            <button
              onClick={() => onAdvanceStatus(appt)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Clock className="size-4" aria-hidden="true" />
              Iniciar cita
            </button>
          )}
          {appt.status === 'en_curso' && onAdvanceStatus && (
            <button
              onClick={() => onAdvanceStatus(appt)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <Check className="size-4" aria-hidden="true" />
              Completar cita
            </button>
          )}
          {appt.status === 'programada' && (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleClose(() => onEdit(appt))}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-salon-700 border border-salon-200 hover:bg-salon-50 transition-colors"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Editar
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium text-zinc-500 border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  Más <ChevronDown className={`size-3 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
                </button>
                {showMoreMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMoreMenu(false)}
                    />
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-zinc-200 rounded-lg shadow-lg p-1 z-20">
                      {onCancel && (
                        <button
                          onClick={() => { setShowMoreMenu(false); onCancel(appt); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <XCircle className="size-3.5" aria-hidden="true" />
                          Cancelar cita
                        </button>
                      )}
                      {onMarkAsNoShow && (
                        <button
                          onClick={() => { setShowMoreMenu(false); onMarkAsNoShow(appt); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-zinc-500 hover:bg-zinc-50 transition-colors text-left"
                        >
                          <AlertTriangle className="size-3.5" aria-hidden="true" />
                          No Show
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {onViewDetail && (
            <button
              onClick={() => handleClose(() => onViewDetail(appt))}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-600 border border-dashed border-zinc-200 hover:border-zinc-300 transition-colors"
            >
              <CalendarIcon className="size-3.5" aria-hidden="true" />
              Ver detalle completo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
