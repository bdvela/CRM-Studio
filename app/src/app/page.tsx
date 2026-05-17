import type { Metadata } from 'next';
import { getDashboardMetrics, getMonthlyReport } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const now = new Date();
  const [initialMetrics, initialMonthlyReport] = await Promise.all([
    getDashboardMetrics(supabase),
    getMonthlyReport(now.getFullYear(), now.getMonth() + 1, supabase),
  ]);
  return (
    <ClientPage
      initialMetrics={initialMetrics}
      initialMonthlyReport={initialMonthlyReport}
    />
  );
}
