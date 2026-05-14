'use client';

import type { StaffDetailDistributionProps } from './types';
import { formatCurrency } from '@/lib/utils';

export function StaffDetailDistribution({ performance }: StaffDetailDistributionProps) {
  const artistPct = Math.round((performance.totalCommission / performance.totalRevenue) * 100);
  const founderPct = 100 - artistPct;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <p className="text-sm font-medium text-zinc-700 mb-3">Distribución de ingresos</p>
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
          <span>Artista: {formatCurrency(performance.totalCommission)} ({artistPct}%)</span>
          <span>Founder: {formatCurrency(performance.totalFounderShare)} ({founderPct}%)</span>
        </div>
        <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={artistPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Artista ${artistPct}%, Founder ${founderPct}%`}>
          <div
            className="h-full bg-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${artistPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
