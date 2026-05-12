import type { Metadata } from 'next';
import { getCategories, getServices, getStaff } from '@/lib/db/queries';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Servicios',
};

export default async function Page() {
  const [services, categories, allStaff] = await Promise.all([
    getServices(true),
    getCategories(true),
    getStaff(true),
  ]);

  return (
    <ClientPage
      initialData={{
        services,
        categories,
        allStaff,
      }}
    />
  );
}
