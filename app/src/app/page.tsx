import type { Metadata } from 'next';
import { getDashboardMetrics } from '@/lib/db/queries';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const initialMetrics = await getDashboardMetrics();
  return <ClientPage initialMetrics={initialMetrics} />;
}
