'use client';

import { memo, useMemo } from 'react';
import type { PaymentCardProps } from './types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  PAYMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Link2 } from 'lucide-react';

export const PaymentCard = memo(function PaymentCard({ payment, onClick }: PaymentCardProps) {
  const isIngreso = payment.type === 'ingreso';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const isVinculado = !!(payment.appointment_id || payment.client_id);

  const formattedDate = useMemo(() => formatDate(payment.date), [payment.date]);

  return (
    <Card
      className={cn(
        'border-l-4 cursor-pointer hover:shadow-sm transition-all',
        isIngreso ? 'border-l-emerald-400' : 'border-l-red-300'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${isIngreso ? 'Ingreso' : 'Egreso'}: ${payment.concept} - ${formatCurrency(payment.amount)}`}
      onKeyDown={handleKeyDown}
    >
      <CardContent className="flex items-center gap-4 py-3.5">
        <div
          className={cn(
            'size-10 rounded-xl flex items-center justify-center flex-shrink-0',
            isIngreso ? 'bg-green-100' : 'bg-red-100'
          )}
          aria-hidden="true"
        >
          {isIngreso ? (
            <TrendingUp className="size-5 text-green-600" />
          ) : (
            <TrendingDown className="size-5 text-red-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm truncate">{payment.concept}</p>
            {payment.payment_kind && (
              <Badge variant="default" className="text-xs">
                {PAYMENT_KIND_LABELS[payment.payment_kind]}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 flex-wrap">
            <span>{formattedDate}</span>
            {payment.payment_method && (
              <span>· {PAYMENT_METHOD_LABELS[payment.payment_method]}</span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p
            className={cn(
              'text-sm font-bold tabular-nums',
              isIngreso ? 'text-green-600' : 'text-red-600'
            )}
          >
            {isIngreso ? '+' : '-'}{formatCurrency(payment.amount)}
          </p>
          <Badge
            variant={isIngreso ? 'success' : 'danger'}
            className="text-xs mt-1"
          >
            {isIngreso ? 'Ingreso' : 'Egreso'}
          </Badge>
          {isVinculado && (
            <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1 justify-end">
              <Link2 className="size-3" aria-hidden="true" />
              <span>Vinculado</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
