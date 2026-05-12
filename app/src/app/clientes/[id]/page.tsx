import type { Metadata } from 'next';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Detalle de clienta',
};

export default function Page() {
  return <ClientPage />;
}
