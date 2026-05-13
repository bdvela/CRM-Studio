import type { Metadata } from 'next';
import { getAppointments, getClients, getStaff, getServices } from '@/lib/db/queries';
import { startOfToday } from '@/lib/utils';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Citas',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [appointments, staff, services, clients] = await Promise.all([
    getAppointments({ dateFrom: startOfToday() }),
    getStaff(),
    getServices(false),
    getClients(),
  ]);

  return <ClientPage initialData={{ appointments, staff, services, clients }} />;
}
