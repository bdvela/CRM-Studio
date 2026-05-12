import type { Metadata } from 'next';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function Page() {
  return <ClientPage />;
}
