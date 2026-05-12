import type { Metadata } from 'next';
import { getAppointments, getClientById } from '@/lib/db/queries';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Detalle de clienta',
};

export default async function Page({ params }: { params: { id: string } }) {
  const [client, appointments] = await Promise.all([
    getClientById(params.id),
    getAppointments({ clientId: params.id }),
  ]);

  return <ClientPage initialData={{ client, appointments }} />;
}
