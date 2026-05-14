'use client';

import { Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { PendingPaymentDTO } from './types';

interface Props {
  payments: PendingPaymentDTO[];
}

export function PendingPaymentsWidget({ payments }: Props) {
  if (payments.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-50">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="size-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Pendientes de pago</h2>
            <p className="text-xs text-zinc-400">{payments.length} cita{payments.length !== 1 ? 's' : ''} con saldo</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {payments.slice(0, 3).map((appt) => (
          <div key={appt.id} className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-b-0">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{appt.client?.name || 'Sin clienta'}</p>
              <p className="text-xs text-zinc-400 truncate">{appt.title}</p>
            </div>
            <p className="text-sm font-semibold text-amber-600 ml-3 flex-shrink-0">{formatCurrency(appt.total_price)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
