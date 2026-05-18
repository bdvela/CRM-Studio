import type { Metadata } from 'next';
import SignupClient from './page-client';

export const metadata: Metadata = { title: 'Crear tu negocio — CRM Studio' };

export default function SignupPage() {
  return <SignupClient />;
}
