'use client';

import { memo } from 'react';
import type { ClientDetailModalProps } from './types';
import type { ClientStatus } from '@/types/database';
import { STATUS_LABELS, APPT_STATUS_STYLES } from './constants';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import {
  Pencil, Trash2, ExternalLink, CalendarDays, ScrollText,
} from 'lucide-react';

const STATUS_COLORS: Record<ClientStatus, string> = {
  prospecto: '#D97706',
  activa: '#059669',
  inactiva: '#71717A',
  vip: '#7C3AED',
};

function Dot() {
  return <span className="text-zinc-300/60 mx-1.5 sm:mx-2 select-none" aria-hidden="true">·</span>;
}

function ThinDivider() {
  return <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent my-1" />;
}

export const ClientDetailModal = memo(function ClientDetailModal({
  open,
  client,
  appointments,
  appointmentsLoading,
  onClose,
  onEdit,
  onDelete,
  onViewDetail,
  deleting,
}: ClientDetailModalProps) {
  if (!client) return null;

  const statusColor = STATUS_COLORS[client.status];
  const stats = client.client_stats;
  const latestAppt = appointments[0];

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="relative overflow-hidden rounded-xl bg-white">

        {/* Header */}
        <div className="relative pt-2 pb-3 px-4">
          <div className="flex justify-center mb-3">
            <div
              className="size-16 sm:size-20 rounded-full bg-gradient-to-br from-salon-500/90 via-salon-400/50 to-salon-500 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-lg shadow-salon-500/20"
              aria-label={`Foto de ${client.name}`}
              role="img"
            >
              {client.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-800">
              {client.name}
            </h2>
            <Badge variant="custom" color={statusColor} className="text-[11px] px-2.5 py-0.5">
              {STATUS_LABELS[client.status]}
            </Badge>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-center gap-1 text-center">
              <div className="flex-1">
                <p className="text-xl sm:text-2xl font-bold text-zinc-800 tabular-nums">{stats.total_appointments}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 tracking-wide uppercase">Citas</p>
              </div>
              <Dot />
              <div className="flex-1">
                <p className="text-lg sm:text-xl font-bold text-zinc-800 tabular-nums">{formatCurrency(stats.total_spent)}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 tracking-wide uppercase">Total</p>
              </div>
              <Dot />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-bold text-zinc-800 tabular-nums">
                  {stats.last_visit ? formatDate(stats.last_visit) : '—'}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 tracking-wide uppercase">Última</p>
              </div>
            </div>
          </div>
        )}

        <ThinDivider />

        {/* Notes */}
        {client.notes && (
          <>
            <div className="px-3 py-2.5">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50/60">
                <ScrollText className="size-3.5 text-zinc-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-zinc-400 mb-1">Notas</p>
                  <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap break-words">{client.notes}</p>
                </div>
              </div>
            </div>
            <ThinDivider />
          </>
        )}

        {/* Latest Appointment */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <CalendarDays className="size-3.5 text-zinc-400" aria-hidden="true" />
            <h4 className="text-xs font-semibold text-zinc-900">Última cita</h4>
          </div>
          {appointmentsLoading ? (
            <div className="flex items-center justify-center py-6 px-3 rounded-xl bg-zinc-50">
              <div className="size-4 rounded-full border-2 border-salon-300 border-t-transparent animate-spin" />
              <span className="ml-2 text-xs text-zinc-400">Cargando…</span>
            </div>
          ) : !latestAppt ? (
            <div className="text-center py-6 px-3 rounded-xl bg-zinc-50">
              <CalendarDays className="size-6 sm:size-8 mx-auto text-zinc-300 mb-2" aria-hidden="true" />
              <p className="text-xs text-zinc-400">Sin citas registradas</p>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60">
              <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                <p className="font-medium text-sm text-zinc-900 flex-1 min-w-0 truncate">{latestAppt.title}</p>
                <p className="text-sm font-semibold text-zinc-900 flex-shrink-0">{formatCurrency(latestAppt.total_price)}</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] text-zinc-400 flex-wrap">
                  <span>{formatDate(latestAppt.start_time)}</span>
                  <Dot />
                  <span>{formatTime(latestAppt.start_time)}</span>
                  {latestAppt.artist && (
                    <>
                      <Dot />
                      <span>{latestAppt.artist.name}</span>
                    </>
                  )}
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${APPT_STATUS_STYLES[latestAppt.status] || ''} flex-shrink-0`}>
                  {APPOINTMENT_STATUS_LABELS[latestAppt.status]}
                </span>
              </div>
            </div>
          )}
        </div>

        <ThinDivider />

        {/* Actions */}
        <div className="p-3 flex gap-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-salon-700 border border-salon-200 hover:bg-salon-50 transition-colors"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Editar
          </button>
        </div>

        <button
          type="button"
          onClick={onViewDetail}
          className="w-full px-3 pb-3 flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          Ver detalle completo
        </button>

      </div>
    </Modal>
  );
});
