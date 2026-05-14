'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStaffById,
  getStaffPerformance,
  getStaffTopServices,
  getStaffAppointments,
} from '@/lib/db/queries';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime, startOfMonth } from '@/lib/utils';
import {
  ArrowLeft,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Briefcase,
  Clock,
  UserRound,
  Star,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

type Period = '7d' | '30d' | '90d' | 'custom';

function getDateRange(period: Period): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (period === '7d') from.setDate(from.getDate() - 7);
  else if (period === '30d') from.setDate(from.getDate() - 30);
  else if (period === '90d') from.setDate(from.getDate() - 90);
  else from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export default function StaffDetailClient({
  staffId,
  initialMember,
}: {
  staffId: string;
  initialMember: any;
}) {
  const { push } = useRouter();
  const [member, setMember] = useState<any>(initialMember);
  const [loading, setLoading] = useState(!initialMember);
  const [performance, setPerformance] = useState<any>(null);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>('30d');
  const [loadingPerf, setLoadingPerf] = useState(false);

  const loadStaff = useCallback(async () => {
    if (initialMember) return;
    setLoading(true);
    try {
      const m = await getStaffById(staffId);
      setMember(m);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [staffId, initialMember]);

  const loadPerformance = useCallback(async () => {
    setLoadingPerf(true);
    try {
      const range = getDateRange(period);
      const [perf, svc, appts] = await Promise.all([
        getStaffPerformance(staffId, range.from, range.to),
        getStaffTopServices(staffId, range.from, range.to),
        getStaffAppointments(staffId, range.from, range.to),
      ]);
      setPerformance(perf);
      setTopServices(svc as any[]);
      setAppointments(appts as any[]);
    } catch {
      // silent
    } finally {
      setLoadingPerf(false);
    }
  }, [staffId, period]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadStaff(); }, [loadStaff]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (member) loadPerformance(); }, [member, loadPerformance]);

  if (loading) {
    return (
      <>
        <Header title="Staff" />
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-2xl bg-zinc-100 animate-pulse" />)}
        </div>
      </>
    );
  }

  if (!member) {
    return (
      <>
        <Header title="Staff" />
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-16 text-center">
              <AlertCircle className="size-12 mx-auto mb-3 text-zinc-300" />
              <p className="text-zinc-500">Staff no encontrado</p>
              <Button variant="outline" className="mt-4" onClick={() => push('/staff')}>
                Volver a Staff
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const isOwner = member.role?.name === 'Dueña' || member.role?.name === 'Founder';

  return (
    <>
      <Header
        title={member.name}
        action={
          <Button size="sm" variant="outline" onClick={() => push('/staff')}>
            <ArrowLeft className="size-4 mr-1" /> Volver
          </Button>
        }
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-start gap-5">
              <div className={`size-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 ${
                isOwner ? 'bg-amber-100 text-amber-600' : 'bg-accent-100 text-accent-600'
              }`}>
                {member.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-zinc-900">{member.name}</h1>
                  <Badge variant="custom" color={member.role?.color || '#6B7280'}>
                    {member.role?.name || 'Sin rol'}
                  </Badge>
                  {!member.active && <Badge variant="danger">Inactivo</Badge>}
                  {isOwner && (
                    <Badge variant="custom" color="#F59E0B">Founder</Badge>
                  )}
                </div>
                {member.phone && (
                  <p className="text-sm text-zinc-500 mt-2">{member.phone}</p>
                )}
                {member.staff_specialties && member.staff_specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {member.staff_specialties.map((spec: any) => (
                      <Badge key={spec.id || spec.category_id} variant="custom" color={spec.category?.color || '#6B7280'} className="text-xs">
                        {spec.category?.icon || ''} {spec.category?.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500">
                  <span>{member.staff_stats?.total_appointments || 0} citas totales</span>
                  <span>{formatCurrency(member.staff_stats?.total_revenue || 0)} facturado</span>
                  <span className="font-medium text-accent-600">{member.commission_pct}% comisión</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => push(`/reportes/comisiones`)}>
                  <ExternalLink className="size-4 mr-1" /> Comisiones
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Período:</span>
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  period === p ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>

        {/* Performance Stats */}
        {loadingPerf ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />)}
          </div>
        ) : performance ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-salon-100 flex items-center justify-center">
                    <CalendarDays className="size-5 text-salon-600" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Citas completadas</p>
                    <p className="text-lg font-bold text-zinc-900">{performance.totalAppointments}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Ingreso generado</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(performance.totalRevenue)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-accent-100 flex items-center justify-center">
                    <TrendingUp className="size-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Comisión artista</p>
                    <p className="text-lg font-bold text-accent-600">{formatCurrency(performance.totalCommission)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Clock className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Última cita</p>
                    <p className="text-lg font-bold text-zinc-900 text-sm truncate">
                      {performance.lastAppointmentDate ? formatDate(performance.lastAppointmentDate) : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribution Bar */}
            {performance.totalRevenue > 0 && (
              <Card>
                <CardContent className="py-4">
                  <p className="text-sm font-medium text-zinc-700 mb-3">Distribución de ingresos</p>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                    <span>Artista: {formatCurrency(performance.totalCommission)} ({Math.round((performance.totalCommission / performance.totalRevenue) * 100)}%)</span>
                    <span>Founder: {formatCurrency(performance.totalFounderShare)} ({Math.round((performance.totalFounderShare / performance.totalRevenue) * 100)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-500 rounded-full transition-all"
                      style={{ width: `${Math.round((performance.totalCommission / performance.totalRevenue) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Services */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="size-4 text-amber-500" />
                    <p className="text-sm font-semibold text-zinc-700">Servicios más realizados</p>
                  </div>
                  {topServices.length === 0 ? (
                    <p className="text-sm text-zinc-400 text-center py-6">Sin servicios en este período</p>
                  ) : (
                    <div className="space-y-2">
                      {topServices.map((svc: any, idx: number) => (
                        <div key={svc.service_id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-bold text-zinc-300 w-5">{idx + 1}</span>
                            <span className="text-sm font-medium truncate">{svc.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-zinc-500 flex-shrink-0">
                            <span>{svc.count}x</span>
                            <span className="font-medium text-zinc-700">{formatCurrency(svc.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="size-4 text-salon-600" />
                    <p className="text-sm font-semibold text-zinc-700">Resumen rápido</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                      <span className="text-sm text-zinc-600">Comisión</span>
                      <span className="text-sm font-semibold text-accent-600">{member.commission_pct}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                      <span className="text-sm text-zinc-600">Especialidades</span>
                      <span className="text-sm font-semibold text-zinc-900">{member.staff_specialties?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                      <span className="text-sm text-zinc-600">Rol</span>
                      <span className="text-sm font-semibold text-zinc-900">{member.role?.name || 'Sin rol'}</span>
                    </div>
                    {member.schedule && (
                      <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                        <span className="text-sm text-zinc-600">Horario</span>
                        <span className="text-sm font-semibold text-zinc-900">{member.schedule}</span>
                      </div>
                    )}
                    {member.staff_stats?.last_appointment && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-zinc-600">Última cita (total)</span>
                        <span className="text-sm font-semibold text-zinc-900">{formatDate(member.staff_stats.last_appointment)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appointment History */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="size-4 text-salon-600" />
                  <p className="text-sm font-semibold text-zinc-700">Historial de citas</p>
                  {appointments.length > 0 && (
                    <span className="text-xs text-zinc-400 ml-auto">{appointments.length} citas</span>
                  )}
                </div>
                {appointments.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-6">Sin citas en este período</p>
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
                        {appointments.map((appt: any) => (
                          <tr key={appt.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                            <td className="py-3 pr-4">
                              <p className="font-medium text-zinc-900">{formatDate(appt.start_time)}</p>
                              <p className="text-xs text-zinc-400">{formatTime(appt.start_time)}</p>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <UserRound className="size-3.5 text-zinc-400" />
                                <span className="truncate max-w-[120px]">{appt.client?.name || 'Sin clienta'}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 hidden sm:table-cell">
                              <div className="flex flex-wrap gap-1">
                                {appt.appointment_services?.slice(0, 2).map((s: any) => (
                                  <Badge key={s.service_id} variant="default" className="text-[10px]">
                                    {s.service?.name || 'Servicio'}
                                  </Badge>
                                ))}
                                {appt.appointment_services?.length > 2 && (
                                  <Badge variant="default" className="text-[10px]">+{appt.appointment_services.length - 2}</Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right font-medium">{formatCurrency(appt.total_price || 0)}</td>
                            <td className="py-3 text-right">
                              <Badge variant={
                                appt.status === 'completada' ? 'success' :
                                appt.status === 'cancelada' ? 'danger' :
                                appt.status === 'no_show' ? 'warning' : 'default'
                              } className="text-[10px]">
                                {appt.status === 'completada' ? 'Completada' :
                                 appt.status === 'cancelada' ? 'Cancelada' :
                                 appt.status === 'no_show' ? 'No show' :
                                 appt.status === 'en_curso' ? 'En curso' : 'Programada'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-zinc-400">
              <CalendarDays className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin datos de rendimiento para este período</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
