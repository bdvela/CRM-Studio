'use client';

import { memo, useMemo } from 'react';
import type { StaffWithDetails, StaffPerformance } from './types';
import { isOwnerMember } from './types';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CalendarDays, DollarSign, TrendingUp, Clock, Phone,
  Pencil, Cake, MessageCircle,
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
      <div className="space-y-5">

        {/* Header: avatar + role + name */}
        <div className="flex items-center gap-4">
          <div
            className="size-14 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-rose-600 font-bold text-xl flex-shrink-0"
            aria-label={`Inicial de ${member.name}`}
            role="img"
          >
            {member.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-zinc-900">{member.name}</h3>
              <Badge variant="custom" color={roleColor} className="text-xs">
                {member.role?.name || 'Sin rol'}
              </Badge>
              {!member.active && <Badge variant="danger" className="text-xs">Inactivo</Badge>}
            </div>
          </div>
        </div>

        {/* Stats — horizontal flow */}
        {stats && (
          <div className="flex items-center divide-x divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex-1 px-4 py-3.5 text-center">
              <p className="text-xl font-bold text-zinc-900 tabular-nums">{stats.total_appointments}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 tracking-wide">CITAS</p>
            </div>
            <div className="flex-1 px-4 py-3.5 text-center">
              <p className="text-sm font-bold text-zinc-900 tabular-nums">{formatCurrency(stats.total_revenue)}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 tracking-wide">FACTURADO</p>
              {recentPerformance && recentPerformance.totalRevenue > 0 && (
                <p className="text-[10px] text-salon-600 mt-0.5">
                  30d: {formatCurrency(recentPerformance.totalRevenue)}
                </p>
              )}
            </div>
            <div className="flex-1 px-4 py-3.5 text-center">
              <p className="text-xl font-bold text-accent-600 tabular-nums">{member.commission_pct}%</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 tracking-wide">COMISIÓN</p>
              {commissionOverridesCount > 0 && (
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                  {commissionOverridesCount} excep.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info rows */}
        <div className="space-y-1">
          {member.phone && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors group">
              <Phone className="size-4 text-zinc-400 group-hover:text-salon-500 transition-colors flex-shrink-0" aria-hidden="true" />
              <span className="text-sm text-zinc-700 flex-1 truncate">{member.phone}</span>
              <a
                href={waUrl(member.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-xs font-medium text-green-700 transition-colors flex-shrink-0"
                aria-label={`Enviar WhatsApp a ${member.name}`}
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
            </div>
          )}

          {bd && (
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${bd.isSoon ? 'bg-rose-50 border border-rose-100' : 'hover:bg-zinc-50'} transition-colors`}>
              <Cake className={`size-4 flex-shrink-0 ${bd.isSoon ? 'text-rose-500' : 'text-zinc-400'}`} aria-hidden="true" />
              <span className={`text-sm flex-1 ${bd.isSoon ? 'text-rose-700 font-medium' : 'text-zinc-600'}`}>
                {bd.label}
              </span>
              {bd.isSoon && (
                <Badge variant="custom" color="#f43f5e" className="text-[10px] flex-shrink-0">Próximo</Badge>
              )}
            </div>
          )}

          {member.schedule && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors group">
              <Clock className="size-4 text-zinc-400 group-hover:text-salon-500 transition-colors flex-shrink-0" aria-hidden="true" />
              <span className="text-sm text-zinc-600 flex-1">{member.schedule}</span>
            </div>
          )}

          {member.staff_specialties && member.staff_specialties.length > 0 && (
            <div className="px-3 py-2.5">
              <div className="flex flex-wrap gap-1.5">
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
            </div>
          )}

          {stats?.last_appointment && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors group">
              <CalendarDays className="size-4 text-zinc-400 group-hover:text-salon-500 transition-colors flex-shrink-0" aria-hidden="true" />
              <span className="text-sm text-zinc-500 flex-1">Ultima cita: <span className="text-zinc-700 font-medium">{formatDate(stats.last_appointment)}</span></span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-zinc-100">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cerrar
          </Button>
          {!isOwnerMember(member) && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(member);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-salon-700 border border-salon-200 hover:bg-salon-50 active:scale-[0.97] transition-colors"
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
