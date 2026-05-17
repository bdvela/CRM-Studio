import type { Client, Appointment } from '@/types/database';
import { getClientById, getAppointments } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';
import ClienteDetailClient from './page-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const client = await getClientById(id, supabase);
  if (!client) return { title: 'Clienta no encontrada — Ara Zevallos Studio' };
  return { title: `${client.name} — Clientas — Ara Zevallos Studio` };
}

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [client, appointments] = await Promise.all([
    getClientById(id, supabase),
    getAppointments({ clientId: id }, supabase),
  ]);
  return <ClienteDetailClient initialClient={client as Client} initialAppointments={appointments as Appointment[]} />;
}
