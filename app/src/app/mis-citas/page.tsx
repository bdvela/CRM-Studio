import type { Metadata } from 'next';
import MisCitasClient from './page-client';

export const metadata: Metadata = { title: 'Mis Citas' };

export default function MisCitasPage() {
  return <MisCitasClient />;
}
