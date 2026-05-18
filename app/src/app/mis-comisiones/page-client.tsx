'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/layout/shell';
import { formatCurrency } from '@/lib/utils';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';

type CommRow = {
  appointment_id: string;
  service_name: string;
  service_price: number;
  artist_commission: number;
  founder_share: number;
};

export default function MisComisionesClient() {
  const { staffId } = useAuth();
  const [rows, setRows] = useState<CommRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commission_details')
        .select('appointment_id, service_name, service_price, artist_commission, founder_share')
        .eq('artist_id', staffId)
        .order('appointment_id', { ascending: false });
      if (error) throw error;
      setRows((data ?? []) as CommRow[]);
    } catch {
      toast.error('Error al cargar comisiones');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => { load(); }, [load]);

  const total = rows.reduce((s, r) => s + Number(r.artist_commission), 0);

  return (
    <>
      <Header title="Mis Comisiones" />
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        {/* Summary */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-5 flex items-center gap-4">
          <div className="size-12 rounded-xl bg-accent-100 flex items-center justify-center">
            <DollarSign className="size-5 text-accent-600" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Total comisiones</p>
            <p className="text-2xl font-bold text-accent-600">{formatCurrency(total)}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-zinc-100 animate-pulse" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <DollarSign className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay comisiones registradas</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Servicio</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Precio</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 text-accent-600">Mi comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-zinc-900">{r.service_name}</td>
                    <td className="px-4 py-3 text-right text-zinc-500 tabular-nums">{formatCurrency(r.service_price)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-accent-600 tabular-nums">{formatCurrency(r.artist_commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
