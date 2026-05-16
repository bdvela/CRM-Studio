'use client';

import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PaymentCardProps } from './types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  PAYMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Link2 } from 'lucide-react';

const KIND_PREFIX: Record<string, string> = {
  reserva: 'Adelanto de cita',
  pago_completo: 'Pago completo',
  pago_final: 'Saldo de servicio',
};

export const PaymentCard = memo(function PaymentCard({ payment, onClick }: PaymentCardProps) {
  const isIngreso = payment.type === 'ingreso';
  const isVinculado = !!(payment.appointment_id || payment.client_id);

  const formattedDate = useMemo(() => formatDate(payment.date), [payment.date]);

  const registeredAt = useMemo(() => {
    return format(new Date(payment.created_at), "d MMM, h:mm a", { locale: es });
  }, [payment.created_at]);

  const appointmentDate = useMemo(() => {
    if (!payment.appointment?.start_time) return null;
    return format(new Date(payment.appointment.start_time), "d MMM yyyy", { locale: es });
  }, [payment.appointment?.start_time]);

  const clientName = payment.client?.name || null;
  const appointmentTitle = payment.appointment?.title || null;

  const conceptLabel = useMemo(() => {
    if (!isVinculado) return payment.concept;
    const prefix = payment.payment_kind ? KIND_PREFIX[payment.payment_kind] || 'Pago de cita' : 'Pago de cita';
    if (clientName) return `${prefix} — ${clientName}`;
    return prefix;
  }, [isVinculado, payment.payment_kind, payment.concept, clientName]);

  return (
    <Card
      className={cn(
        'border-l-4 cursor-pointer hover:shadow-sm transition-shadow',
        isIngreso ? 'border-l-emerald-400' : 'border-l-red-300'
      )}
      onClick={onClick}
      aria-label={`${isIngreso ? 'Ingreso' : 'Egreso'}: ${conceptLabel} - ${formatCurrency(payment.amount)}`}
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
          {isVinculado ? (
            <>
              <p className="font-medium text-sm truncate">{conceptLabel}</p>
              {appointmentTitle && (
                <p className="text-xs text-zinc-500 mt-0.5 truncate">
                  {appointmentTitle}
                  {appointmentDate && (
                    <span className="text-zinc-400 ml-2">· {appointmentDate}</span>
                  )}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
                <span>{registeredAt}</span>
                {payment.payment_method && (
                  <span>· {PAYMENT_METHOD_LABELS[payment.payment_method]}</span>
                )}
                <Link2 className="size-3" aria-hidden="true" />
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-sm truncate">{payment.concept}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
                <span>{formattedDate}</span>
                {payment.payment_kind && (
                  <span>· {PAYMENT_KIND_LABELS[payment.payment_kind]}</span>
                )}
                {payment.payment_method && (
                  <span>· {PAYMENT_METHOD_LABELS[payment.payment_method]}</span>
                )}
              </div>
            </>
          )}
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
          {isVinculado && payment.payment_kind && (
            <Badge variant="default" className="text-xs mt-1">
              {PAYMENT_KIND_LABELS[payment.payment_kind]}
            </Badge>
          )}
          {!isVinculado && (
            <Badge
              variant={isIngreso ? 'success' : 'danger'}
              className="text-xs mt-1"
            >
              {isIngreso ? 'Ingreso' : 'Egreso'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
