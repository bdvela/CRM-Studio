'use client';

import type { StaffDetailTopServicesProps } from './types';
import { formatCurrency } from '@/lib/utils';
import { Star } from 'lucide-react';

export function StaffDetailTopServices({ services }: StaffDetailTopServicesProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Star className="size-4 text-amber-500" aria-hidden="true" />
          <p className="text-sm font-semibold text-zinc-700">Servicios más realizados</p>
        </div>
        {services.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-6">Sin servicios en este período</p>
        ) : (
          <div className="space-y-2">
            {services.map((svc, idx) => (
              <div key={svc.service_id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-zinc-300 w-5">{idx + 1}</span>
                  <span className="text-sm font-medium truncate text-zinc-900">{svc.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500 flex-shrink-0">
                  <span>{svc.count}x</span>
                  <span className="font-medium text-zinc-700">{formatCurrency(svc.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
