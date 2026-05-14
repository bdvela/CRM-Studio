import { getStaffById } from '@/lib/db/queries';
import StaffDetailClient from './page-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getStaffById(id);
  if (!member) return { title: 'Staff no encontrado — Ara Zevallos Studio' };
  return { title: `${(member as any).name} — Staff — Ara Zevallos Studio` };
}

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getStaffById(id);
  return <StaffDetailClient staffId={id} initialMember={member as any} />;
}
