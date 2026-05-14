'use client';

import { memo } from 'react';
import type { AppointmentDetailBalanceProps } from './types-detail';
import { formatCurrency } from '@/lib/utils';

export const AppointmentDetailBalance = memo(function AppointmentDetailBalance({ appointment }: AppointmentDetailBalanceProps) {
  const balance = appointment.appointment_balance;
  const total = Number(appointment.total_price || 0);
  const paid = Number(balance?.total_paid || 0);
  const pending = Number(balance?.pending_balance || 0);

  if (!balance) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-4">
        <p className="text-xs text-zinc-400">Total</p>
        <p className="text-xl font-bold text-zinc-900 tabular-nums mt-1">{formatCurrency(total)}</p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-4">
        <p className="text-xs text-zinc-400">Pagado</p>
        <p className="text-xl font-bold text-emerald-600 tabular-nums mt-1">{formatCurrency(paid)}</p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-4">
        <p className="text-xs text-zinc-400">Saldo</p>
        <p className={`text-xl font-bold tabular-nums mt-1 ${pending > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
          {formatCurrency(pending)}
        </p>
      </div>
    </div>
  );
});
