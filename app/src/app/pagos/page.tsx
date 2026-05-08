'use client';

import { useEffect, useState } from 'react';
import { getPayments, createPayment, getAppointments, getClients } from '@/lib/db/queries';
import type { Payment, PaymentInsert, PaymentType, PaymentKind, PaymentMethod, PaymentCategory } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  PAYMENT_KIND_LABELS, PAYMENT_METHOD_LABELS,
} from '@/types/database';
import { DollarSign, Plus, Search, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const typeIcons: Record<string, React.ReactNode> = {
  ingreso: <TrendingUp className="w-4 h-4 text-green-600" />,
  egreso: <TrendingDown className="w-4 h-4 text-red-600" />,
};

export default function PagosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<PaymentInsert>({
    concept: '', date: new Date().toISOString().split('T')[0], amount: 0,
    type: 'ingreso', category: 'servicio', payment_kind: 'reserva',
    payment_method: 'efectivo', appointment_id: null, client_id: null,
    receipt_url: null, paid: true,
  });

  async function load() {
    setLoading(true);
    try {
      const [p, a, c] = await Promise.all([
        getPayments(),
        getAppointments(),
        getClients(),
      ]);
      setPayments(p as Payment[]);
      setAppointments(a as any[]);
      setClients(c as any[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.concept.trim() || form.amount <= 0) {
      toast.error('Concepto y monto son obligatorios');
      return;
    }
    
    setSubmitting(true);
    try {
      await createPayment(form);
      toast.success('Pago registrado');
      setShowModal(false);
      setForm({
        concept: '', date: new Date().toISOString().split('T')[0], amount: 0,
        type: 'ingreso', category: 'servicio', payment_kind: 'reserva',
        payment_method: 'efectivo', appointment_id: null, client_id: null,
        receipt_url: null, paid: true,
      });
      load();
    } catch (e) {
      toast.error('Error al registrar');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = payments.filter((p) => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (search) return p.concept.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const totalIngresos = payments.filter(p => p.type === 'ingreso').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalEgresos = payments.filter(p => p.type === 'egreso').reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <>
      <Header title="Pagos / Finanzas" action={
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Registrar
        </Button>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Ingresos</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalIngresos)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Egresos</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totalEgresos)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-salon-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-salon-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Ganancia neta</p>
                <p className="text-lg font-bold text-salon-600">{formatCurrency(totalIngresos - totalEgresos)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
            />
          </div>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {['all', 'ingreso', 'egreso'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filterType === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'ingreso' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay pagos registrados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="flex items-center gap-4 py-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    payment.type === 'ingreso' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {typeIcons[payment.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{payment.concept}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{formatDate(payment.date)}</span>
                      {payment.payment_method && (
                        <span>· {PAYMENT_METHOD_LABELS[payment.payment_method]}</span>
                      )}
                      {payment.payment_kind && (
                        <span>· {PAYMENT_KIND_LABELS[payment.payment_kind]}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${payment.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                      {payment.type === 'ingreso' ? '+' : '-'}{formatCurrency(payment.amount)}
                    </p>
                    <Badge variant={payment.type === 'ingreso' ? 'success' : 'danger'} className="text-xs mt-1">
                      {payment.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Pago">
        <form onSubmit={handleSubmit} className="space-y-4">
           <Select label="Tipo" value={form.type} onChange={(value) => setForm({ ...form, type: value as PaymentType })} options={[
             { value: 'ingreso', label: 'Ingreso' },
             { value: 'egreso', label: 'Egreso' },
           ]} />
          <Input label="Concepto *" value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} placeholder="Ej: Pago de María García" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monto *" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            <Input label="Fecha" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>

          {form.type === 'ingreso' && (
            <>
               <Select label="Tipo de pago" value={form.payment_kind || ''} onChange={(value) => setForm({ ...form, payment_kind: value as PaymentKind })} options={[
                 { value: 'reserva', label: 'Reserva (S/10)' },
                 { value: 'pago_completo', label: 'Pago completo (press-on)' },
                 { value: 'pago_final', label: 'Pago final (saldo)' },
               ]} />
               <Select label="Método de pago" value={form.payment_method || ''} onChange={(value) => setForm({ ...form, payment_method: value as PaymentMethod })} options={[
                 { value: '', label: 'Seleccionar...' },
                 { value: 'efectivo', label: 'Efectivo' },
                 { value: 'tarjeta', label: 'Tarjeta' },
                 { value: 'transferencia', label: 'Transferencia' },
                 { value: 'yape_plin', label: 'Yape/Plin' },
               ]} />
            </>
          )}

          {form.type === 'egreso' && (
             <Select label="Categoría" value={form.category} onChange={(value) => setForm({ ...form, category: value as PaymentCategory })} options={[
               { value: 'servicio', label: 'Servicio' },
               { value: 'insumo', label: 'Insumo' },
               { value: 'alquiler', label: 'Alquiler' },
               { value: 'marketing', label: 'Marketing' },
               { value: 'comisiones', label: 'Comisiones' },
               { value: 'otro', label: 'Otro' },
             ]} />
          )}

           <div className="flex gap-3 pt-2">
             <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
             <Button type="submit" className="flex-1" loading={submitting}>
               {!submitting && <Receipt className="w-4 h-4 mr-1" />}
               {submitting ? 'Guardando...' : 'Registrar'}
             </Button>
           </div>
        </form>
      </Modal>
    </>
  );
}
