'use client';

import { memo } from 'react';
import type { AppointmentWithDetails } from './types';
import { formatCurrency, cn } from '@/lib/utils';
import { ClipboardList, Percent } from 'lucide-react';

interface Props {
  appointment: AppointmentWithDetails;
  onGoToStaff?: (staffId: string) => void;
}

export const AppointmentDetailServicesCommissions = memo(function AppointmentDetailServicesCommissions({ appointment, onGoToStaff }: Props) {
  const services = appointment.appointment_services || [];

  if (services.length === 0) return null;

  const commissions: Record<string, number> = {};
  let studioShare = 0;

  const rows = services.map((as) => {
    const price = Number(as.service_price ?? as.service?.price ?? 0);
    const cd = as.commission_detail;
    const isFounder = cd && (cd.artist_role_name === 'Dueña' || cd.artist_role_name === 'Founder');

    let artistCommission = 0;
    let rowStudioShare = 0;
    const artistName = as.artist?.name || '';

    if (cd) {
      artistCommission = Number(cd.artist_commission || 0);
      rowStudioShare = Number(cd.founder_share || 0);
      if (artistCommission > 0 && artistName) {
        commissions[artistName] = (commissions[artistName] || 0) + artistCommission;
      }
      studioShare += rowStudioShare;
    } else if (as.artist_id) {
      if (artistName) {
        commissions[artistName] = (commissions[artistName] || 0) + price;
      }
    } else {
      studioShare += price;
      rowStudioShare = price;
    }

    return {
      id: as.service_id || as.id || '',
      icon: as.service?.category?.icon || '📋',
      name: as.service?.name || 'Servicio',
      artistName: as.artist?.name || null,
      artistId: as.artist_id || null,
      price,
      studioShare: rowStudioShare,
      isFounder,
    };
  });

  const grandTotalPrice = rows.reduce((sum, r) => sum + r.price, 0);
  const totalCommissions = Object.values(commissions).reduce((sum, c) => sum + c, 0) + studioShare;

  return (
    <div className="space-y-4">
      {/* Servicios */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
            <ClipboardList className="size-4 text-zinc-400" aria-hidden="true" />
            Servicios
          </h3>

          <div className="hidden sm:grid grid-cols-[1fr_100px] gap-x-4 text-xs text-zinc-400 font-medium pb-2 border-b border-zinc-100">
            <span>Servicio</span>
            <span className="text-right">Precio</span>
          </div>

          <div className="space-y-0">
            {rows.map((row, i) => (
              <div
                key={row.id}
                className={cn(
                  'py-3 transition-colors',
                  i < rows.length - 1 && 'border-b border-zinc-50',
                  'sm:grid sm:grid-cols-[1fr_100px] sm:gap-x-4 sm:items-start',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-zinc-100" aria-hidden="true">
                    <span className="text-base">{row.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{row.name}</p>
                    {row.artistName ? (
                      <button
                        onClick={() => row.artistId && onGoToStaff?.(row.artistId)}
                        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer text-left truncate"
                      >
                        {row.artistName}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-300">Sin artista</span>
                    )}
                  </div>
                </div>

                <div className="hidden sm:block text-right self-center">
                  <span className="text-sm font-semibold text-zinc-700 tabular-nums">{formatCurrency(row.price)}</span>
                  {!row.isFounder && row.studioShare > 0 && (
                    <span className="block text-[11px] text-zinc-400">Studio: {formatCurrency(row.studioShare)}</span>
                  )}
                </div>

                <div className="sm:hidden ml-auto shrink-0 text-right">
                  <span className="text-sm font-semibold text-zinc-700 tabular-nums">{formatCurrency(row.price)}</span>
                  {!row.isFounder && row.studioShare > 0 && (
                    <span className="block text-[11px] text-zinc-400">Studio: {formatCurrency(row.studioShare)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">{services.length} servicio{services.length !== 1 ? 's' : ''}</p>
            <p className="text-xs">
              <span className="text-zinc-400">Total </span>
              <span className="text-zinc-900 font-semibold tabular-nums ml-1.5">{formatCurrency(grandTotalPrice)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Comisiones */}
      {totalCommissions > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
              <Percent className="size-4 text-zinc-400" aria-hidden="true" />
              Distribución de comisiones
            </h3>

            <div className="space-y-2">
              {Object.entries(commissions).map(([name, amount]) => {
                return (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 truncate">{name}</span>
                    <span className="text-sm font-semibold text-zinc-900 tabular-nums">{formatCurrency(amount)}</span>
                  </div>
                );
              })}
              {studioShare > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 truncate">Studio</span>
                  <span className="text-sm font-semibold text-zinc-900 tabular-nums">{formatCurrency(studioShare)}</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-medium">Total comisiones</span>
              <span className="text-sm font-semibold text-zinc-900 tabular-nums">{formatCurrency(totalCommissions)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
