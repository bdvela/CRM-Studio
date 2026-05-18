import type { Metadata } from 'next';
import { getCurrentBusiness } from '@/lib/tenant/resolve';
import LoginClient from './page-client';

export async function generateMetadata(): Promise<Metadata> {
  const biz = await getCurrentBusiness();
  const name = biz?.name ?? 'CRM Studio';
  return { title: `Iniciar sesión — ${name}` };
}

export default function LoginPage() {
  return <LoginClient />;
}
