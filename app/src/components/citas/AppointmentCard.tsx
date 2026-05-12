'use client';

import { useEffect, useState } from 'react';
import type { AppointmentStatus } from '@/types/database';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { formatTime, cn, formatCurrency, isAppointmentPastOrCompleted } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AppointmentCardProps } from './types';

export function AppointmentCard({ appt, statusColors, onSelect }: AppointmentCardProps) {
  const [timeDisplay, setTimeDisplay] = useState('');
  useEffect(() => { setTimeDisplay(formatTime(appt.start_time)); }, [appt.start_time]);

  return (
    <Card
      key={appt.id}
      className={cn(
        "hover:border-salon-300 transition-all cursor-pointer overflow-hidden",
        isAppointmentPastOrCompleted(appt) && "opacity-50"
      )}
      onClick={() => onSelect(appt)}
    >
      <CardContent className="flex items-start gap-3 p-3 sm:items-center sm:gap-4 sm:py-3">
        <div className="flex items-center justify-between gap-3 sm:block sm:text-center sm:w-14 sm:flex-shrink-0">
          <div>
            <p className="text-base sm:text-sm font-bold text-zinc-900 leading-tight">{timeDisplay}</p>
            <p className="text-xs text-zinc-400">{appt.total_duration_min} min</p>
          </div>
        </div>
        <div className="hidden sm:block w-px h-10 bg-zinc-200" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-zinc-900 truncate">
              {appt.client?.name || 'Sin clienta'}
            </p>
          </div>
          {(() => {
            const names = [...new Set(appt.appointment_services?.map((as: any) => as.artist?.name).filter(Boolean))] as string[];
            if (names.length === 0) return null;
            return <p className="text-xs text-salon-600 truncate">{names.join(', ')}</p>;
          })()}
          {appt.appointment_services?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {appt.appointment_services.slice(0, 3).map((as: any) => (
                <Badge key={as.service_id || as.id} variant="default" className="text-[10px] max-w-full">
                  <span className="truncate">{as.service?.category?.icon} {as.service?.name}</span>
                </Badge>
              ))}
              {appt.appointment_services.length > 3 && (
                <Badge variant="default" className="text-[10px]">+{appt.appointment_services.length - 3}</Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end justify-between gap-1.5 sm:gap-2 text-right flex-shrink-0 min-w-[88px]">
          <p className="text-base sm:text-sm font-semibold text-zinc-900 tabular-nums leading-none whitespace-nowrap">
            {formatCurrency(appt.total_price)}
          </p>
          <Badge variant={statusColors[appt.status] || 'default'} className="text-[10px] sm:text-xs whitespace-nowrap">
            {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
