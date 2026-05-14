'use client';

import type { PagosSummaryCardsProps } from './types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export function PagosSummaryCards({ totalIngresos, totalEgresos }: PagosSummaryCardsProps) {
  const netProfit = totalIngresos - totalEgresos;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" role="region" aria-label="Resumen financiero">
      <Card>
        <CardContent className="py-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center" aria-hidden="true">
            <TrendingUp className="size-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Ingresos</p>
            <p className="text-lg font-bold text-green-600 tabular-nums">
              {formatCurrency(totalIngresos)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center" aria-hidden="true">
            <TrendingDown className="size-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Egresos</p>
            <p className="text-lg font-bold text-red-600 tabular-nums">
              {formatCurrency(totalEgresos)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-2 lg:col-span-1">
        <CardContent className="py-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-salon-100 flex items-center justify-center" aria-hidden="true">
            <DollarSign className="size-5 text-salon-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Ganancia neta</p>
            <p
              className={[
                'text-lg font-bold tabular-nums',
                netProfit >= 0 ? 'text-salon-600' : 'text-red-600',
              ].join(' ')}
            >
              {formatCurrency(netProfit)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
