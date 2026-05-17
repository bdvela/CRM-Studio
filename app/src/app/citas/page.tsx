import type { Metadata } from 'next';
import { getAppointments, getClients, getStaff, getServices } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';
import { startOfToday } from '@/lib/utils';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Citas',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const [appointments, staff, services, clients] = await Promise.all([
    getAppointments({ dateFrom: startOfToday() }, supabase),
    getStaff(true, supabase),
    getServices(false, supabase),
    getClients(supabase),
  ]);

  return <ClientPage initialData={{ appointments, staff, services, clients }} />;
}
