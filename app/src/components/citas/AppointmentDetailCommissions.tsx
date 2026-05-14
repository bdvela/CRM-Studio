'use client';

import { useMemo, memo } from 'react';
import type { AppointmentDetailCommissionsProps } from './types-detail';
import { formatCurrency } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

export const AppointmentDetailCommissions = memo(function AppointmentDetailCommissions({ appointment }: AppointmentDetailCommissionsProps) {
  const { rows, artistTotal, founderTotal, grandTotal } = useMemo(() => {
    const services = appointment.appointment_services || [];
    let artTotal = 0;
    let foundTotal = 0;
    const rows = services.map((as) => {
      const cd = as.commission_detail;
      if (!cd) {
        const price = Number(as.service_price ?? as.service?.price ?? 0);
        return {
          serviceName: as.service?.name || 'Servicio',
          categoryIcon: as.service?.category?.icon || '📋',
          artist: as.artist?.name || null,
          isFounder: false,
          artistCommission: 0,
          founderShare: price,
          hasDetails: false,
        };
      }
      const isFounder = cd.artist_role_name === 'Dueña' || cd.artist_role_name === 'Founder';
      const aCom = isFounder ? 0 : Number(cd.artist_commission || 0);
      const fShare = Number(cd.founder_share || 0);
      artTotal += aCom;
      foundTotal += fShare;
      return {
        serviceName: cd.service_name || as.service?.name || 'Servicio',
        categoryIcon: as.service?.category?.icon || '📋',
        artist: cd.artist_name || as.artist?.name || null,
        isFounder,
        artistCommission: aCom,
        founderShare: fShare,
        hasDetails: true,
      };
    });
    return { rows, artistTotal: artTotal, founderTotal: foundTotal, grandTotal: artTotal + foundTotal };
  }, [appointment.appointment_services]);

  if (rows.length === 0) return null;

  const hasCommissions = rows.some(r => r.hasDetails);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2">
          <DollarSign className="size-4 text-zinc-400" aria-hidden="true" />
          Comisiones
        </h3>
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-sm shrink-0" aria-hidden="true">{row.categoryIcon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{row.serviceName}</p>
                  {row.artist && (
                    <p className="text-xs text-zinc-400 truncate">{row.artist}</p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3 min-w-[100px]">
                {row.hasDetails ? (
                  <>
                    {row.artistCommission > 0 && (
                      <p className="text-xs">
                        <span className="text-emerald-600 font-semibold">{formatCurrency(row.artistCommission)}</span>
                        <span className="text-zinc-300 ml-1">artista</span>
                      </p>
                    )}
                    {row.founderShare > 0 && (
                      <p className="text-xs">
                        <span className="text-salon-600 font-semibold">{formatCurrency(row.founderShare)}</span>
                        <span className="text-zinc-300 ml-1">founder</span>
                      </p>
                    )}
                    {row.isFounder && (
                      <p className="text-xs text-amber-600 font-medium">100% founder</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-zinc-400">Sin comisión</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasCommissions && (
          <div className="mt-4 pt-3 border-t border-zinc-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs text-zinc-400 font-medium">Totales</span>
              <div className="flex items-center gap-4">
                {artistTotal > 0 && (
                  <span className="text-xs">
                    <span className="text-emerald-600 font-semibold">{formatCurrency(artistTotal)}</span>
                    <span className="text-zinc-400 ml-1">artistas</span>
                  </span>
                )}
                {founderTotal > 0 && (
                  <span className="text-xs">
                    <span className="text-salon-600 font-semibold">{formatCurrency(founderTotal)}</span>
                    <span className="text-zinc-400 ml-1">founder</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
