import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { business_id, email, role, staff_id } = await request.json();

    if (!business_id || !email || !role) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    if (!['admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    // Verify caller is owner or admin of this business
    const { data: member } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', business_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }
    // Admin can only invite staff
    if (member.role === 'admin' && role !== 'staff') {
      return NextResponse.json({ error: 'Admin solo puede invitar con rol staff' }, { status: 403 });
    }

    // Create invitation record
    const { data: inv, error: invErr } = await supabase
      .from('invitations')
      .insert({ business_id, email, role, staff_id: staff_id || null, invited_by: user.id })
      .select('token')
      .single();

    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

    // Build accept URL
    const host = request.headers.get('host') ?? '';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const acceptUrl = `${protocol}://${host}/invite/${inv.token}`;

    // Send invite email via Supabase service role (falls back to just returning the URL in dev)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);
      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: acceptUrl,
        data: { invitation_token: inv.token },
      });
    }

    return NextResponse.json({ ok: true, accept_url: acceptUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error interno' }, { status: 500 });
  }
}
