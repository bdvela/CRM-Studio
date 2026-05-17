import type { Metadata } from 'next';
import { getClients } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Clientas',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const initialClients = await getClients(supabase);

  return <ClientPage initialClients={initialClients} />;
}
