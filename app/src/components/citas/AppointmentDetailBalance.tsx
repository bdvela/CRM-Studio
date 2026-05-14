'use client';

import { memo } from 'react';
import type { AppointmentDetailBalanceProps } from './types-detail';
import { formatCurrency } from '@/lib/utils';
import { DEPOSIT_AMOUNT } from '@/lib/constants';
import { DollarSign, Check } from 'lucide-react';

export const AppointmentDetailBalance = memo(function AppointmentDetailBalance({ appointment }: AppointmentDetailBalanceProps) {
  const balance = appointment.appointment_balance;
  const total = Number(appointment.total_price || 0);
  const paid = Number(balance?.total_paid || 0);
  const pending = Number(balance?.pending_balance || 0);
  const advancePaid = paid >= DEPOSIT_AMOUNT;

  if (!balance) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
          <DollarSign className="size-4 text-zinc-400" aria-hidden="true" />
          Balance de pagos
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-zinc-400">Total</p>
            <p className="text-lg font-bold text-zinc-900 tabular-nums">{formatCurrency(total)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Pagado</p>
            <p className="text-lg font-bold text-green-600 tabular-nums">{formatCurrency(paid)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Saldo</p>
            <p className={`text-lg font-bold tabular-nums ${pending > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
              {formatCurrency(pending)}
            </p>
          </div>
        </div>
        {advancePaid && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-2.5 py-1.5 mt-3">
            <Check className="size-3.5" aria-hidden="true" />
            Adelanto de S/{DEPOSIT_AMOUNT} pagado
          </div>
        )}
      </div>
    </div>
  );
});
