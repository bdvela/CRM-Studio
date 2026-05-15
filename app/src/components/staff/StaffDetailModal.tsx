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
  Briefcase, Pencil, Cake, MessageCircle,
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
  if (daysUntil <= 7) return { label: `${formatted} — ¡Próximo!`, isSoon: true };
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

        {/* Header: border-l role color + avatar + name + badges */}
        <div className="flex gap-4" style={{ borderLeft: `4px solid ${roleColor}`, paddingLeft: 16 }}>
          <div
            className="size-14 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-rose-600 font-bold text-xl shadow-inner ring-4 ring-white flex-shrink-0"
            aria-label={`Inicial de ${member.name}`}
            role="img"
          >
            {member.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
              <h3 className="text-lg font-bold text-zinc-900 truncate">{member.name}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="custom" color={roleColor} className="text-xs">
                {member.role?.name || 'Sin rol'}
              </Badge>
              {!member.active && <Badge variant="danger" className="text-xs">Inactivo</Badge>}
            </div>
          </div>
        </div>

        {/* Stats grid with trend + commission exceptions */}
        {stats && (
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-zinc-50 text-center">
              <CalendarDays className="size-4 mx-auto text-salon-500 mb-1.5" aria-hidden="true" />
              <p className="text-lg font-bold text-zinc-900">{stats.total_appointments}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Citas</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 text-center">
              <DollarSign className="size-4 mx-auto text-green-500 mb-1.5" aria-hidden="true" />
              <p className="text-sm font-bold text-zinc-900">{formatCurrency(stats.total_revenue)}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Facturado</p>
              {recentPerformance && recentPerformance.totalRevenue > 0 && (
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  30d: {formatCurrency(recentPerformance.totalRevenue)}
                </p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 text-center">
              <TrendingUp className="size-4 mx-auto text-accent-500 mb-1.5" aria-hidden="true" />
              <p className="text-lg font-bold text-accent-600">{member.commission_pct}%</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Comision</p>
              {commissionOverridesCount > 0 && (
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                  {commissionOverridesCount} excepcion{commissionOverridesCount !== 1 ? 'es' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contact + specialties + birthday + schedule */}
        <div className="space-y-2">
          {member.phone && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors group">
              <div className="size-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <Phone className="size-3.5 text-zinc-400" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-zinc-400">Telefono</p>
                <p className="text-sm font-medium text-zinc-700 truncate">{member.phone}</p>
              </div>
              <a
                href={waUrl(member.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 size-8 rounded-lg bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors"
                aria-label={`Enviar WhatsApp a ${member.name}`}
              >
                <MessageCircle className="size-4 text-green-600" />
              </a>
            </div>
          )}

          {bd && (
            <div className={`flex items-center gap-3 p-2.5 rounded-xl ${bd.isSoon ? 'bg-rose-50 border border-rose-100' : ''}`}>
              <div className={`size-8 rounded-lg flex items-center justify-center ${bd.isSoon ? 'bg-rose-100' : 'bg-zinc-100'}`}>
                <Cake className={`size-3.5 ${bd.isSoon ? 'text-rose-500' : 'text-zinc-400'}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400">Cumpleaños</p>
                <p className={`text-sm font-medium ${bd.isSoon ? 'text-rose-700' : 'text-zinc-700'}`}>
                  {bd.label}
                </p>
              </div>
            </div>
          )}

          {member.staff_specialties && member.staff_specialties.length > 0 && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl">
              <div className="size-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                <Briefcase className="size-3.5 text-zinc-400" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap gap-1">
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

          {member.schedule && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl">
              <div className="size-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <Clock className="size-3.5 text-zinc-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400">Horario</p>
                <p className="text-sm font-medium text-zinc-700">{member.schedule}</p>
              </div>
            </div>
          )}

          {stats?.last_appointment && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl">
              <div className="size-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <CalendarDays className="size-3.5 text-zinc-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400">Ultima cita (total)</p>
                <p className="text-sm font-medium text-zinc-700">{formatDate(stats.last_appointment)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-zinc-100">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-zinc-200"
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-salon-700 border border-salon-200 hover:bg-salon-50 transition-colors"
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
