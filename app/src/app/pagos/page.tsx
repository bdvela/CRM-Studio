import type { Metadata } from 'next';
import { getAppointments, getClients, getPayments } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Pagos / Finanzas',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const [payments, appointments, clients] = await Promise.all([
    getPayments(undefined, supabase),
    getAppointments(undefined, supabase),
    getClients(supabase),
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
