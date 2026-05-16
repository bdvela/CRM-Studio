'use client';

import { memo } from 'react';
import type { ClientCardProps } from './types';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, STATUS_BORDER_COLOR } from './constants';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Phone, Instagram } from 'lucide-react';

export const ClientCard = memo(function ClientCard({ client, onClick }: ClientCardProps) {
  const borderColor = STATUS_BORDER_COLOR[client.status];

  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-salon-300 transition-shadow transition-colors active:scale-[0.97] border-l-4 ${borderColor}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalle de ${client.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-4">
        <div
          className="size-10 sm:size-12 rounded-full bg-gradient-to-br from-salon-500/90 via-salon-400/50 to-salon-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm shadow-salon-500/20"
          aria-label={`Inicial de ${client.name}`}
          role="img"
        >
          {client.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium truncate text-sm sm:text-base text-zinc-900">{client.name}</p>
            <Badge variant={STATUS_BADGE_VARIANT[client.status]} className="flex-shrink-0 text-[10px] sm:text-xs">
              {STATUS_LABELS[client.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-400 mt-1">
            {client.phone && (
              <span className="flex items-center gap-1 break-all"><Phone className="size-3 flex-shrink-0" />{client.phone}</span>
            )}
            {client.instagram && (
              <span className="flex items-center gap-1 break-all"><Instagram className="size-3 flex-shrink-0" />{client.instagram}</span>
            )}
          </div>
        </div>
        <div className="text-right hidden sm:block flex-shrink-0">
          {client.client_stats && (
            <>
              <p className="text-sm font-semibold text-zinc-900">{formatCurrency(client.client_stats.total_spent)}</p>
              <p className="text-xs text-zinc-400">{client.client_stats.total_appointments} citas</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
