'use client';

import { CalendarDays, DollarSign, UserRound, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ActivityItem } from './types';

interface Props {
  activities: ActivityItem[];
}

const activityConfig = {
  cita_creada: { icon: CalendarDays, color: 'bg-blue-50 text-blue-600' },
  pago_registrado: { icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
  cita_completada: { icon: Sparkles, color: 'bg-green-50 text-green-600' },
  clienta_nueva: { icon: UserRound, color: 'bg-violet-50 text-violet-600' },
};

export function RecentActivity({ activities }: Props) {
  const { push } = useRouter();
  if (activities.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-50">
        <h2 className="text-base font-semibold text-zinc-900">Actividad reciente</h2>
      </div>
      <div className="p-4 space-y-2">
        {activities.map((activity, idx) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;
          return (
            <div
              key={activity.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${activity.href ? 'hover:bg-zinc-50 cursor-pointer' : ''}`}
              onClick={() => activity.href ? push(activity.href) : undefined}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') push(activity.href || ''); }}
            >
              <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-700 truncate">{activity.description}</p>
                <p className="text-xs text-zinc-400" suppressHydrationWarning>
                  {`hace ${formatDistanceToNow(new Date(activity.timestamp), { locale: es })}`}
                </p>
              </div>
              {activity.href && (
                <ArrowRight className="size-3.5 text-zinc-300 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
