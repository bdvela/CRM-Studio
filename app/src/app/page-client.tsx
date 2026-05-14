'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDashboardMetrics, onCacheRefresh, removeCacheRefresh } from '@/lib/db/queries';
import { Header } from '@/components/layout/shell';
import { ErrorBanner } from '@/components/ui/error-banner';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { TodayAppointments } from '@/components/dashboard/TodayAppointments';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { UpcomingBirthdays } from '@/components/dashboard/UpcomingBirthdays';
import { PendingPaymentsWidget } from '@/components/dashboard/PendingPaymentsWidget';
import { ReactivationWidget } from '@/components/dashboard/ReactivationWidget';
import { MonthlyReport } from '@/components/dashboard/MonthlyReport';
import { IncomeSparkline } from '@/components/dashboard/IncomeSparkline';
import { StaffOccupancy } from '@/components/dashboard/StaffOccupancy';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { RefreshCw, DollarSign, TrendingDown, TrendingUp, Users } from 'lucide-react';
import type { DashboardMetrics, MonthlyReport as MonthlyReportType } from '@/components/dashboard/types';

interface Props {
  initialMetrics?: DashboardMetrics | null;
  initialMonthlyReport?: MonthlyReportType | null;
}

function computeTrend(current: number, previous: number): { value: number; positive: boolean } | null {
  if (previous <= 0 || current <= 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(pct), positive: pct >= 0 };
}

const AUTO_REFRESH_MS = 60_000;

export default function DashboardPage({ initialMetrics, initialMonthlyReport }: Props) {
  const { push } = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialMetrics || null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportType | null>(initialMonthlyReport || null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState('0s');
  const [showMonthlyReport, setShowMonthlyReport] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeAgoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reportFetchedRef = useRef(!!initialMonthlyReport);

  async function loadMetrics() {
    try {
      setError(null);
      const data = await getDashboardMetrics();
      setMetrics(data as DashboardMetrics);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
      console.error(e);
    }
  }

  const loadMonthlyReport = useCallback(async () => {
    if (reportFetchedRef.current) return;
    setLoadingReport(true);
    try {
      const { getMonthlyReport: fetchReport } = await import('@/lib/db/queries');
      const now = new Date();
      const data = await fetchReport(now.getFullYear(), now.getMonth() + 1);
      setMonthlyReport(data as MonthlyReportType);
      reportFetchedRef.current = true;
    } catch {
      // silent
    } finally {
      setLoadingReport(false);
    }
  }, []);

  function toggleMonthlyReport() {
    if (!showMonthlyReport && !reportFetchedRef.current) loadMonthlyReport();
    setShowMonthlyReport(!showMonthlyReport);
  }

  // Initial load if no SSR data
  useEffect(() => {
    if (initialMetrics) return;
    loadMetrics();
  }, [initialMetrics]);

  // Auto-refresh every 60s
  useEffect(() => {
    intervalRef.current = setInterval(loadMetrics, AUTO_REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Pause auto-refresh when tab is hidden
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (!document.hidden && !intervalRef.current) {
        intervalRef.current = setInterval(loadMetrics, AUTO_REFRESH_MS);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Update timeAgo every 10s
  useEffect(() => {
    timeAgoRef.current = setInterval(() => {
      setTimeAgo(`${Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s`);
    }, 10_000);
    return () => { if (timeAgoRef.current) clearInterval(timeAgoRef.current); };
  }, [lastUpdated]);

  // Listen for cache refreshes
  useEffect(() => {
    const cb = () => { setLastUpdated(new Date()); setTimeAgo('0s'); };
    onCacheRefresh('dashboard', cb);
    return () => removeCacheRefresh('dashboard', cb);
  }, []);

  // Trends for stat cards
  const incomeTrend = useMemo(
    () => metrics ? computeTrend(metrics.weekIncome, metrics.lastWeekIncome) : null,
    [metrics]
  );
  const expensesTrend = useMemo(
    () => metrics ? computeTrend(metrics.weekExpenses, metrics.lastWeekExpenses) : null,
    [metrics]
  );

  if (!metrics) {
    return (
      <>
        <Header title="Dashboard" />
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <>
      <Header
        title="Dashboard"
        action={
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-400 hidden sm:inline">
              Actualizado hace {timeAgo}
            </span>
            <button
              type="button"
              onClick={loadMetrics}
              className="p-2 rounded-xl hover:bg-zinc-100 transition-colors active:scale-95"
              aria-label="Actualizar datos"
            >
              <RefreshCw className="size-5 text-zinc-500" />
            </button>
          </div>
        }
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {error && <ErrorBanner message={error} onRetry={loadMetrics} />}

        <WelcomeBanner todayAppointments={metrics.todayAppointments} />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatCard
            icon={<DollarSign className="size-5 text-emerald-600" />}
            value={formatCurrency(metrics.monthIncome)}
            label="Ingresos del mes"
            iconBgClass="bg-emerald-50"
            iconClass="text-emerald-600"
            trend={incomeTrend}
            onClick={() => push('/pagos')}
          />
          <DashboardStatCard
            icon={<TrendingDown className="size-5 text-red-600" />}
            value={formatCurrency(metrics.monthExpenses)}
            label="Gastos del mes"
            iconBgClass="bg-red-50"
            iconClass="text-red-600"
            trend={expensesTrend ? { ...expensesTrend, positive: !expensesTrend.positive } : null}
            onClick={() => push('/pagos')}
          />
          <DashboardStatCard
            icon={<TrendingUp className="size-5 text-white" />}
            value={formatCurrency(metrics.netProfit)}
            label="Ganancia neta"
            iconBgClass="bg-gradient-to-br from-salon-500 to-accent-600"
            iconClass="text-white"
            onClick={() => push('/pagos')}
          />
          <DashboardStatCard
            icon={<Users className="size-5 text-violet-600" />}
            value={String(metrics.activeClients)}
            label="Clientas activas"
            iconBgClass="bg-violet-50"
            iconClass="text-violet-600"
            onClick={() => push('/clientes')}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TodayAppointments appointments={metrics.todayAppointments} onNavigate={(path) => push(path)} />

          {/* Right Column */}
          <div className="space-y-6">
            <QuickActions />

            {metrics.weekTrend.length > 0 && (
              <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-900">Tendencia semanal</h3>
                  <DollarSign className="size-4 text-emerald-500" />
                </div>
                <IncomeSparkline data={metrics.weekTrend} />
                <div className="flex items-center justify-between mt-2 text-xs text-zinc-400">
                  <span>{metrics.weekTrend[0]?.date?.slice(5) || ''}</span>
                  <span>{metrics.weekTrend[metrics.weekTrend.length - 1]?.date?.slice(5) || ''}</span>
                </div>
              </div>
            )}

            <StaffOccupancy staff={metrics.staffOccupancy} />

            <UpcomingBirthdays birthdays={metrics.upcomingBirthdays || []} />

            <PendingPaymentsWidget payments={metrics.pendingPayments} />

            <ReactivationWidget clients={metrics.toReactivates} />

            <RecentActivity activities={metrics.recentActivity} />
          </div>
        </div>

        {/* Monthly Report */}
        <MonthlyReport report={monthlyReport} loading={loadingReport} />
      </div>
    </>
  );
}
