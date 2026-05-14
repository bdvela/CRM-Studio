'use client';

import { memo } from 'react';
import type { AppointmentDetailServicesProps } from './types-detail';
import { formatCurrency } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';

export const AppointmentDetailServices = memo(function AppointmentDetailServices({ appointment, onGoToStaff }: AppointmentDetailServicesProps) {
  const services = appointment.appointment_services;

  if (!services || services.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
          <ClipboardList className="size-4 text-zinc-400" aria-hidden="true" />
          Servicios
        </h3>
        <div className="space-y-3">
          {services.map((as) => (
            <div
              key={as.service_id || as.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg shrink-0" aria-hidden="true">
                  {as.service?.category?.icon || '📋'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {as.service?.name}
                  </p>
                  {as.artist?.name && (
                    <button
                      onClick={() => as.artist_id && onGoToStaff?.(as.artist_id)}
                      className="text-xs text-zinc-400 truncate hover:text-salon-600 transition-colors cursor-pointer text-left"
                      title="Ver perfil del artista"
                    >
                      {as.artist.name}
                    </button>
                  )}
                </div>
              </div>
              <span className="text-sm font-semibold text-zinc-700 tabular-nums flex-shrink-0 ml-3">
                {formatCurrency(Number(as.service_price ?? as.service?.price) || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
