'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, X, AlertTriangle, XCircle, Pencil, Check } from 'lucide-react';
import { cn, formatCurrency, formatTime } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';

interface AppointmentDetailProps {
  appt: any;
  onClose: () => void;
  onEdit: (appt: any) => void;
  onCancel?: (appt: any) => void;
  onAdvanceStatus?: (appt: any) => void;
  onMarkAsNoShow?: (appt: any) => void;
}

export function AppointmentDetail({ appt, onClose, onEdit, onCancel, onAdvanceStatus, onMarkAsNoShow }: AppointmentDetailProps) {
  const statusColorMap: Record<string, string> = {
    cancelada: 'bg-red-500',
    completada: 'bg-emerald-500',
    en_curso: 'bg-amber-500',
    no_show: 'bg-zinc-500',
  };
  const headerColor = statusColorMap[appt.status] || 'bg-salon-500';

  const hasCommissions = appt.appointment_services?.some((as: any) => as.commission_detail);
  let regularArtistCommission = 0;
  let founderDirect = 0;
  let founderCut = 0;
  for (const as of appt.appointment_services || []) {
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
  const showCommissions = hasCommissions && (regularArtistCommission > 0 || totalFounder > 0);
  const uniqueArtists = [...new Set(appt.appointment_services?.map((as: any) => as.artist?.name).filter(Boolean))] as string[];
  const dateStr = format(new Date(appt.start_time), "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} role="dialog" aria-modal="true">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn('px-5 py-3 flex items-center justify-between', headerColor)}>
          <span className="text-xs font-bold text-white tracking-widest uppercase">
            {APPOINTMENT_STATUS_LABELS[appt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="size-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">{appt.client?.name || 'Sin clienta'}</h3>
              {uniqueArtists.length > 0 && (
                <p className="text-sm text-zinc-500 mt-0.5">
                  con {uniqueArtists.join(', ')}
                </p>
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
              <span className="text-zinc-700 capitalize">
                {dateStr}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="size-4 text-zinc-400 flex-shrink-0" />
              <span className="text-zinc-700">
                {formatTime(appt.start_time)} - {formatTime(appt.end_time || appt.start_time)}
                <span className="text-zinc-400 ml-2">({appt.total_duration_min} min)</span>
              </span>
              {appt.status === 'programada' && (() => {
                const diffMs = new Date(appt.start_time).getTime() - Date.now();
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

          {appt.appointment_services?.length > 0 && (
            <div className="space-y-2.5">
              {appt.appointment_services.map((as: any) => (
                <div key={as.service_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{as.service?.category?.icon || '📋'}</span>
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
            const advancePaid = (appt.appointment_balance.total_paid || 0) >= 20;
            if (!advancePaid) return null;
            return (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-2.5 py-1.5">
                <Check className="size-3.5" />
                Adelanto de S/20 pagado
              </div>
            );
          })()}
        </div>

        {/* Actions */}
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
                <Pencil className="size-5" />
                Editar
              </button>
              {onCancel && (
                <button
                  onClick={() => { onClose(); onCancel(appt); }}
                  className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <XCircle className="size-5" />
                  Cancelar
                </button>
              )}
              {onMarkAsNoShow && (
                <button
                  onClick={() => { onClose(); onMarkAsNoShow(appt); }}
                  className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium text-zinc-600 bg-zinc-50 hover:bg-zinc-100 transition-colors"
                >
                  <AlertTriangle className="size-5" />
                  No Show
                </button>
              )}
            </div>
          )}
          {appt.status !== 'programada' && (
            <div className="flex gap-2">
              <button
                onClick={() => { onClose(); onEdit(appt); }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  appt.status === 'en_curso'
                    ? "w-full text-salon-700 bg-salon-50 hover:bg-salon-100"
                    : "w-full text-zinc-600 bg-zinc-100 hover:bg-zinc-200"
                )}
              >
                <Pencil className="size-4" /> Editar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
