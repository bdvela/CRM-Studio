import type { Metadata } from 'next';
import MisComisionesClient from './page-client';

export const metadata: Metadata = { title: 'Mis Comisiones' };

export default function MisComisionesPage() {
  return <MisComisionesClient />;
}
