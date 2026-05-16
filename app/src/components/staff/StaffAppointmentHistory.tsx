'use client';

import { memo } from 'react';
import type { StaffAppointmentHistoryProps } from './types';
import type { AppointmentStatus } from '@/types/database';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, UserRound } from 'lucide-react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'default';

const APPOINTMENT_BADGE: Record<AppointmentStatus, BadgeVariant> = {
  completada: 'success',
  cancelada: 'danger',
  no_show: 'warning',
  programada: 'default',
  en_curso: 'warning',
};

const APPOINTMENT_LABELS: Record<AppointmentStatus, string> = {
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_show: 'No show',
  programada: 'Programada',
  en_curso: 'En curso',
};

export const StaffAppointmentHistory = memo(function StaffAppointmentHistory({ appointments }: StaffAppointmentHistoryProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="size-4 text-salon-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-zinc-700">Historial de citas</p>
          {appointments.length > 0 && (
            <span className="text-xs text-zinc-400 ml-auto">{appointments.length} citas</span>
          )}
        </div>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="size-8 mx-auto text-zinc-300 mb-2" aria-hidden="true" />
            <p className="text-sm text-zinc-400">Sin citas en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-400 border-b border-zinc-100">
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Clienta</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Servicios</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-zinc-900">{formatDate(appt.start_time)}</p>
                      <p className="text-xs text-zinc-400">{formatTime(appt.start_time)}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <UserRound className="size-3.5 text-zinc-400" aria-hidden="true" />
                        <span className="truncate max-w-[120px] text-zinc-900">{appt.client?.name || 'Sin clienta'}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {appt.appointment_services?.slice(0, 2).map((s, si) => (
                          <Badge key={`${s.service_id}-${si}`} variant="default" className="text-[10px]">
                            {s.service?.name || 'Servicio'}
                          </Badge>
                        ))}
                        {appt.appointment_services && appt.appointment_services.length > 2 && (
                          <Badge variant="default" className="text-[10px]">+{appt.appointment_services.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium text-zinc-900">{formatCurrency(appt.total_price || 0)}</td>
                    <td className="py-3 text-right">
                      <Badge variant={APPOINTMENT_BADGE[appt.status] || 'default'} className="text-[10px]">
                        {APPOINTMENT_LABELS[appt.status] || appt.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});
