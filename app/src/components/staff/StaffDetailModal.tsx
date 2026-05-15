'use client';

import { memo, useMemo } from 'react';
import type { StaffWithDetails, StaffPerformance } from './types';
import { isOwnerMember } from './types';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Phone, Pencil, Cake, MessageCircle, Clock,
  ExternalLink,
} from 'lucide-react';

interface StaffDetailModalProps {
  open: boolean;
  member: StaffWithDetails | null;
  onClose: () => void;
  onEdit: (member: StaffWithDetails) => void;
  commissionOverridesCount?: number;
  recentPerformance?: StaffPerformance | null;
}

function waUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/51${digits}`;
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

export const StaffDetailModal = memo(function StaffDetailModal({
  open,
  member,
  onClose,
  onEdit,
  commissionOverridesCount = 0,
  recentPerformance,
}: StaffDetailModalProps) {
  const roleColor = member?.role?.color || '#6B7280';
  const stats = member?.staff_stats;
  const bd = useMemo(() => birthdayLabel(member?.birthday_date ?? null), [member?.birthday_date]);

  if (!member) return null;

  return (
    <Modal open={open} onClose={onClose} title={member.name}>
      <div className="px-5 py-2 space-y-4">

        {/* Avatar + badges */}
        <div className="flex items-center gap-4">
          <div
            className="size-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${roleColor}dd, ${roleColor}88, ${roleColor})` }}
            role="img"
            aria-label={`Inicial de ${member.name}`}
          >
            {member.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="custom" color={roleColor} className="text-xs">
                {member.role?.name || 'Sin rol'}
              </Badge>
              {!member.active && <Badge variant="danger" className="text-xs">Inactivo</Badge>}
            </div>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-zinc-50 text-center">
              <p className="text-lg font-bold text-zinc-800">{stats.total_appointments}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">citas</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 text-center">
              <p className="text-sm font-bold text-zinc-800">{formatCurrency(stats.total_revenue)}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">facturado</p>
              {recentPerformance && recentPerformance.totalRevenue > 0 && (
                <p className="text-[10px] text-salon-600 mt-0.5">
                  30d {formatCurrency(recentPerformance.totalRevenue)}
                </p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 text-center">
              <p className="text-lg font-bold text-accent-600">{member.commission_pct}%</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">comision</p>
              {commissionOverridesCount > 0 && (
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                  +{commissionOverridesCount} excep.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Compact info rows */}
        <div className="space-y-2">
          {member.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="size-3.5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-zinc-600 flex-1 truncate">{member.phone}</span>
              <a
                href={waUrl(member.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 hover:bg-green-100 text-[11px] font-medium text-green-700 transition-colors flex-shrink-0"
                aria-label={`WhatsApp ${member.name}`}
              >
                <MessageCircle className="size-3" />
                WhatsApp
              </a>
            </div>
          )}

          {bd && (
            <div className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1 -mx-2 ${bd.isSoon ? 'bg-rose-50' : ''}`}>
              <Cake className={`size-3.5 flex-shrink-0 ${bd.isSoon ? 'text-rose-500' : 'text-zinc-400'}`} aria-hidden="true" />
              <span className={`${bd.isSoon ? 'text-rose-700 font-medium' : 'text-zinc-500'}`}>
                {bd.label}
              </span>
            </div>
          )}

          {member.schedule && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-3.5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-zinc-500">{member.schedule}</span>
            </div>
          )}

          {member.staff_specialties && member.staff_specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {member.staff_specialties.map((spec) => (
                <Badge
                  key={spec.id || spec.category_id}
                  variant="custom"
                  color={spec.category?.color || '#6B7280'}
                  className="text-[10px]"
                >
                  {spec.category?.icon || ''} {spec.category?.name}
                </Badge>
              ))}
            </div>
          )}

          {stats?.last_appointment && (
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="size-3.5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-zinc-500">Ultima cita <span className="text-zinc-700 font-medium">{formatDate(stats.last_appointment)}</span></span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Cerrar
          </button>
          <div className="flex-1" />
          {!isOwnerMember(member) && (
            <button
              type="button"
              onClick={() => { onClose(); onEdit(member); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-salon-700 border border-salon-200 hover:bg-salon-50 active:scale-[0.97] transition-colors"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              Editar
            </button>
          )}
        </div>

      </div>
    </Modal>
  );
});
