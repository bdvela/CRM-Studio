'use client';

import { useEffect, useRef, useReducer, useMemo, useState } from 'react';
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
  PaymentFormModal,
  PaymentDetailModal,
} from '@/components/pagos';
import { formReducer, FORM_INIT } from '@/components/pagos/types';
import type { TabId } from '@/components/pagos/types';
import PendientesTab from './_tabs/pendientes-tab';
import ResumenTab from './_tabs/resumen-tab';
import ComisionesTab from './_tabs/comisiones-tab';

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
    { ...FORM_INIT, date: new Date().toISOString().split('T')[0] }
  );
  const skipInitialLoad = useRef(!!initialData);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  async function load() {
    setUI({ loading: true });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ui.submitting) return;
    if (!form.concept.trim() || form.amount <= 0) { toast.error('Concepto y monto son obligatorios'); return; }
    setUI({ submitting: true });
    try {
      await createPayment(form);
      toast.success('Pago registrado');
      setUI({ showModal: false });
      dispatchForm({ type: 'RESET', payload: { ...FORM_INIT, date: new Date().toISOString().split('T')[0] } });
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
              onNewClick={() => setUI({ showModal: true })}
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
                {filtered.map((payment) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    onClick={() => setSelectedPaymentId(payment.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {ui.activeTab === 'pendientes' && <PendientesTab />}
        {ui.activeTab === 'resumen' && <ResumenTab />}
        {ui.activeTab === 'comisiones' && <ComisionesTab />}
      </div>

      <PaymentFormModal
        open={ui.showModal}
        submitting={ui.submitting}
        form={form}
        dispatchForm={dispatchForm}
        onSubmit={handleSubmit}
        onClose={() => setUI({ showModal: false })}
      />

      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          appointment={selectedAppointment}
          client={selectedClient}
          onClose={() => setSelectedPaymentId(null)}
          onGoToAppointment={() => { if (!selectedPayment.appointment_id) return; setSelectedPaymentId(null); push('/citas/' + selectedPayment.appointment_id); }}
          onGoToClient={() => { if (!selectedClient) return; setSelectedPaymentId(null); push(`/clientes/${selectedClient.id}`); }}
        />
      )}
    </>
  );
}
