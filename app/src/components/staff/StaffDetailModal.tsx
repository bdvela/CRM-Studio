'use client';

import { memo, useMemo } from 'react';
import type { StaffWithDetails, StaffPerformance } from './types';
import { isOwnerMember } from './types';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Phone, Pencil, Cake, Clock, CalendarDays, Sparkles, ArrowUpRight, Trash2, ExternalLink,
} from 'lucide-react';

interface StaffDetailModalProps {
  open: boolean;
  member: StaffWithDetails | null;
  onClose: () => void;
  onEdit: (member: StaffWithDetails) => void;
  onDelete?: (member: StaffWithDetails) => void;
  onViewDetail?: () => void;
  deletingId?: string | null;
  commissionOverridesCount?: number;
  recentPerformance?: StaffPerformance | null;
  viewingLoading?: boolean;
}

function birthdayLabel(birthdayDate: string | null): { label: string; isSoon: boolean } | null {
  if (!birthdayDate) return null;
  const bd = new Date(birthdayDate);
  const now = new Date();
  const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
  if (thisYearBd < now) thisYearBd.setFullYear(thisYearBd.getFullYear() + 1);
  const daysUntil = Math.ceil((thisYearBd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = formatDate(birthdayDate);
  if (daysUntil <= 7) return { label: `${formatted} — Próximo`, isSoon: true };
  return { label: formatted, isSoon: false };
}

// ─── Decorative elements ──────────────────────────────────────────────────

function Dot() {
  return <span className="text-rose-300/60 mx-2 select-none" aria-hidden="true">·</span>;
}

function ThinDivider() {
  return <div className="w-full h-px bg-gradient-to-r from-transparent via-rose-200/50 to-transparent my-1" />;
}

// ─── Component ────────────────────────────────────────────────────────────

export const StaffDetailModal = memo(function StaffDetailModal({
  open,
  member,
  onClose,
  onEdit,
  onDelete,
  onViewDetail,
  deletingId,
  commissionOverridesCount = 0,
  recentPerformance,
  viewingLoading,
}: StaffDetailModalProps) {
  const roleColor = member?.role?.color || '#a78bfa';
  const stats = member?.staff_stats;
  const bd = useMemo(() => birthdayLabel(member?.birthday_date ?? null), [member?.birthday_date]);

  if (!member) return null;

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="relative overflow-hidden rounded-xl bg-white">

        {/* ─── Header section ─── */}
        <div className="relative pt-2 pb-3 px-4">
          {/* Avatar — large, centered */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div
                className="size-20 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-rose-200/40"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${roleColor}dd, ${roleColor}88, ${roleColor})`,
                }}
                role="img"
                aria-label={`Foto de ${member.name}`}
              >
                {member.name[0]?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Name + role */}
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-800">
              {member.name}
            </h2>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="custom" color={roleColor} className="text-[11px] px-2.5 py-0.5">
                {member.role?.name || 'Sin rol'}
              </Badge>
              {!member.active && (
                <Badge variant="danger" className="text-[11px] px-2.5 py-0.5">Inactivo</Badge>
              )}
            </div>
          </div>
        </div>

        {/* ─── Stats row — elegant horizontal flow ─── */}
        {stats && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-center gap-1 text-center">
              <div className="flex-1">
                <p className="text-2xl font-bold text-zinc-800 tabular-nums">{stats.total_appointments}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 tracking-wide uppercase">Citas</p>
              </div>
              <Dot />
              <div className="flex-1">
                <p className="text-xl font-bold text-zinc-800 tabular-nums">{formatCurrency(stats.total_revenue)}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 tracking-wide uppercase">Facturado</p>
                {viewingLoading ? (
                  <p className="text-[10px] text-zinc-300 mt-0.5 flex items-center justify-center gap-1">
                    <span className="size-3 rounded-full border-2 border-salon-200 border-t-transparent animate-spin" />
                  </p>
                ) : recentPerformance && recentPerformance.totalRevenue > 0 && (
                  <p className="text-[10px] text-rose-400 mt-0.5 flex items-center justify-center gap-1">
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                    30d: {formatCurrency(recentPerformance.totalRevenue)}
                  </p>
                )}
              </div>
              <Dot />
              <div className="flex-1">
                <p className="text-2xl font-bold text-rose-500 tabular-nums">{member.commission_pct}%</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 tracking-wide uppercase">Comision</p>
                {viewingLoading ? (
                  <p className="text-[10px] text-zinc-300 mt-0.5 flex items-center justify-center gap-1">
                    <span className="size-3 rounded-full border-2 border-salon-200 border-t-transparent animate-spin" />
                  </p>
                ) : commissionOverridesCount > 0 && (
                  <p className="text-[10px] text-amber-500 font-medium mt-0.5">
                    {commissionOverridesCount} excepcion{commissionOverridesCount !== 1 ? 'es' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <ThinDivider />

        {/* ─── Info cards — 2-column grid ─── */}
        <div className="p-3 grid grid-cols-2 gap-2">
          {/* Left column: Phone + Birthday */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50/60">
              <Phone className="size-3.5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400">Telefono</p>
                <p className={`text-xs font-medium truncate ${member.phone ? 'text-zinc-700' : 'text-zinc-300'}`}>
                  {member.phone || '—'}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${bd?.isSoon ? 'bg-rose-50 border border-rose-100' : 'bg-zinc-50/60'}`}>
              <Cake className={`size-3.5 flex-shrink-0 ${bd?.isSoon ? 'text-rose-500' : 'text-zinc-400'}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400">Cumpleaños</p>
                <p className={`text-xs font-medium truncate ${bd ? 'text-zinc-700' : 'text-zinc-300'} ${bd?.isSoon ? '!text-rose-700' : ''}`}>
                  {bd?.label || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Right column: Schedule + Last appointment */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50/60">
              <Clock className="size-3.5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400">Horario</p>
                <p className={`text-xs font-medium truncate ${member.schedule ? 'text-zinc-700' : 'text-zinc-300'}`}>
                  {member.schedule || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50/60">
              <CalendarDays className="size-3.5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400">Ultima cita</p>
                <p className={`text-xs font-medium truncate ${stats?.last_appointment ? 'text-zinc-700' : 'text-zinc-300'}`}>
                  {stats?.last_appointment ? formatDate(stats.last_appointment) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Specialties — full width field */}
          <div className="col-span-2 flex items-start gap-2 p-3 rounded-xl bg-zinc-50/60">
            <Sparkles className="size-3.5 text-zinc-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-zinc-400 mb-2">Especialidades</p>
              {member.staff_specialties && member.staff_specialties.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {member.staff_specialties.map((spec) => (
                    <span
                      key={spec.id || spec.category_id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                      style={{
                        backgroundColor: `${spec.category?.color || '#6B7280'}18`,
                        color: spec.category?.color || '#6B7280',
                      }}
                    >
                      <span className="text-sm leading-none">{spec.category?.icon || ''}</span>
                      {spec.category?.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-300">-</p>
              )}
            </div>
          </div>
        </div>

        <ThinDivider />

        {/* ─── Actions ─── */}
        <div className="p-3 flex gap-3">
          {!isOwnerMember(member) && (
            <button
              type="button"
              onClick={() => onDelete?.(member)}
              disabled={deletingId === member.id}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {deletingId === member.id ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-salon-700 border border-salon-200 hover:bg-salon-50 transition-colors"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Editar
          </button>
        </div>

        {onViewDetail && (
          <button
            type="button"
            onClick={onViewDetail}
            className="w-full px-3 pb-3 flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            Ver detalle completo
          </button>
        )}

      </div>
    </Modal>
  );
});
