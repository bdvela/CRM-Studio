'use client';

import { useEffect, useState, useRef, useReducer } from 'react';
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
  ingreso: <TrendingUp className="size-4 text-green-600" />,
  egreso: <TrendingDown className="size-4 text-red-600" />,
};

const FORM_INIT: PaymentInsert = {
  concept: '', date: '', amount: 0,
  type: 'ingreso', category: 'servicio', payment_kind: 'reserva',
  payment_method: 'efectivo', appointment_id: null, client_id: null,
  receipt_url: null, paid: true,
};

function formReducer(state: PaymentInsert, action: Partial<PaymentInsert>) {
  return { ...state, ...action };
}

interface PagosUIState {
  loading: boolean;
  submitting: boolean;
  showModal: boolean;
  filterType: string;
  search: string;
}

const UI_INIT: PagosUIState = {
  loading: true,
  submitting: false,
  showModal: false,
  filterType: 'all',
  search: '',
};

function uiReducer(state: PagosUIState, action: Partial<PagosUIState>): PagosUIState {
  return { ...state, ...action };
}

export default function PagosPage({ initialData }: {
  initialData?: {
    payments: Payment[];
    appointments: any[];
    clients: any[];
  };
}) {
  const [payments, setPayments] = useState<Payment[]>(initialData?.payments || []);
  const appointmentsRef = useRef<any[]>(initialData?.appointments || []);
  const clientsRef = useRef<any[]>(initialData?.clients || []);
  const [ui, dispatchUI] = useReducer(
    uiReducer,
    initialData ? { ...UI_INIT, loading: false } : UI_INIT,
  );
  const [form, dispatchForm] = useReducer(formReducer, { ...FORM_INIT, date: new Date().toISOString().split('T')[0] });
  const skipInitialLoad = useRef(!!initialData);

  async function load() {
    dispatchUI({ loading: true });
    try {
      const [p, a, c] = await Promise.all([
        getPayments(),
        getAppointments(),
        getClients(),
      ]);
      setPayments(p as Payment[]);
      appointmentsRef.current = a as any[];
      clientsRef.current = c as any[];
    } catch (e) {
      console.error(e);
    } finally {
      dispatchUI({ loading: false });
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }

    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ui.submitting) return;
    if (!form.concept.trim() || form.amount <= 0) {
      toast.error('Concepto y monto son obligatorios');
      return;
    }
    
    dispatchUI({ submitting: true });
    try {
      await createPayment(form);
      toast.success('Pago registrado');
      dispatchUI({ showModal: false });
      dispatchForm({ ...FORM_INIT, date: new Date().toISOString().split('T')[0] });
      load();
    } catch (e) {
      toast.error('Error al registrar');
    } finally {
      dispatchUI({ submitting: false });
    }
  }

  const filtered = payments.filter((p) => {
    if (ui.filterType !== 'all' && p.type !== ui.filterType) return false;
    if (ui.search) return p.concept.toLowerCase().includes(ui.search.toLowerCase());
    return true;
  });

  const totalIngresos = payments.filter(p => p.type === 'ingreso').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalEgresos = payments.filter(p => p.type === 'egreso').reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <>
      <Header title="Pagos / Finanzas" action={
        <Button size="sm" onClick={() => dispatchUI({ showModal: true })}>
          <Plus className="size-4 mr-1" /> Registrar
        </Button>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Ingresos</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalIngresos)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center">
                <TrendingDown className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Egresos</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totalEgresos)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-salon-100 flex items-center justify-center">
                <DollarSign className="size-5 text-salon-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Ganancia neta</p>
                <p className="text-lg font-bold text-salon-600">{formatCurrency(totalIngresos - totalEgresos)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={ui.search}
              onChange={(e) => dispatchUI({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
            />
          </div>
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
            {['all', 'ingreso', 'egreso'].map((t) => (
              <button
                key={t}
                onClick={() => dispatchUI({ filterType: t })}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  ui.filterType === t ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'ingreso' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>
        </div>

        {/* Payment List */}
        {ui.loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={'skel-' + i} className="h-16 rounded-2xl bg-zinc-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-400">
              <DollarSign className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay pagos registrados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="flex items-center gap-4 py-3.5">
                  <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    payment.type === 'ingreso' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {typeIcons[payment.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{payment.concept}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
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

      <Modal open={ui.showModal} onClose={() => dispatchUI({ showModal: false })} title="Registrar Pago">
        <form onSubmit={handleSubmit} className="space-y-4">
           <Select label="Tipo" value={form.type} onChange={(value) => dispatchForm({ type: value as PaymentType })} options={[
             { value: 'ingreso', label: 'Ingreso' },
             { value: 'egreso', label: 'Egreso' },
           ]} />
          <Input label="Concepto *" value={form.concept} onChange={(e) => dispatchForm({ concept: e.target.value })} placeholder="Ej: Pago de María García" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monto *" type="number" step="0.01" value={form.amount} onChange={(e) => dispatchForm({ amount: parseFloat(e.target.value) || 0 })} />
            <Input label="Fecha" type="date" value={form.date} onChange={(e) => dispatchForm({ date: e.target.value })} />
          </div>

          {form.type === 'ingreso' && (
            <>
               <Select label="Tipo de pago" value={form.payment_kind || ''} onChange={(value) => dispatchForm({ payment_kind: value as PaymentKind })} options={[
                 { value: 'reserva', label: 'Reserva (S/20)' },
                 { value: 'pago_completo', label: 'Pago completo (press-on)' },
                 { value: 'pago_final', label: 'Pago final (saldo)' },
               ]} />
               <Select label="Método de pago" value={form.payment_method || ''} onChange={(value) => dispatchForm({ payment_method: value as PaymentMethod })} options={[
                 { value: '', label: 'Seleccionar...' },
                 { value: 'efectivo', label: 'Efectivo' },
                 { value: 'tarjeta', label: 'Tarjeta' },
                 { value: 'transferencia', label: 'Transferencia' },
                 { value: 'yape_plin', label: 'Yape/Plin' },
               ]} />
            </>
          )}

          {form.type === 'egreso' && (
             <Select label="Categoría" value={form.category} onChange={(value) => dispatchForm({ category: value as PaymentCategory })} options={[
               { value: 'servicio', label: 'Servicio' },
               { value: 'insumo', label: 'Insumo' },
               { value: 'alquiler', label: 'Alquiler' },
               { value: 'marketing', label: 'Marketing' },
               { value: 'comisiones', label: 'Comisiones' },
               { value: 'otro', label: 'Otro' },
             ]} />
          )}

           <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => dispatchUI({ showModal: false })}>Cancelar</Button>
              <Button type="submit" className="flex-1" loading={ui.submitting}>
                {!ui.submitting && <Receipt className="size-4 mr-1" />}
                {ui.submitting ? 'Guardando...' : 'Registrar'}
             </Button>
           </div>
        </form>
      </Modal>
    </>
  );
}
