'use client';

import { useEffect, useMemo, useState } from 'react';
import { getPendingPayments } from '@/lib/db/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatTime, cn } from '@/lib/utils';
import { Clock, AlertTriangle, CheckCircle2, CalendarDays, UserRound } from 'lucide-react';

const URGENCY_DAYS = 1;

function getUrgency(appt: any): 'critical' | 'warning' | 'normal' {
  const daysSince = Math.floor(
    (Date.now() - new Date(appt.start_time).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSince > URGENCY_DAYS) return 'critical';
  if (daysSince > 0) return 'warning';
  return 'normal';
}

export default function PendientesTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await getPendingPayments();
      setPayments(data as any[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const totalPending = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.appointment_balance?.pending_balance || 0), 0),
    [payments]
  );

  const urgencyStats = useMemo(() => {
    const stats = { critical: 0, warning: 0, normal: 0 };
    payments.forEach(p => { const u = getUrgency(p); stats[u]++; });
    return stats;
  }, [payments]);

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-zinc-100 animate-pulse" />)}</div>;
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="size-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="size-8 text-emerald-500" />
          </div>
          <p className="text-lg font-semibold text-zinc-900">¡Todo al día!</p>
          <p className="text-sm text-zinc-500 mt-1">No hay citas con saldo pendiente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Clock className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Por cobrar</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalPending)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Urgentes</p>
              <p className="text-lg font-bold text-amber-600">{urgencyStats.critical}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-salon-100 flex items-center justify-center">
              <CalendarDays className="size-5 text-salon-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Citas</p>
              <p className="text-lg font-bold text-salon-600">{payments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <UserRound className="size-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Clientas</p>
              <p className="text-lg font-bold text-violet-600">{new Set(payments.map(p => p.client_id)).size}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {payments.map((appt) => {
          const urgency = getUrgency(appt);
          const balance = Number(appt.appointment_balance?.pending_balance || 0);
          const totalPrice = Number(appt.total_price || 0);
          const totalPaid = Number(appt.appointment_balance?.total_paid || 0);

          return (
            <Card key={appt.id} className="hover:shadow-sm transition-all">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={cn(
                      'size-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      urgency === 'critical' ? 'bg-red-100' : urgency === 'warning' ? 'bg-amber-100' : 'bg-salon-100'
                    )}>
                      {urgency === 'critical' ? <AlertTriangle className="size-5 text-red-600" /> :
                       urgency === 'warning' ? <Clock className="size-5 text-amber-600" /> :
                       <CalendarDays className="size-5 text-salon-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{appt.client?.name || 'Sin clienta'}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{formatDate(appt.start_time)} · {formatTime(appt.start_time)}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {appt.appointment_services?.map((s: any) => (
                          <Badge key={s.service_id} variant="default" className="text-[10px]">{s.service?.name || 'Servicio'}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-red-600">{formatCurrency(balance)}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">de {formatCurrency(totalPrice)}</p>
                    <div className="mt-1.5 h-1.5 w-20 bg-zinc-100 rounded-full overflow-hidden ml-auto">
                      <div className={cn('h-full rounded-full transition-all', totalPaid > 0 ? 'bg-salon-500' : 'bg-zinc-300')}
                        style={{ width: `${Math.min(100, Math.round((totalPaid / totalPrice) * 100))}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
