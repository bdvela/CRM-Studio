import type { Metadata } from 'next';
import { getCategories, getRoles, getServices, getStaff } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Staff / Artists',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const [members, roles, categories, services] = await Promise.all([
    getStaff(false, supabase),
    getRoles(false, supabase),
    getCategories(true, supabase),
    getServices(true, supabase),
  ]);

  return (
    <ClientPage
      initialData={{
        members,
        roles,
        categories,
        services,
      }}
    />
  );
}
