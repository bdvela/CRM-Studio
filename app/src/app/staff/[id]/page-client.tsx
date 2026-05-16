'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStaffById,
  getStaffPerformance,
  getStaffTopServices,
  getStaffAppointments,
  getCommissionOverrides,
} from '@/lib/db/queries';
import type { Appointment } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, CalendarDays } from 'lucide-react';

import type { StaffWithDetails, StaffPerformance, StaffTopService, Period } from '@/components/staff/types';
import { StaffDetailProfile } from '@/components/staff/StaffDetailProfile';
import { StaffDetailStats } from '@/components/staff/StaffDetailStats';
import { StaffDetailTopServices } from '@/components/staff/StaffDetailTopServices';
import { StaffDetailDistribution } from '@/components/staff/StaffDetailDistribution';
import { StaffAppointmentHistory } from '@/components/staff/StaffAppointmentHistory';
import { StaffDetailQuickInfo } from '@/components/staff/StaffDetailQuickInfo';

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
  initialMember: StaffWithDetails | null;
}) {
  const { push } = useRouter();
  const [member, setMember] = useState<StaffWithDetails | null>(initialMember);
  const [loading, setLoading] = useState(!initialMember);
  const [performance, setPerformance] = useState<StaffPerformance | null>(null);
  const [topServices, setTopServices] = useState<StaffTopService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [period, setPeriod] = useState<Period>('30d');
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [commissionOverridesCount, setCommissionOverridesCount] = useState(0);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const [m, overrides] = await Promise.all([
        staffId ? getStaffById(staffId) : Promise.resolve(null),
        staffId ? getCommissionOverrides(staffId) : Promise.resolve([]),
      ]);
      setMember(m as StaffWithDetails | null);
      setCommissionOverridesCount(overrides.length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    if (initialMember) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial fetch
    loadStaff();
  }, [loadStaff, initialMember]);

  useEffect(() => {
    if (!initialMember) return;
    getCommissionOverrides(staffId).then((data) => {
      setCommissionOverridesCount(data.length);
    });
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
      setPerformance(perf as unknown as StaffPerformance);
      setTopServices(svc as StaffTopService[]);
      setAppointments(appts as Appointment[]);
    } catch {
      // silent
    } finally {
      setLoadingPerf(false);
    }
  }, [staffId, period]);

  const handlePeriodChange = useCallback((p: Period) => setPeriod(p), []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch performance on member change
  useEffect(() => { if (member) loadPerformance(); }, [member, loadPerformance]);

  // Pause performance fetching when tab is hidden
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    function handleVisibility() {
      if (document.hidden && interval) {
        clearInterval(interval);
        interval = null;
      } else if (!document.hidden && !interval && member) {
        loadPerformance();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [member, loadPerformance]);

  if (loading) {
    return (
      <>
        <Header title="Staff" />
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-zinc-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-zinc-100 rounded-lg animate-pulse" />
              <div className="h-4 w-24 bg-zinc-100 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />)}
          </div>
          <div className="h-16 rounded-2xl bg-zinc-100 animate-pulse" />
          <div className="h-64 rounded-2xl bg-zinc-100 animate-pulse" />
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
            <div className="py-16 text-center px-5">
              <AlertCircle className="size-12 mx-auto mb-3 text-zinc-300" aria-hidden="true" />
              <p className="text-zinc-500">Staff no encontrado</p>
              <Button variant="outline" className="mt-4" onClick={() => push('/staff')}>
                Volver a Staff
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={member.name}
        action={
          <Button size="sm" variant="outline" onClick={() => push('/staff')}>
            <ArrowLeft className="size-4 mr-1" aria-hidden="true" /> Volver
          </Button>
        }
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="animate-fadeInUp stagger-1">
          <StaffDetailProfile member={member} />
        </div>

        <div className="animate-fadeInUp stagger-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-sm text-zinc-500 flex-shrink-0">Período:</span>
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  period === p ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
                aria-label={`Período de ${p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}`}
              >
                {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fadeInUp stagger-3">
          <StaffDetailStats performance={performance} loading={loadingPerf} />
        </div>

        {performance && performance.totalRevenue > 0 && (
          <div className="animate-fadeInUp stagger-4">
            <StaffDetailDistribution performance={performance} />
          </div>
        )}

        <div className="animate-fadeInUp stagger-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StaffDetailTopServices services={topServices} />

          <StaffDetailQuickInfo member={member} commissionOverridesCount={commissionOverridesCount} />
        </div>

        <div className="animate-fadeInUp stagger-6">
          <StaffAppointmentHistory appointments={appointments} />
        </div>
      </div>
    </>
  );
}
