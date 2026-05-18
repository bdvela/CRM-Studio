'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/layout/shell';
import { formatDate } from '@/lib/utils';
import { CalendarDays, Clock } from 'lucide-react';
import { APPOINTMENT_STATUS_LABELS } from '@/types/database';
import type { AppointmentStatus } from '@/types/database';
import { toast } from 'sonner';

type Appt = {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  status: AppointmentStatus;
  total_price: number;
  client?: { name: string } | null;
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  programada:  'bg-blue-100 text-blue-700',
  en_curso:    'bg-amber-100 text-amber-700',
  completada:  'bg-green-100 text-green-700',
  cancelada:   'bg-red-100 text-red-600',
  no_show:     'bg-zinc-100 text-zinc-500',
};

export default function MisCitasClient() {
  const { staffId, memberRole } = useAuth();
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, title, start_time, end_time, status, total_price, client:clients(name)')
        .eq('artist_id', staffId)
        .order('start_time', { ascending: false })
        .limit(50);
      if (error) throw error;
      setAppts((data ?? []) as unknown as Appt[]);
    } catch {
      toast.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => { load(); }, [load]);

  async function advanceStatus(appt: Appt) {
    const next: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
      programada: 'en_curso',
      en_curso: 'completada',
    };
    const nextStatus = next[appt.status];
    if (!nextStatus) return;
    const { error } = await supabase.from('appointments').update({ status: nextStatus }).eq('id', appt.id);
    if (error) { toast.error('Error al actualizar estado'); return; }
    toast.success(`Cita marcada como ${APPOINTMENT_STATUS_LABELS[nextStatus]}`);
    load();
  }

  const grouped = appts.reduce<Record<string, Appt[]>>((acc, a) => {
    const day = a.start_time.split('T')[0];
    (acc[day] = acc[day] || []).push(a);
    return acc;
  }, {});

  return (
    <>
      <Header title="Mis Citas" />
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-100 animate-pulse" />)}
          </div>
        ) : appts.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <CalendarDays className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tenés citas asignadas</p>
          </div>
        ) : (
          Object.entries(grouped).sort(([a],[b]) => b.localeCompare(a)).map(([day, list]) => (
            <div key={day} className="space-y-2">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide px-1">
                {formatDate(day)}
              </p>
              {list.map(appt => (
                <div key={appt.id} className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 truncate">{appt.title}</p>
                      <p className="text-sm text-zinc-500">{appt.client?.name ?? 'Sin clienta'}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                        <Clock className="size-3" />
                        {new Date(appt.start_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[appt.status]}`}>
                        {APPOINTMENT_STATUS_LABELS[appt.status]}
                      </span>
                      {(appt.status === 'programada' || appt.status === 'en_curso') && (
                        <button onClick={() => advanceStatus(appt)}
                          className="px-3 py-1 rounded-lg bg-salon-600 text-white text-xs font-medium hover:bg-salon-700 transition-colors">
                          {appt.status === 'programada' ? 'Iniciar' : 'Completar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
