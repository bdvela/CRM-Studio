'use client';

import type { PaymentDetailModalProps } from './types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import {
  PAYMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  APPOINTMENT_STATUS_LABELS,
} from '@/types/database';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  UserRound,
  CalendarDays,
  ClipboardList,
  ArrowRight,
  Link2,
} from 'lucide-react';

export function PaymentDetailModal({
  payment,
  appointment,
  client,
  onClose,
  onGoToAppointment,
  onGoToClient,
}: PaymentDetailModalProps) {
  return (
    <Modal open={!!payment} onClose={onClose} title="Detalle del movimiento">
      <div className="space-y-5 sm:space-y-6">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={payment.type === 'ingreso' ? 'success' : 'danger'}>
                  {payment.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </Badge>
                {payment.payment_kind && (
                  <Badge variant="default">
                    {PAYMENT_KIND_LABELS[payment.payment_kind]}
                  </Badge>
                )}
                {payment.payment_method && (
                  <Badge variant="default">
                    {PAYMENT_METHOD_LABELS[payment.payment_method]}
                  </Badge>
                )}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900 break-words">
                {payment.concept}
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                {formatDate(payment.date)} ·{' '}
                {payment.type === 'ingreso' ? 'Entrada de dinero' : 'Salida de dinero'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className={`text-2xl font-bold tabular-nums ${
                  payment.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {payment.type === 'ingreso' ? '+' : '-'}
                {formatCurrency(payment.amount)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {payment.paid ? 'Registrado' : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {client && (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-violet-700">
                  <UserRound className="size-4" aria-hidden="true" />
                  <p className="text-sm font-semibold">Clienta relacionada</p>
                </div>
                <p className="mt-2 text-base font-medium text-zinc-900">{client.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {client.phone || client.instagram || client.email || 'Sin contacto'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onGoToClient} className="shrink-0">
                Ver clienta<ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {appointment && (
          <div className="rounded-2xl border border-salon-100 bg-salon-50/60 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-salon-700">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  <p className="text-sm font-semibold">Cita relacionada</p>
                </div>
                <p className="mt-2 text-base font-medium text-zinc-900">{appointment.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formatDate(appointment.start_time)} ·{' '}
                  {formatTime(appointment.start_time)}
                  {appointment.end_time
                    ? ` - ${formatTime(appointment.end_time)}`
                    : ''}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onGoToAppointment} className="shrink-0">
                Ver cita<ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white p-3 border border-salon-100">
                <p className="text-xs text-zinc-400">Estado</p>
                <p className="font-medium text-zinc-900">
                  {APPOINTMENT_STATUS_LABELS[
                    appointment.status as keyof typeof APPOINTMENT_STATUS_LABELS
                  ] || appointment.status}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-salon-100">
                <p className="text-xs text-zinc-400">Total cita</p>
                <p className="font-medium text-zinc-900">
                  {formatCurrency(appointment.total_price || 0)}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-salon-100">
                <p className="text-xs text-zinc-400">Pagado</p>
                <p className="font-medium text-zinc-900">
                  {formatCurrency(
                    appointment.appointment_balance?.total_paid || 0
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-salon-100">
                <p className="text-xs text-zinc-400">Saldo</p>
                <p className="font-medium text-zinc-900">
                  {formatCurrency(
                    appointment.appointment_balance?.pending_balance || 0
                  )}
                </p>
              </div>
            </div>
            {appointment.appointment_services?.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <ClipboardList className="size-3.5" aria-hidden="true" />
                  Servicios
                </p>
                <div className="space-y-1.5">
                  {appointment.appointment_services.map(
                    (as: { service_id?: string; id?: string; service?: { name: string; price?: number } | null; artist?: { name: string } | null; service_price?: number | null }) => (
                      <div
                        key={as.service_id || as.id}
                        className="flex items-center justify-between rounded-xl bg-white border border-salon-100 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 truncate">
                            {as.service?.name}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            {as.artist?.name || 'Sin artista'}
                          </p>
                        </div>
                        <span className="font-semibold text-zinc-700 flex-shrink-0">
                          {formatCurrency(
                            Number(as.service_price ?? as.service?.price) || 0
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!appointment && !client && (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 flex items-center gap-2">
            <Link2 className="size-4 text-zinc-400" aria-hidden="true" />
            Este movimiento no está vinculado a una cita o clienta.
          </div>
        )}

        <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 mt-2 border-t border-zinc-100">
          <div className="hidden sm:block flex-1" />
          <div className="flex flex-1 sm:flex-none gap-2 order-first sm:order-none">
            <div className="flex-1 hidden sm:block">
              <Button type="button" variant="outline" className="w-full" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
