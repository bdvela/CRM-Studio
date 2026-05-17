import type { Metadata } from 'next';
import { getCategories, getServices, getStaff } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Servicios',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const [services, categories, allStaff] = await Promise.all([
    getServices(true, supabase),
    getCategories(true, supabase),
    getStaff(true, supabase),
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
