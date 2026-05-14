'use client';

import type { StaffDetailStatsProps } from './types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CalendarDays, DollarSign, TrendingUp, Clock } from 'lucide-react';

export function StaffDetailStats({ performance, loading }: StaffDetailStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                <CalendarDays className="size-5 text-zinc-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Sin datos</p>
                <p className="text-lg font-bold text-zinc-300">—</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Estadísticas de rendimiento">
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-salon-100 flex items-center justify-center">
            <CalendarDays className="size-5 text-salon-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Citas completadas</p>
            <p className="text-lg font-bold text-zinc-900">{performance.totalAppointments}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center">
            <DollarSign className="size-5 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Ingreso generado</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(performance.totalRevenue)}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-accent-100 flex items-center justify-center">
            <TrendingUp className="size-5 text-accent-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Comisión artista</p>
            <p className="text-lg font-bold text-accent-600">{formatCurrency(performance.totalCommission)}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Clock className="size-5 text-emerald-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Última cita</p>
            <p className="text-lg font-bold text-zinc-900 text-sm truncate">
              {performance.lastAppointmentDate ? formatDate(performance.lastAppointmentDate) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
