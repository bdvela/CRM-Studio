'use client';

import { memo } from 'react';
import type { ClientAppointmentHistoryProps } from './types';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { APPT_STATUS_STYLES } from './constants';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';

export const ClientAppointmentHistory = memo(function ClientAppointmentHistory({ appointments, maxItems }: ClientAppointmentHistoryProps) {
  const items = maxItems ? appointments.slice(0, maxItems) : appointments;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4">Historial de citas</h3>
          <div className="text-center py-8">
            <CalendarDays className="size-8 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-400">Sin citas registradas</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-700 mb-4">
          {maxItems ? 'Últimas citas' : 'Historial de citas'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-400 border-b border-zinc-100">
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium hidden sm:table-cell">Servicios</th>
                <th className="pb-2 font-medium text-right">Total</th>
                <th className="pb-2 font-medium text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((appt) => (
                <tr key={appt.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-zinc-900">{formatDate(appt.start_time)}</p>
                    <p className="text-xs text-zinc-400">{formatTime(appt.start_time)}</p>
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {appt.appointment_services?.slice(0, 2).map((s) => (
                        <Badge key={s.service_id} variant="default" className="text-[10px]">{s.service?.name}</Badge>
                      ))}
                      {appt.appointment_services && appt.appointment_services.length > 2 && (
                        <Badge variant="default" className="text-[10px]">+{appt.appointment_services.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium text-zinc-900">{formatCurrency(appt.total_price || 0)}</td>
                  <td className="py-3 text-right">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${APPT_STATUS_STYLES[appt.status] || ''}`}>
                      {APPOINTMENT_STATUS_LABELS[appt.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
