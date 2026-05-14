'use client';

import { useMemo, memo } from 'react';
import type { AppointmentDetailCommissionsProps } from './types-detail';
import { formatCurrency } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

export const AppointmentDetailCommissions = memo(function AppointmentDetailCommissions({ appointment }: AppointmentDetailCommissionsProps) {
  const { hasCommissions, artistTotal, founderTotal } = useMemo(() => {
    const services = appointment.appointment_services || [];
    let art = 0;
    let found = 0;
    let has = false;
    for (const as of services) {
      const cd = as.commission_detail;
      if (!cd) continue;
      has = true;
      if (cd.artist_role_name === 'Dueña' || cd.artist_role_name === 'Founder') {
        found += Number(cd.artist_commission || 0);
      } else {
        art += Number(cd.artist_commission || 0);
      }
      found += Number(cd.founder_share || 0);
    }
    return { hasCommissions: has, artistTotal: art, founderTotal: found };
  }, [appointment.appointment_services]);

  if (!hasCommissions || (artistTotal === 0 && founderTotal === 0)) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
          <DollarSign className="size-4 text-zinc-400" aria-hidden="true" />
          Comisiones
        </h3>
        <div className="flex items-center justify-between text-sm">
          {artistTotal > 0 && (
            <div>
              <p className="text-xs text-zinc-400">Artistas</p>
              <p className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(artistTotal)}</p>
            </div>
          )}
          <div className={artistTotal > 0 ? 'text-right' : ''}>
            <p className="text-xs text-zinc-400">Founder</p>
            <p className="font-semibold text-salon-600 tabular-nums">{formatCurrency(founderTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
});
