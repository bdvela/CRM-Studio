import type { Metadata } from 'next';
import { getCommissionReport } from '@/lib/db/queries';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Reporte Comisiones',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  const from = monthStart.toISOString().split('T')[0];
  const rows = await getCommissionReport(from, today);

  return (
    <ClientPage
      initialData={{
        rows,
        dateRange: { from, to: today },
      }}
    />
  );
}
