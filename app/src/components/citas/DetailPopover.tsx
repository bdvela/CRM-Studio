'use client';

import { useEffect, useState, useRef, useEffectEvent } from 'react';
import type { DetailPopoverProps } from './types';
import { formatDetailDate } from './helpers';
import { formatCurrency, formatTime, cn } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { Calendar as CalendarIcon, Clock, X, XCircle, AlertTriangle, Pencil, Check } from 'lucide-react';

export function DetailPopover({
  show, selectedAppt, statusColors,
  onClose, onEdit, onCancel, onAdvanceStatus, onMarkAsNoShow,
}: DetailPopoverProps) {
  const detailFormattedDate = selectedAppt ? formatDetailDate(selectedAppt.start_time) : '';
  const detailRef = useRef<HTMLDivElement>(null);
  const onCloseEvent = useEffectEvent(onClose);
  const [detailTimeRange, setDetailTimeRange] = useState('');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (detailRef.current && !detailRef.current.contains(e.target as Node)) {
        onCloseEvent();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseEvent();
    }
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [show]);

  useEffect(() => {
    if (selectedAppt) {
      setDetailTimeRange(`${formatTime(selectedAppt.start_time)} - ${formatTime(selectedAppt.end_time || selectedAppt.start_time)}`);
    }
  }, [selectedAppt?.start_time, selectedAppt?.end_time]);

  if (!show || !selectedAppt) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
    >
      <div
        ref={detailRef}
        role="dialog"
        aria-label="Detalle de cita"
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className={cn(
          'px-5 py-3 flex items-center justify-between',
          selectedAppt.status === 'cancelada' ? 'bg-red-500'
          : selectedAppt.status === 'completada' ? 'bg-emerald-500'
          : selectedAppt.status === 'en_curso' ? 'bg-amber-500'
          : selectedAppt.status === 'no_show' ? 'bg-zinc-500'
          : 'bg-salon-500'
        )}>
          <span className="text-xs font-bold text-white tracking-widest uppercase">
            {APPOINTMENT_STATUS_LABELS[selectedAppt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="size-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">
                {selectedAppt.client?.name || 'Sin clienta'}
              </h3>
              {(() => {
                const names = [...new Set(selectedAppt.appointment_services?.map((as: any) => as.artist?.name).filter(Boolean))] as string[];
                if (names.length === 0) return null;
                return <p className="text-sm text-zinc-500 mt-0.5">con {names.join(', ')}</p>;
              })()}
            </div>
            <p className="text-xl font-bold text-zinc-900 shrink-0 tabular-nums">
              {formatCurrency(selectedAppt.total_price)}
            </p>
          </div>

          <div className="border-t border-dashed border-zinc-200" />

          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <CalendarIcon className="size-4 text-zinc-400 flex-shrink-0" />
              <span className="text-zinc-700 capitalize">
                {detailFormattedDate}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="size-4 text-zinc-400 flex-shrink-0" />
              <span className="text-zinc-700">
                {detailTimeRange}
                <span className="text-zinc-400 ml-2">({selectedAppt.total_duration_min} min)</span>
              </span>
              {selectedAppt.status === 'programada' && (() => {
                const diffMs = new Date(selectedAppt.start_time).getTime() - Date.now();
                if (diffMs < 0) return <span className="text-xs text-red-500 mt-0.5">Atrasada</span>;
                const diffH = Math.round(diffMs / 3600000);
                if (diffH < 1) return <span className="text-xs text-amber-500 mt-0.5">En menos de 1 hora</span>;
                if (diffH < 24) return <span className="text-xs text-amber-500 mt-0.5">En {diffH}h</span>;
                const diffD = Math.round(diffH / 24);
                if (diffD === 1) return <span className="text-xs text-zinc-400 mt-0.5">Mañana</span>;
                return <span className="text-xs text-zinc-400 mt-0.5">En {diffD} días</span>;
              })()}
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-200" />

          {selectedAppt.appointment_services?.length > 0 && (
            <div className="space-y-2.5">
              {selectedAppt.appointment_services.map((as: any) => (
                <div key={as.service_id || as.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base shrink-0">{as.service?.category?.icon || '📋'}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{as.service?.name}</p>
                      {as.artist?.name && (
                        <p className="text-xs text-zinc-400">{as.artist.name}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 tabular-nums">
                    {formatCurrency(Number(as.service_price ?? as.service?.price) || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {selectedAppt.appointment_services?.some((as: any) => as.commission_detail) && (() => {
            let regularArtistCommission = 0;
            let founderDirect = 0;
            let founderCut = 0;
            for (const as of selectedAppt.appointment_services || []) {
              const cd = as.commission_detail;
              if (!cd) continue;
              const role = cd.artist_role_name;
              if (role === 'Dueña' || role === 'Founder') {
                founderDirect += Number(cd.artist_commission || 0);
              } else {
                regularArtistCommission += Number(cd.artist_commission || 0);
              }
              founderCut += Number(cd.founder_share || 0);
            }
            const totalFounder = founderDirect + founderCut;
            if (regularArtistCommission === 0 && totalFounder === 0) return null;
            return (
              <>
                <div className="border-t border-zinc-100" />
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  {regularArtistCommission > 0 && (
                    <span>Artistas: <span className="text-emerald-600 font-semibold">{formatCurrency(regularArtistCommission)}</span></span>
                  )}
                  <span className={regularArtistCommission > 0 ? '' : 'ml-auto'}>Founder: <span className="text-salon-600 font-semibold">{formatCurrency(totalFounder)}</span></span>
                </div>
              </>
            );
          })()}

          {selectedAppt.notes && (
            <p className="text-xs text-zinc-500 italic border-l-2 border-zinc-200 pl-3">
              {selectedAppt.notes}
            </p>
          )}

          {selectedAppt.status === 'programada' && selectedAppt.appointment_balance && (() => {
            const advancePaid = (selectedAppt.appointment_balance.total_paid || 0) >= 20;
            if (!advancePaid) return null;
            return (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-2.5 py-1.5">
                <Check className="size-3.5" />
                Adelanto de S/20 pagado
              </div>
            );
          })()}
        </div>

        <div className="px-5 pb-5 space-y-2 border-t border-zinc-100 pt-4">
          {selectedAppt.status === 'programada' && (
            <button
              onClick={() => onAdvanceStatus(selectedAppt)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors"
            >
              <Clock className="size-4" /> Iniciar cita
            </button>
          )}
          {selectedAppt.status === 'en_curso' && (
            <button
              onClick={() => onAdvanceStatus(selectedAppt)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
            >
              <Check className="size-4" /> Completar cita
            </button>
          )}
          {selectedAppt.status === 'programada' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onEdit(selectedAppt); onClose(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-salon-600 hover:bg-salon-700 transition-colors"
              >
                <Pencil className="size-4" /> Editar
              </button>
              <button
                onClick={() => { onCancel(selectedAppt); onClose(); }}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center"
                title="Cancelar cita"
              >
                <XCircle className="size-4" />
              </button>
              <button
                onClick={() => onMarkAsNoShow(selectedAppt)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center justify-center"
                title="Marcar como no asistió"
              >
                <AlertTriangle className="size-4" />
              </button>
            </div>
          )}
          {selectedAppt.status !== 'programada' && (
            <button
              onClick={() => { onEdit(selectedAppt); onClose(); }}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                selectedAppt.status === 'en_curso'
                  ? "text-salon-700 bg-salon-50 hover:bg-salon-100"
                  : "text-zinc-600 bg-zinc-100 hover:bg-zinc-200"
              )}
            >
              <Pencil className="size-4" /> Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
