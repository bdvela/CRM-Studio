import type { Metadata } from 'next';
import { getAppointments, getClients, getPayments } from '@/lib/db/queries';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Pagos / Finanzas',
};

export default async function Page() {
  const [payments, appointments, clients] = await Promise.all([
    getPayments(),
    getAppointments(),
    getClients(),
  ]);

  return (
    <ClientPage
      initialData={{
        payments,
        appointments,
        clients,
      }}
    />
  );
}
