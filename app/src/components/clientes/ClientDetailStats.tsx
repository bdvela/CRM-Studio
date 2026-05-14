'use client';

import type { ClientDetailStatsProps } from './types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CalendarDays, DollarSign, Clock } from 'lucide-react';

export function ClientDetailStats({ totalAppointments, totalSpent, lastVisit }: ClientDetailStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-salon-100 flex items-center justify-center">
            <CalendarDays className="size-5 text-salon-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Citas totales</p>
            <p className="text-lg font-bold text-zinc-900">{totalAppointments}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center">
            <DollarSign className="size-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Total gastado</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalSpent)}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock className="size-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Última visita</p>
            <p className="text-lg font-bold text-zinc-900 text-sm">
              {lastVisit ? formatDate(lastVisit) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
