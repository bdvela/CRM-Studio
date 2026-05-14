import type { Client, Appointment } from '@/types/database';
import { getClientById, getAppointments } from '@/lib/db/queries';
import ClienteDetailClient from './page-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) return { title: 'Clienta no encontrada — Ara Zevallos Studio' };
  return { title: `${(client as Client).name} — Clientas — Ara Zevallos Studio` };
}

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, appointments] = await Promise.all([
    getClientById(id),
    getAppointments({ clientId: id }),
  ]);
  return <ClienteDetailClient initialClient={client as Client} initialAppointments={appointments as Appointment[]} />;
}
