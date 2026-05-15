'use client';

import { memo } from 'react';
import type { StaffDetailProfileProps } from './types';
import { isOwnerMember } from './types';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

export const StaffDetailProfile = memo(function StaffDetailProfile({ member }: StaffDetailProfileProps) {
  const { push } = useRouter();
  const isOwner = isOwnerMember(member);
  const roleColor = member.role?.color || '#6B7280';

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-6">
        <div className="flex items-start gap-5">
          <div
            className={`size-16 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-2xl font-bold text-rose-600 flex-shrink-0 ${isOwner ? 'ring-2 ring-amber-300' : ''}`}
            aria-label={`Inicial de ${member.name}`}
            role="img"
          >
            {member.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-zinc-900">{member.name}</h1>
              <Badge variant="custom" color={roleColor} className="pointer-events-none">
                {member.role?.name || 'Sin rol'}
              </Badge>
              {!member.active && <Badge variant="danger">Inactivo</Badge>}
              {isOwner && (
                <Badge variant="custom" color="#F59E0B">Founder</Badge>
              )}
            </div>
            {member.phone && (
              <p className="text-sm text-zinc-500 mt-2">{member.phone}</p>
            )}
            {member.staff_specialties && member.staff_specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {member.staff_specialties.map((spec) => (
                  <Badge
                    key={spec.id || spec.category_id}
                    variant="custom"
                    color={spec.category?.color || '#6B7280'}
                    className="text-xs"
                  >
                    {spec.category?.icon || ''} {spec.category?.name}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500">
              <span>{member.staff_stats?.total_appointments || 0} citas totales</span>
              <span>{formatCurrency(member.staff_stats?.total_revenue || 0)} facturado</span>
              <span className="font-medium text-accent-600">{member.commission_pct}% comisión</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => push('/reportes/comisiones')}>
              <ExternalLink className="size-4 mr-1" aria-hidden="true" /> Comisiones
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
