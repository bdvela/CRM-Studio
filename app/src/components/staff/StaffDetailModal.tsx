'use client';

import { memo } from 'react';
import type { StaffWithDetails } from './types';
import { isOwnerMember } from './types';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CalendarDays, DollarSign, TrendingUp, Clock, Phone, Briefcase, Pencil } from 'lucide-react';

interface StaffDetailModalProps {
  open: boolean;
  member: StaffWithDetails | null;
  onClose: () => void;
  onEdit: (member: StaffWithDetails) => void;
}

export const StaffDetailModal = memo(function StaffDetailModal({
  open,
  member,
  onClose,
  onEdit,
}: StaffDetailModalProps) {
  if (!member) return null;

  const roleColor = member.role?.color || '#6B7280';
  const stats = member.staff_stats;

  return (
    <Modal open={open} onClose={onClose} title={member.name}>
      <div className="space-y-5">
        {/* Header: avatar + name + badges */}
        <div className="flex items-center gap-4">
          <div
            className="size-14 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-rose-600 font-bold text-xl shadow-inner ring-4 ring-white flex-shrink-0"
            aria-label={`Inicial de ${member.name}`}
            role="img"
          >
            {member.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-zinc-900 truncate">{member.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="custom" color={roleColor} className="text-xs">
                {member.role?.name || 'Sin rol'}
              </Badge>
              {!member.active && <Badge variant="danger" className="text-xs">Inactivo</Badge>}
            </div>
          </div>
        </div>

        {/* Stats grid */}
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
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 text-center">
              <TrendingUp className="size-4 mx-auto text-accent-500 mb-1.5" aria-hidden="true" />
              <p className="text-lg font-bold text-accent-600">{member.commission_pct}%</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Comision</p>
            </div>
          </div>
        )}

        {/* Contact + specialties */}
        <div className="space-y-2">
          {member.phone && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
              <div className="size-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <Phone className="size-3.5 text-zinc-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400">Telefono</p>
                <p className="text-sm font-medium text-zinc-700">{member.phone}</p>
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
