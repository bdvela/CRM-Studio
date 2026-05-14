'use client';

import type { AppointmentDetailActionsProps } from './types-detail';
import { Button } from '@/components/ui/button';
import { Clock, Check, Pencil, XCircle, AlertTriangle } from 'lucide-react';

export function AppointmentDetailActions({
  appointment,
  onEdit,
  onCancel,
  onAdvanceStatus,
  onMarkAsNoShow,
}: AppointmentDetailActionsProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4 space-y-3">
        {appointment.status === 'programada' && (
          <>
            <Button
              className="w-full"
              size="lg"
              onClick={onAdvanceStatus}
            >
              <Clock className="size-4 mr-2" /> Iniciar cita
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="flex flex-col py-3 h-auto" onClick={onEdit}>
                <Pencil className="size-5 mb-1" aria-hidden="true" />
                <span className="text-xs">Editar</span>
              </Button>
              <Button variant="outline" className="flex flex-col py-3 h-auto border-red-200 text-red-600 hover:bg-red-50" onClick={onCancel}>
                <XCircle className="size-5 mb-1" aria-hidden="true" />
                <span className="text-xs">Cancelar</span>
              </Button>
              <Button variant="outline" className="flex flex-col py-3 h-auto" onClick={onMarkAsNoShow}>
                <AlertTriangle className="size-5 mb-1" aria-hidden="true" />
                <span className="text-xs">No Show</span>
              </Button>
            </div>
          </>
        )}

        {appointment.status === 'en_curso' && (
          <>
            <Button
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={onAdvanceStatus}
            >
              <Check className="size-4 mr-2" /> Completar cita
            </Button>
            <Button variant="outline" className="w-full" onClick={onEdit}>
              <Pencil className="size-4 mr-2" /> Editar
            </Button>
          </>
        )}

        {(appointment.status === 'completada' || appointment.status === 'cancelada' || appointment.status === 'no_show') && (
          <Button variant="outline" className="w-full" onClick={onEdit}>
            <Pencil className="size-4 mr-2" /> Editar
          </Button>
        )}
      </div>
    </div>
  );
}
