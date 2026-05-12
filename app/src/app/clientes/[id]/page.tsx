import type { Metadata } from 'next';
import { getAppointments, getClientById } from '@/lib/db/queries';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Detalle de clienta',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, appointments] = await Promise.all([
    getClientById(id),
    getAppointments({ clientId: id }),
  ]);

  return <ClientPage initialData={{ client, appointments }} />;
}
