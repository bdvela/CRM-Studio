'use client';

import { useEffect, useState } from 'react';
import { getDashboardMetrics, getAppointments } from '@/lib/db/queries';
import { Header } from '@/components/layout/shell';
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

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadMetrics() {
    setLoading(true);
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMetrics(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-salon-500 to-accent-600 animate-pulse" />
          <p className="text-sm text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <>
      <Header
        title="Dashboard"
        action={
          <button onClick={loadMetrics} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        }
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-salon-600 via-salon-700 to-accent-800 p-6 md:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-salon-200" />
              <span className="text-sm font-medium text-salon-200">Bienvenida al CRM</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Tu salón, organizado ✨</h2>
            <p className="text-salon-200 mt-2 text-sm md:text-base max-w-lg">
              Gestiona clientas, citas, servicios y finanzas desde un solo lugar. Todo conectado.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-gray-900">{formatCurrency(metrics.monthIncome)}</p>
            <p className="text-sm text-gray-500 mt-1">Ingresos del mes</p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-gray-900">{formatCurrency(metrics.monthExpenses)}</p>
            <p className="text-sm text-gray-500 mt-1">Gastos del mes</p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-salon-500 to-accent-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-gray-900">{formatCurrency(metrics.netProfit)}</p>
            <p className="text-sm text-gray-500 mt-1">Ganancia neta</p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-gray-900">{metrics.activeClients}</p>
            <p className="text-sm text-gray-500 mt-1">Clientas activas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-salon-50 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-salon-600" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">Citas de hoy</h2>
                </div>
                <button
                  onClick={() => router.push('/citas')}
                  className="text-sm text-salon-600 hover:text-salon-700 font-medium flex items-center gap-1"
                >
                  Ver todas <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                {metrics.todayAppointments.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <CalendarDays className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400">No hay citas para hoy</p>
                    <button
                      onClick={() => router.push('/citas')}
                      className="mt-3 text-sm text-salon-600 font-medium hover:text-salon-700"
                    >
                      + Agendar nueva cita
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {metrics.todayAppointments.map((appt: any) => (
                      <div
                        key={appt.id}
                        onClick={() => router.push(`/citas`)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <div className="text-center w-14 flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{formatTime(appt.start_time)}</p>
                          <p className="text-xs text-gray-400">{appt.total_duration_min} min</p>
                        </div>
                        <div className="w-px h-10 bg-gray-100" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(appt.client?.name || '?')} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {(appt.client?.name || '?')[0].toUpperCase()}
                            </div>
                            <p className="font-medium text-sm truncate">{appt.client?.name || 'Sin clienta'}</p>
                          </div>
                          <p className="text-xs text-gray-400 ml-9 mt-0.5">
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

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="text-base font-semibold text-gray-900">Acciones rápidas</h2>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: 'Nueva cita', icon: CalendarDays, href: '/citas', color: 'salon' },
                  { label: 'Nueva clienta', icon: Users, href: '/clientes', color: 'accent' },
                  { label: 'Registrar pago', icon: DollarSign, href: '/pagos', color: 'green' },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      action.color === 'salon' ? 'bg-salon-50 text-salon-600' :
                      action.color === 'accent' ? 'bg-violet-50 text-violet-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    <ArrowRight className="w-4 h-4 ml-auto text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Pending Payments */}
            {metrics.pendingPayments.length > 0 && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">Pendientes de pago</h2>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {metrics.pendingPayments.slice(0, 3).map((appt: any) => (
                    <div key={appt.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{appt.client?.name || 'Sin clienta'}</p>
                        <p className="text-xs text-gray-400">{appt.title}</p>
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
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(c.name || '?')} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
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
