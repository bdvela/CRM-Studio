'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, X, Check, Pencil, XCircle, AlertTriangle } from 'lucide-react';
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
  closeOnOverlay?: boolean;
}

export function AppointmentTicket({
  appt, onClose, onEdit, onCancel, onAdvanceStatus, onMarkAsNoShow, closeOnOverlay = true,
}: AppointmentTicketProps) {
  const headerColor = statusHeaderColors[appt.status] || 'bg-salon-500';
  const dateStr = format(new Date(appt.start_time), "EEEE d 'de' MMMM", { locale: es });
  const uniqueArtists = [...new Set(appt.appointment_services?.flatMap((as) => as.artist?.name ? [as.artist.name] : []))];
  const [timeStatus, setTimeStatus] = useState<React.ReactNode>(null);
  const timeRange = useMemo(
    () => `${formatTime(appt.start_time)} - ${formatTime(appt.end_time || appt.start_time)}`,
    [appt.start_time, appt.end_time]
  );

  useEffect(() => {
    if (appt.status !== 'programada') return;
    const updateTimeStatus = () => {
      const diffMs = new Date(appt.start_time).getTime() - Date.now();
      if (diffMs < 0) setTimeStatus(<span className="text-xs text-red-500 mt-0.5">Atrasada</span>);
      else {
        const diffH = Math.round(diffMs / 3600000);
        if (diffH < 1) setTimeStatus(<span className="text-xs text-amber-500 mt-0.5">En menos de 1 hora</span>);
        else if (diffH < 24) setTimeStatus(<span className="text-xs text-amber-500 mt-0.5">En {diffH}h</span>);
        else {
          const diffD = Math.round(diffH / 24);
          setTimeStatus(diffD === 1
            ? <span className="text-xs text-zinc-400 mt-0.5">Mañana</span>
            : <span className="text-xs text-zinc-400 mt-0.5">En {diffD} días</span>);
        }
      }
    };
    updateTimeStatus();
    const interval = setInterval(updateTimeStatus, 60000);
    return () => clearInterval(interval);
  }, [appt.start_time, appt.status]);

  const hasCommissions = appt.appointment_services?.some((as) => as.commission_detail);
  let regularArtistCommission = 0;
  let founderDirect = 0;
  let founderCut = 0;
  for (const as of appt.appointment_services || []) {
    const cd = as.commission_detail;
    if (!cd) continue;
    if (cd.artist_role_name === 'Dueña' || cd.artist_role_name === 'Founder') {
      founderDirect += Number(cd.artist_commission || 0);
    } else {
      regularArtistCommission += Number(cd.artist_commission || 0);
    }
    founderCut += Number(cd.founder_share || 0);
  }
  const totalFounder = founderDirect + founderCut;
  const showCommissions = hasCommissions && (regularArtistCommission > 0 || totalFounder > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      aria-label={`Detalle de cita: ${appt.client?.name || 'Sin clienta'}`}
      onClick={closeOnOverlay ? onClose : undefined}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className={cn('px-5 py-3 flex items-center justify-between', headerColor)}>
          <span className="text-xs font-bold text-white tracking-widest uppercase">
            {APPOINTMENT_STATUS_LABELS[appt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="size-4 text-white" />
          </button>
        </div>

        {appt.status !== 'cancelada' && appt.status !== 'no_show' && (
          <div className="flex items-center gap-1 px-5 py-2 bg-zinc-50 border-b border-zinc-100">
            {(['programada', 'en_curso', 'completada'] as const).map((s, i) => {
              const statusKey = appt.status as string;
              const steps = ['programada', 'en_curso', 'completada'];
              const currentIdx = steps.indexOf(statusKey);
              return (
                <Fragment key={s}>
                  <div className={cn(
                    'flex items-center gap-1.5 text-xs font-medium',
                    i < currentIdx ? 'text-emerald-600' : i === currentIdx ? 'text-salon-600' : 'text-zinc-300'
                  )}>
                    <div className={cn(
                      'size-5 rounded-full flex items-center justify-center',
                      i < currentIdx ? 'bg-emerald-100' : i === currentIdx ? 'bg-salon-100' : 'bg-zinc-100'
                    )}>
                      {i < currentIdx ? <Check className="size-3" /> : <span className="text-[10px]">{i + 1}</span>}
                    </div>
                    <span className="hidden sm:inline">{APPOINTMENT_STATUS_LABELS[s]}</span>
                  </div>
                  {i < 2 && (
                    <div className={cn('flex-1 h-px', i < currentIdx ? 'bg-emerald-300' : 'bg-zinc-200')} />
                  )}
                </Fragment>
              );
            })}
          </div>
        )}

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
                {timeStatus}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-200" />

          {appt.appointment_services && appt.appointment_services.length > 0 && (
            <div className="space-y-2.5">
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

          {showCommissions && (
            <>
              <div className="border-t border-zinc-100" />
              <div className="flex items-center justify-between text-xs text-zinc-400">
                {regularArtistCommission > 0 && (
                  <span>Artistas: <span className="text-emerald-600 font-semibold">{formatCurrency(regularArtistCommission)}</span></span>
                )}
                <span className={regularArtistCommission > 0 ? '' : 'ml-auto'}>Founder: <span className="text-salon-600 font-semibold">{formatCurrency(totalFounder)}</span></span>
              </div>
            </>
          )}

          {appt.notes && (
            <p className="text-xs text-zinc-500 italic border-l-2 border-zinc-200 pl-3">{appt.notes}</p>
          )}

          {appt.status === 'programada' && appt.appointment_balance && (() => {
            const advancePaid = (appt.appointment_balance.total_paid || 0) >= DEPOSIT_AMOUNT;
            if (!advancePaid) return null;
            return (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-2.5 py-1.5">
                <Check className="size-3.5" />
                Adelanto de S/{DEPOSIT_AMOUNT} pagado
              </div>
            );
          })()}
        </div>

        <div className="px-5 pb-5 space-y-2 border-t border-zinc-100 pt-4">
          {appt.status === 'programada' && onAdvanceStatus && (
            <button
              onClick={() => { onClose(); onAdvanceStatus(appt); }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors"
            >
              <Clock className="size-4" /> Iniciar cita
            </button>
          )}
          {appt.status === 'en_curso' && onAdvanceStatus && (
            <button
              onClick={() => { onClose(); onAdvanceStatus(appt); }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
            >
              <Check className="size-4" /> Completar cita
            </button>
          )}
          {appt.status === 'programada' && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { onClose(); onEdit(appt); }}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium text-salon-700 bg-salon-50 hover:bg-salon-100 transition-colors"
              >
                <Pencil className="size-5" /> Editar
              </button>
              {onCancel && (
                <button
                  onClick={() => { onClose(); onCancel(appt); }}
                  className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <XCircle className="size-5" /> Cancelar
                </button>
              )}
              {onMarkAsNoShow && (
                <button
                  onClick={() => { onClose(); onMarkAsNoShow(appt); }}
                  className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium text-zinc-600 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                >
                  <AlertTriangle className="size-5" /> No Show
                </button>
              )}
            </div>
          )}
          {appt.status !== 'programada' && (
            <button
              onClick={() => { onClose(); onEdit(appt); }}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                appt.status === 'en_curso'
                  ? 'text-salon-700 bg-salon-50 hover:bg-salon-100'
                  : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200'
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
