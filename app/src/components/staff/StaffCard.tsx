'use client';

import { memo } from 'react';
import type { StaffCardProps } from './types';
import { isOwnerMember } from './types';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Phone, DollarSign } from 'lucide-react';

export const StaffCard = memo(function StaffCard({ member, onView }: StaffCardProps) {
  const isOwner = isOwnerMember(member);
  const roleColor = member.role?.color || '#6B7280';

  return (
    <div
      onClick={() => onView(member)}
      className={`h-full flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-salon-300 transition-shadow transition-colors active:scale-[0.97] ${!member.active ? 'opacity-60' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${member.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView(member);
        }
      }}
    >
      <div className="flex flex-col flex-1 py-5 px-5">
        <div className="flex items-start gap-4">
          <div
            className="size-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md shadow-rose-200/30"
            style={{
              backgroundImage: `linear-gradient(135deg, ${roleColor}dd, ${roleColor}88, ${roleColor})`,
            }}
            aria-label={`Inicial de ${member.name}`}
            role="img"
          >
            {member.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-900 truncate">{member.name}</p>
            <Badge
              variant="custom"
              color={roleColor}
              className="mt-1"
            >
              {member.role?.name || 'Sin rol'}
            </Badge>
            {member.phone && (
              <p className="flex items-center gap-1 text-xs text-zinc-400 mt-2">
                <Phone className="size-3" aria-hidden="true" />
                <span>{member.phone}</span>
              </p>
            )}
          </div>
        </div>

        {member.staff_specialties && member.staff_specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
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

        {member.staff_stats && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
            <span>{member.staff_stats.total_appointments} citas</span>
            <span className="flex items-center gap-1">
              <DollarSign className="size-3" aria-hidden="true" />
              {formatCurrency(member.staff_stats.total_revenue)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-100">
          <span className="text-xs text-zinc-400">
            Comisión: <span className="font-semibold text-zinc-700">{member.commission_pct}%</span>
          </span>
          {!member.active && (
            <Badge variant="danger" className="text-[10px]">Inactivo</Badge>
          )}
        </div>
      </div>
    </div>
  );
});
