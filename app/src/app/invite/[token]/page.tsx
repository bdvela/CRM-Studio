import type { Metadata } from 'next';
import InviteClient from './page-client';

export const metadata: Metadata = { title: 'Aceptar invitación — CRM Studio' };

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  return <InviteClient paramsPromise={params} />;
}
