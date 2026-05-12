import type { Metadata } from 'next';
import { getClients } from '@/lib/db/queries';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Clientas',
};

export default async function Page() {
  const initialClients = await getClients();

  return <ClientPage initialClients={initialClients} />;
}
