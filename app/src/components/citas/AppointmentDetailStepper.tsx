'use client';

import { memo, Fragment } from 'react';
import type { AppointmentDetailStepperProps } from './types-detail';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = ['programada', 'en_curso', 'completada'] as const;

export const AppointmentDetailStepper = memo(function AppointmentDetailStepper({ status }: AppointmentDetailStepperProps) {
  if (status === 'cancelada' || status === 'no_show') return null;

  const currentIdx = STEPS.indexOf(status as typeof STEPS[number]);
  const isAllCompleted = status === 'completada';

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const isDone = i < currentIdx || (isAllCompleted && i === currentIdx);
            const isActive = i === currentIdx && !isAllCompleted;

            return (
            <Fragment key={s}>
              <div className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                isDone ? 'text-emerald-600' : isActive ? 'text-salon-600' : 'text-zinc-300'
              )}>
                <div className={cn(
                  'size-6 rounded-full flex items-center justify-center',
                  isDone ? 'bg-emerald-100' : isActive ? 'bg-salon-100' : 'bg-zinc-100'
                )}>
                  {isDone || isAllCompleted
                    ? <Check className="size-3.5" aria-hidden="true" />
                    : <span className="text-xs">{i + 1}</span>
                  }
                </div>
                <span className="text-sm font-medium">{APPOINTMENT_STATUS_LABELS[s]}</span>
              </div>
              {i < 2 && (
                <div className={cn('flex-1 h-0.5 rounded-full', isDone ? 'bg-emerald-300' : 'bg-zinc-200')} />
              )}
            </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
});
