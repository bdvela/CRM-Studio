'use client';

import { CalendarDays, Users, DollarSign, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const actions = [
  { label: 'Nueva cita', icon: CalendarDays, href: '/citas', color: 'salon' as const },
  { label: 'Nueva clienta', icon: Users, href: '/clientes', color: 'accent' as const },
  { label: 'Registrar pago', icon: DollarSign, href: '/pagos', color: 'green' as const },
];

const colorClasses = {
  salon: 'bg-salon-50 text-salon-600',
  accent: 'bg-violet-50 text-violet-600',
  green: 'bg-emerald-50 text-emerald-600',
};

export function QuickActions() {
  const { push } = useRouter();

  return (
    <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-50">
        <h2 className="text-base font-semibold text-zinc-900">Acciones rápidas</h2>
      </div>
      <div className="p-4 space-y-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => push(action.href)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors group text-left"
          >
            <div className={`size-9 rounded-lg flex items-center justify-center ${colorClasses[action.color]}`}>
              <action.icon className="size-4" />
            </div>
            <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">
              {action.label}
            </span>
            <ArrowRight className="size-4 ml-auto text-zinc-300 group-hover:text-zinc-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
