import type { Metadata } from 'next';
import { getAppointmentById } from '@/lib/db/queries';
import ClientPage from './page-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const appt = await getAppointmentById(id);
  if (!appt) return { title: 'Cita no encontrada — Ara Zevallos Studio' };
  return { title: `${appt.client?.name || 'Cita'} — Ara Zevallos Studio` };
}

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await getAppointmentById(id);
  return <ClientPage initialAppointment={appointment as any} />;
}
