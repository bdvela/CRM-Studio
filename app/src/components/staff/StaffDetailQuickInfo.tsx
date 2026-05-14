'use client';

import type { StaffDetailQuickInfoProps } from './types';
import { formatDate } from '@/lib/utils';
import { Briefcase, Cake, Percent } from 'lucide-react';

export function StaffDetailQuickInfo({ member, commissionOverridesCount }: StaffDetailQuickInfoProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="size-4 text-salon-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-zinc-700">Resumen rápido</p>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-zinc-50">
            <span className="text-sm text-zinc-600">Comisión</span>
            <span className="text-sm font-semibold text-accent-600">{member.commission_pct}%</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-zinc-50">
            <span className="text-sm text-zinc-600">Especialidades</span>
            <span className="text-sm font-semibold text-zinc-900">{member.staff_specialties?.length || 0}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-zinc-50">
            <span className="text-sm text-zinc-600">Rol</span>
            <span className="text-sm font-semibold text-zinc-900">{member.role?.name || 'Sin rol'}</span>
          </div>
          {member.schedule && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-50">
              <span className="text-sm text-zinc-600">Horario</span>
              <span className="text-sm font-semibold text-zinc-900">{member.schedule}</span>
            </div>
          )}
          {member.birthday_date && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-50">
              <span className="text-sm text-zinc-600 flex items-center gap-1.5">
                <Cake className="size-3.5 text-rose-400" aria-hidden="true" />
                Cumpleaños
              </span>
              <span className="text-sm font-semibold text-zinc-900">{formatDate(member.birthday_date)}</span>
            </div>
          )}
          {commissionOverridesCount !== undefined && commissionOverridesCount > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-50">
              <span className="text-sm text-zinc-600 flex items-center gap-1.5">
                <Percent className="size-3.5 text-amber-500" aria-hidden="true" />
                Excepciones
              </span>
              <span className="text-sm font-semibold text-amber-600">{commissionOverridesCount}</span>
            </div>
          )}
          {member.staff_stats?.last_appointment && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-zinc-600">Última cita (total)</span>
              <span className="text-sm font-semibold text-zinc-900">{formatDate(member.staff_stats.last_appointment)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
