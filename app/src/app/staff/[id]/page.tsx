import { getStaffById } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';
import type { StaffWithDetails } from '@/components/staff/types';
import StaffDetailClient from './page-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const member: StaffWithDetails | null = await getStaffById(id, supabase) as StaffWithDetails | null;
  if (!member) return { title: 'Staff no encontrado — Ara Zevallos Studio' };
  return { title: `${member.name} — Staff — Ara Zevallos Studio` };
}

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const member: StaffWithDetails | null = await getStaffById(id, supabase) as StaffWithDetails | null;
  return <StaffDetailClient staffId={id} initialMember={member} />;
}
