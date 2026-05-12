import type { Metadata } from 'next';
import { getCategories, getRoles, getServices, getStaff } from '@/lib/db/queries';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Staff / Artists',
};

export default async function Page() {
  const [members, roles, categories, services] = await Promise.all([
    getStaff(false),
    getRoles(false),
    getCategories(true),
    getServices(true),
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
