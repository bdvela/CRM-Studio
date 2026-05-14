'use client';

import { memo } from 'react';
import type { AppointmentDetailHeaderProps } from './types-detail';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowLeft, Phone, Instagram } from 'lucide-react';

const STATUS_BADGE: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
  programada: 'info',
  en_curso: 'warning',
  completada: 'success',
  cancelada: 'danger',
  no_show: 'danger',
};

export const AppointmentDetailHeader = memo(function AppointmentDetailHeader({ appointment, onBack, onEdit, onGoToClient }: AppointmentDetailHeaderProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <button
            onClick={() => appointment.client_id && onGoToClient(appointment.client_id)}
            className="size-16 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-2xl font-bold text-rose-600 flex-shrink-0 hover:from-rose-200 hover:to-purple-200 transition-colors cursor-pointer"
            aria-label={`Ir al perfil de ${appointment.client?.name || 'Sin clienta'}`}
            role="link"
            title="Ver perfil de clienta"
          >
            {(appointment.client?.name || 'S')[0].toUpperCase()}
          </button>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  onClick={() => appointment.client_id && onGoToClient(appointment.client_id)}
                  className="text-xl font-bold text-zinc-900 truncate block hover:text-salon-600 transition-colors text-left"
                  title="Ver perfil de clienta"
                >
                  {appointment.client?.name || 'Sin clienta'}
                </button>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={STATUS_BADGE[appointment.status] || 'default'}>
                    {APPOINTMENT_STATUS_LABELS[appointment.status]}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="size-4" />
                  <span className="hidden sm:inline ml-1">Editar</span>
                </Button>
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeft className="size-4" />
                  <span className="hidden sm:inline ml-1">Volver</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
              {appointment.client?.phone && (
                <a
                  href={`tel:${appointment.client.phone}`}
                  className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-salon-600 transition-colors"
                >
                  <Phone className="size-3.5" aria-hidden="true" />
                  {appointment.client.phone}
                </a>
              )}
              {appointment.client?.instagram && (
                <a
                  href={`https://instagram.com/${appointment.client.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-salon-600 transition-colors"
                >
                  <Instagram className="size-3.5" aria-hidden="true" />
                  {appointment.client.instagram}
                </a>
              )}
            </div>
            <p className="text-xl font-bold text-zinc-900 mt-3 tabular-nums">
              {formatCurrency(appointment.total_price)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
