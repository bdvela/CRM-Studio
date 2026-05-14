import type { Metadata } from 'next';
import { getDashboardMetrics, getMonthlyReport } from '@/lib/db/queries';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const now = new Date();
  const [initialMetrics, initialMonthlyReport] = await Promise.all([
    getDashboardMetrics(),
    getMonthlyReport(now.getFullYear(), now.getMonth() + 1),
  ]);
  return (
    <ClientPage
      initialMetrics={initialMetrics}
      initialMonthlyReport={initialMonthlyReport}
    />
  );
}
