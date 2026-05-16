'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown, Star, Briefcase, Sparkles, Clock } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS, PAYMENT_CATEGORY_LABELS } from '@/types/database';
import type { MonthlyReport as MonthlyReportType } from './types';

interface Props {
  report: MonthlyReportType | null;
  loading: boolean;
}

export function MonthlyReport({ report, loading }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-salon-50 flex items-center justify-center">
            <CalendarDays className="size-4 text-salon-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Reporte del mes</h2>
            <p className="text-xs text-zinc-400">Citas, ingresos y métricas del negocio</p>
          </div>
        </div>
        <ChevronDown className={cn('size-5 text-zinc-400 transition-transform', expanded && 'rotate-180')} />
      </button>

      {/* Mini-metrics always visible */}
      {report && (
        <div className={cn('px-6 pb-4', expanded ? 'border-b border-zinc-50' : '')}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl bg-salon-50 border border-salon-100 p-3 text-center">
              <p className="text-xl font-bold text-salon-600">{report.completedAppointments}</p>
              <p className="text-xs text-zinc-500">Citas completadas</p>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
              <p className="text-xl font-bold text-green-600">{formatCurrency(report.totalIncome)}</p>
              <p className="text-xs text-zinc-500">Ingresos</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
              <p className="text-xl font-bold text-red-600">{formatCurrency(report.totalExpenses)}</p>
              <p className="text-xs text-zinc-500">Egresos</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(report.netProfit)}</p>
              <p className="text-xs text-zinc-500">Ganancia neta</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500 mt-3">
            <span><Sparkles className="size-3 inline mr-1 text-emerald-500" />{report.newClients?.length || 0} nuevas clientas</span>
            <span><Clock className="size-3 inline mr-1 text-amber-500" />{report.inactiveClients?.length || 0} por reactivar</span>
          </div>
        </div>
      )}

      {expanded && (
        <div className="px-6 pb-6">
          {loading ? (
            <div className="space-y-3 pt-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={"stat-" + i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}
              </div>
            </div>
          ) : report ? (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.topServices?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Star className="size-3.5 text-amber-500" /> Top servicios
                    </p>
                    <div className="space-y-1">
                      {report.topServices.slice(0, 3).map((svc, i) => (
                        <div key={svc.service_id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-zinc-50 transition-colors">
                          <span className="text-zinc-400 text-xs w-5">{i + 1}</span>
                          <span className="flex-1 truncate">{svc.name}</span>
                          <span className="font-medium text-zinc-700 ml-2">{svc.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {report.topArtists?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Briefcase className="size-3.5 text-accent-500" /> Top artistas
                    </p>
                    <div className="space-y-1">
                      {report.topArtists.slice(0, 3).map((a, i) => (
                        <div key={a.artist_id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-zinc-50 transition-colors">
                          <span className="text-zinc-400 text-xs w-5">{i + 1}</span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="size-6 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 text-xs font-bold flex-shrink-0">
                              {a.artist_name[0]?.toUpperCase()}
                            </div>
                            <span className="truncate">{a.artist_name}</span>
                          </div>
                          <span className="font-medium text-zinc-700 ml-2">{formatCurrency(a.totalRevenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-4">No hay datos para este mes</p>
          )}

          {/* Breakdowns: Income by method + Expenses by category */}
          {report && (report.incomeByMethod?.length || report.expensesByCategory?.length) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 mt-4">
              {report.incomeByMethod && report.incomeByMethod.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Ingresos por método
                  </p>
                  <div className="space-y-2">
                    {report.incomeByMethod.map((item) => {
                      const pct = report.totalIncome > 0 ? Math.round((item.total / report.totalIncome) * 100) : 0;
                      return (
                        <div key={item.method} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-zinc-700">
                              {PAYMENT_METHOD_LABELS[item.method as keyof typeof PAYMENT_METHOD_LABELS] || item.method}
                            </span>
                            <span className="font-semibold text-zinc-700 tabular-nums">{formatCurrency(item.total)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {report.expensesByCategory && report.expensesByCategory.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Gastos por categoría
                  </p>
                  <div className="space-y-2">
                    {report.expensesByCategory.map((item) => {
                      const pct = report.totalExpenses > 0 ? Math.round((item.total / report.totalExpenses) * 100) : 0;
                      return (
                        <div key={item.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-zinc-700">
                              {PAYMENT_CATEGORY_LABELS[item.category as keyof typeof PAYMENT_CATEGORY_LABELS] || item.category}
                            </span>
                            <span className="font-semibold text-zinc-700 tabular-nums">{formatCurrency(item.total)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
