'use client';

import { useEffect, useRef, useReducer, useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getPayments, createPayment, getAppointments, getClients } from '@/lib/db/queries';
import type { Payment, Client, Appointment } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import {
  PagosTabs,
  PagosSummaryCards,
  PaymentFilters,
  PaymentCard,
} from '@/components/pagos';
import { formReducer, FORM_INIT } from '@/components/pagos/types';
import type { TabId } from '@/components/pagos/types';
import { getLocalDateString } from '@/lib/utils';
import ComisionesTab from './_tabs/comisiones-tab';

const PaymentFormModal = lazy(() =>
  import('@/components/pagos/PaymentFormModal').then(m => ({ default: m.PaymentFormModal }))
);
const PaymentDetailModal = lazy(() =>
  import('@/components/pagos/PaymentDetailModal').then(m => ({ default: m.PaymentDetailModal }))
);

interface UIState {
  loading: boolean;
  submitting: boolean;
  showModal: boolean;
  filterType: string;
  search: string;
  activeTab: TabId;
}

const UI_INIT: UIState = {
  loading: true, submitting: false, showModal: false,
  filterType: 'all', search: '', activeTab: 'registrar',
};

export default function PagosPage({ initialData }: {
  initialData?: { payments: Payment[]; appointments: Appointment[]; clients: Client[] };
}) {
  const { push } = useRouter();
  const [payments, setPayments] = useState<Payment[]>(initialData?.payments || []);
  const [appointmentsData, setAppointmentsData] = useState<Appointment[]>(initialData?.appointments || []);
  const [clientsData, setClientsData] = useState<Client[]>(initialData?.clients || []);
  const [ui, setUI] = useReducer(
    (s: UIState, a: Partial<UIState>) => ({ ...s, ...a }),
    initialData ? { ...UI_INIT, loading: false } : UI_INIT
  );
  const [form, dispatchForm] = useReducer(
    formReducer,
{ ...FORM_INIT, date: getLocalDateString() }
  );
  const skipInitialLoad = useRef(!!initialData);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  async function load(showLoader = true) {
    if (showLoader) setUI({ loading: true });
    try {
      const [p, a, c] = await Promise.all([getPayments(), getAppointments(), getClients()]);
      setPayments(p);
      setAppointmentsData(a);
      setClientsData(c);
    } catch (e) {
      console.error(e);
    } finally {
      setUI({ loading: false });
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) { skipInitialLoad.current = false; return; }
    load();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      import('@/components/pagos/PaymentFormModal');
      import('@/components/pagos/PaymentDetailModal');
    }, 500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = setInterval(() => load(false), 60000);

    function handleVisibility() {
      if (document.hidden && interval) {
        clearInterval(interval);
        interval = null;
      } else if (!document.hidden && !interval) {
        interval = setInterval(() => load(false), 60000);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ui.submitting) return;
    if (!form.concept.trim() || form.amount <= 0) { toast.error('Concepto y monto son obligatorios'); return; }
    setUI({ submitting: true });
    try {
      await createPayment(form);
      toast.success('Pago registrado');
      setUI({ showModal: false });
      dispatchForm({ type: 'RESET', payload: { ...FORM_INIT, date: getLocalDateString() } });
      load();
    } catch {
      toast.error('Error al registrar');
    } finally {
      setUI({ submitting: false });
    }
  }

  const filtered = useMemo(() => payments.filter((p) => {
    if (ui.filterType !== 'all' && p.type !== ui.filterType) return false;
    if (ui.search) return p.concept.toLowerCase().includes(ui.search.toLowerCase());
    return true;
  }), [payments, ui.filterType, ui.search]);

  const totalIngresos = useMemo(() =>
    payments.filter(p => p.type === 'ingreso').reduce((sum, p) => sum + Number(p.amount), 0), [payments]);

  const totalEgresos = useMemo(() =>
    payments.filter(p => p.type === 'egreso').reduce((sum, p) => sum + Number(p.amount), 0), [payments]);

  const selectedPayment = useMemo(() =>
    payments.find((p) => p.id === selectedPaymentId) || null, [payments, selectedPaymentId]);

  const selectedAppointment = useMemo(() => {
    if (!selectedPayment?.appointment_id) return null;
    return appointmentsData.find((a) => a.id === selectedPayment.appointment_id) || null;
  }, [selectedPayment, appointmentsData]);

  const selectedClient = useMemo(() => {
    if (!selectedPayment?.client_id) return null;
    return clientsData.find((c) => c.id === selectedPayment.client_id) || null;
  }, [selectedPayment, clientsData]);

  const handleGoToAppointment = useCallback(() => {
    if (!selectedPayment?.appointment_id) return;
    setSelectedPaymentId(null);
    push('/citas/' + selectedPayment.appointment_id);
  }, [selectedPayment, push]);

  const handleGoToClient = useCallback(() => {
    if (!selectedClient) return;
    setSelectedPaymentId(null);
    push(`/clientes/${selectedClient.id}`);
  }, [selectedClient, push]);

  return (
    <>
      <Header title="Pagos" />
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <PagosTabs activeTab={ui.activeTab} onTabChange={(t) => setUI({ activeTab: t })} />

        {ui.activeTab === 'registrar' && (
          <>
            <PagosSummaryCards totalIngresos={totalIngresos} totalEgresos={totalEgresos} />
            <PaymentFilters
              search={ui.search}
              filterType={ui.filterType}
              onSearchChange={(v) => setUI({ search: v })}
              onFilterTypeChange={(v) => setUI({ filterType: v })}
              onNewClick={() => {
                const targetType = ui.filterType !== 'all' ? ui.filterType as 'ingreso' | 'egreso' : 'ingreso';
                const today = getLocalDateString();
                if (targetType === 'egreso') {
                  dispatchForm({ type: 'SET', payload: { type: 'egreso', payment_kind: null, payment_method: null, category: 'servicio', date: today } });
                } else {
                  dispatchForm({ type: 'SET', payload: { type: 'ingreso', category: 'servicio', payment_kind: 'reserva', payment_method: 'yape_plin', date: today } });
                }
                setUI({ showModal: true });
              }}
            />
            {ui.loading ? (
              <div className="space-y-3" role="status" aria-label="Cargando pagos">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-zinc-400">
                  <DollarSign className="size-12 mx-auto mb-3 opacity-30" aria-hidden="true" />
                  <p className="text-sm">No hay pagos registrados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2" role="list" aria-label="Lista de pagos">
                {filtered.map((payment, i) => (
                  <div key={payment.id} className="animate-fadeInUp" style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, opacity: 0 }}>
                    <PaymentCard
                      payment={payment}
                      onClick={() => setSelectedPaymentId(payment.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {ui.activeTab === 'comisiones' && <ComisionesTab />}
      </div>

      <Suspense fallback={null}>
        <PaymentFormModal
          open={ui.showModal}
          submitting={ui.submitting}
          form={form}
          dispatchForm={dispatchForm}
          onSubmit={handleSubmit}
          onClose={() => setUI({ showModal: false })}
        />
      </Suspense>

      {selectedPayment && (
        <Suspense fallback={null}>
          <PaymentDetailModal
            payment={selectedPayment}
            appointment={selectedAppointment}
            client={selectedClient}
            onClose={() => setSelectedPaymentId(null)}
            onGoToAppointment={handleGoToAppointment}
            onGoToClient={handleGoToClient}
          />
        </Suspense>
      )}
    </>
  );
}
