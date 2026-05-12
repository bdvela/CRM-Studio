'use client';

import { useEffect, useState } from 'react';
import { getDashboardMetrics, getAppointments } from '@/lib/db/queries';
import { Header } from '@/components/layout/shell';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatTime } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import {
  CalendarDays, Users, DollarSign, TrendingUp, TrendingDown,
  ArrowRight, RefreshCw, Clock, Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const statusColors: Record<string, string> = {
  programada: 'bg-blue-50 text-blue-700 border-blue-200',
  en_curso: 'bg-amber-50 text-amber-700 border-amber-200',
  completada: 'bg-green-50 text-green-700 border-green-200',
  cancelada: 'bg-red-50 text-red-700 border-red-200',
  no_show: 'bg-orange-50 text-orange-700 border-orange-200',
};

const avatarColors = [
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function StatCard({ icon: Icon, value, label, badge, iconBgClass, iconClass }: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  badge?: string;
  iconBgClass: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-zinc-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`size-10 rounded-xl flex items-center justify-center ${iconBgClass}`}>
          <Icon className={`size-5 ${iconClass}`} />
        </div>
        {badge && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
      <p className="text-sm text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

function TodayAppointments({ appointments, onNavigate }: { appointments: any[]; onNavigate: (path: string) => void }) {
  return (
    <div className="lg:col-span-2">
      <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-salon-50 flex items-center justify-center">
              <CalendarDays className="size-4 text-salon-600" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900">Citas de hoy</h2>
          </div>
          <button onClick={() => onNavigate('/citas')} className="text-sm text-salon-600 hover:text-salon-700 font-medium flex items-center gap-1">
            Ver todas <ArrowRight className="size-4" />
          </button>
        </div>

        <div className="p-4">
          {appointments.length === 0 ? (
            <div className="text-center py-10">
              <div className="size-14 rounded-2xl bg-zinc-50 flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="size-7 text-zinc-300" />
              </div>
              <p className="text-sm text-zinc-400">No hay citas para hoy</p>
              <button onClick={() => onNavigate('/citas')} className="mt-3 text-sm text-salon-600 font-medium hover:text-salon-700">
                + Agendar nueva cita
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((appt: any) => (
                <div
                  key={appt.id}
                  onClick={() => onNavigate('/citas')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate('/citas'); }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group"
                >
                  <div className="text-center w-14 flex-shrink-0">
                    <p className="text-sm font-bold text-zinc-900">{formatTime(appt.start_time)}</p>
                    <p className="text-xs text-zinc-400">{appt.total_duration_min} min</p>
                  </div>
                  <div className="w-px h-10 bg-zinc-100" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`size-7 rounded-full bg-gradient-to-br ${getAvatarColor(appt.client?.name || '?')} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {(appt.client?.name || '?')[0].toUpperCase()}
                      </div>
                      <p className="font-medium text-sm truncate">{appt.client?.name || 'Sin clienta'}</p>
                    </div>
                    <p className="text-xs text-zinc-400 ml-9 mt-0.5">
                      {appt.artist?.name || 'Sin artista'} · {appt.title}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[appt.status] || ''}`}>
                    {APPOINTMENT_STATUS_LABELS[appt.status as keyof typeof APPOINTMENT_STATUS_LABELS] || appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { push } = useRouter();
  const [metrics, setMetrics] = useState<any>(null);

  async function loadMetrics() {
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { loadMetrics(); }, []);

  if (!metrics) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-40 md:h-48 rounded-3xl w-full" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={`stat-${n}`} className="rounded-2xl bg-white border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="size-10 rounded-xl" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={`appt-${n}`} className="flex items-center gap-4 p-3 rounded-xl">
                    <div className="text-center w-14 flex-shrink-0">
                      <Skeleton className="h-5 w-16 mx-auto mb-1" />
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                    <Skeleton className="w-px h-10 bg-zinc-100" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32 ml-9" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-50">
                  <Skeleton className="h-5 w-36" />
                </div>
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={`action-${n}`} className="flex items-center gap-3 p-3 rounded-xl">
                      <Skeleton className="size-9 rounded-lg" />
                      <Skeleton className="h-5 w-28 flex-1" />
                      <Skeleton className="size-4" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-50">
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="p-4 space-y-2">
                  {[1, 2].map((n) => (
                    <div key={`payment-${n}`} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-5 w-36 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-5 w-20 ml-3" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!metrics) return null;

  return (
    <>
      <Header
        title="Dashboard"
        action={
          <button onClick={loadMetrics} className="p-2 rounded-xl hover:bg-zinc-100 transition-colors">
            <RefreshCw className="size-5 text-zinc-500" />
          </button>
        }
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-salon-600 via-salon-700 to-accent-800 p-6 md:p-8 text-white">
          <div className="absolute top-0 right-0 size-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 size-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-5 text-salon-200" />
              <span className="text-sm font-medium text-salon-200">Bienvenida al CRM</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Tu salón, organizado ✨</h2>
            <p className="text-salon-200 mt-2 text-sm md:text-base max-w-lg">
              Gestiona clientas, citas, servicios y finanzas desde un solo lugar. Todo conectado.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} value={formatCurrency(metrics.monthIncome)} label="Ingresos del mes" badge="+12%" iconBgClass="bg-emerald-50" iconClass="text-emerald-600" />
          <StatCard icon={TrendingDown} value={formatCurrency(metrics.monthExpenses)} label="Gastos del mes" iconBgClass="bg-red-50" iconClass="text-red-600" />
          <StatCard icon={TrendingUp} value={formatCurrency(metrics.netProfit)} label="Ganancia neta" iconBgClass="bg-gradient-to-br from-salon-500 to-accent-600" iconClass="text-white" />
          <StatCard icon={Users} value={metrics.activeClients} label="Clientas activas" iconBgClass="bg-violet-50" iconClass="text-violet-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TodayAppointments appointments={metrics.todayAppointments} onNavigate={(path) => push(path)} />

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-50">
                <h2 className="text-base font-semibold text-zinc-900">Acciones rápidas</h2>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: 'Nueva cita', icon: CalendarDays, href: '/citas', color: 'salon' },
                  { label: 'Nueva clienta', icon: Users, href: '/clientes', color: 'accent' },
                  { label: 'Registrar pago', icon: DollarSign, href: '/pagos', color: 'green' },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => push(action.href)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors group text-left"
                  >
                    <div className={`size-9 rounded-lg flex items-center justify-center ${
                      action.color === 'salon' ? 'bg-salon-50 text-salon-600' :
                      action.color === 'accent' ? 'bg-violet-50 text-violet-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      <action.icon className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">{action.label}</span>
                    <ArrowRight className="size-4 ml-auto text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Pending Payments */}
            {metrics.pendingPayments.length > 0 && (
              <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-50">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Clock className="size-4 text-amber-600" />
                    </div>
                    <h2 className="text-base font-semibold text-zinc-900">Pendientes de pago</h2>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {metrics.pendingPayments.slice(0, 3).map((appt: any) => (
                    <div key={appt.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{appt.client?.name || 'Sin clienta'}</p>
                        <p className="text-xs text-zinc-400">{appt.title}</p>
                      </div>
                      <p className="text-sm font-semibold text-amber-600 ml-3 flex-shrink-0">{formatCurrency(appt.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reactivation */}
            {metrics.toReactivates.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-salon-50 border border-violet-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-violet-100/50">
                  <h2 className="text-base font-semibold text-violet-900">Clientas por reactivar</h2>
                </div>
                <div className="p-4 space-y-2">
                  {metrics.toReactivates.slice(0, 3).map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 py-1.5">
                      <div className={`size-8 rounded-full bg-gradient-to-br ${getAvatarColor(c.name || '?')} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {(c.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-violet-900 truncate">{c.name}</p>
                        <p className="text-xs text-violet-600/70">{c.phone || c.instagram || 'Sin contacto'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
