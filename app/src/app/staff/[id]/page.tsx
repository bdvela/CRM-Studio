import { getStaffById } from '@/lib/db/queries';
import type { StaffWithDetails } from '@/components/staff/types';
import StaffDetailClient from './page-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member: StaffWithDetails | null = await getStaffById(id) as StaffWithDetails | null;
  if (!member) return { title: 'Staff no encontrado — Ara Zevallos Studio' };
  return { title: `${member.name} — Staff — Ara Zevallos Studio` };
}

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member: StaffWithDetails | null = await getStaffById(id) as StaffWithDetails | null;
  return <StaffDetailClient staffId={id} initialMember={member} />;
}
