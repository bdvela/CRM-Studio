import type { Metadata } from 'next';
import OnboardingClient from './page-client';

export const metadata: Metadata = { title: 'Configurar negocio' };

export default function OnboardingPage() {
  return <OnboardingClient />;
}
