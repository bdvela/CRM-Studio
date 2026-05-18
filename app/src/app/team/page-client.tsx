'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/layout/shell';
import { Mail, UserPlus, Clock, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type MemberRow = { id: string; role: string; joined_at: string; user_id: string; staff?: { name: string } | null };
type InviteRow = { id: string; email: string; role: string; created_at: string; expires_at: string; staff?: { name: string } | null };

export default function TeamClient() {
  const { business, memberRole } = useAuth();
  const { push } = useRouter();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [staffOptions, setStaffOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ staff_id: '', email: '', role: 'staff' as 'admin' | 'staff' });
  const [sending, setSending] = useState(false);

  // Only owner can access this page
  useEffect(() => {
    if (!loading && memberRole !== 'owner') push('/');
  }, [memberRole, loading, push]);

  const load = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [membersRes, invitesRes, staffRes] = await Promise.all([
        supabase.from('business_members').select('id, role, joined_at, user_id, staff:staff_id(name)').eq('business_id', business.id),
        supabase.from('invitations').select('id, email, role, created_at, expires_at, staff:staff_id(name)').eq('business_id', business.id).is('accepted_at', null).gt('expires_at', new Date().toISOString()),
        supabase.from('staff').select('id, name').eq('business_id', business.id).eq('active', true).order('name'),
      ]);
      setMembers((membersRes.data ?? []) as unknown as MemberRow[]);
      setInvites((invitesRes.data ?? []) as unknown as InviteRow[]);
      // Only show staff not yet linked to a member
      const linkedStaffIds = new Set((membersRes.data ?? []).map((m: any) => m.staff_id).filter(Boolean));
      setStaffOptions((staffRes.data ?? []).filter(s => !linkedStaffIds.has(s.id)));
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => { load(); }, [load]);

  // Auto-fill email from staff
  useEffect(() => {
    // noop — email is always manual input
  }, [form.staff_id]);

  async function sendInvite() {
    if (!form.email.trim() || !business?.id) return;
    setSending(true);
    try {
      const res = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: business.id, email: form.email.trim(), role: form.role, staff_id: form.staff_id || null }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? 'Error al enviar invitación');
      } else {
        toast.success('Invitación enviada');
        setForm({ staff_id: '', email: '', role: 'staff' });
        load();
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setSending(false);
    }
  }

  async function revokeInvite(id: string) {
    await supabase.from('invitations').delete().eq('id', id);
    load();
  }

  const roleLabel = (r: string) => r === 'owner' ? 'Dueño' : r === 'admin' ? 'Admin' : 'Staff';

  if (memberRole !== 'owner') return null;

  return (
    <>
      <Header title="Equipo" />
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">

        {/* Invite form */}
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <UserPlus className="size-4 text-salon-600" /> Invitar miembro
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1">Staff (opcional)</label>
              <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-salon-500">
                <option value="">— Sin vincular a staff —</option>
                {staffOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="artista@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-1">Rol</label>
              <div className="flex gap-3">
                {(['staff', 'admin'] as const).map(r => (
                  <label key={r} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-colors ${form.role === r ? 'border-salon-400 bg-salon-50 text-salon-700' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
                    <input type="radio" name="role" value={r} checked={form.role === r} onChange={() => setForm(f => ({ ...f, role: r }))} className="sr-only" />
                    {r === 'staff' ? 'Staff' : 'Admin'}
                  </label>
                ))}
              </div>
            </div>

            <button onClick={sendInvite} disabled={!form.email.trim() || sending}
              className="w-full py-2.5 rounded-xl bg-salon-600 text-white text-sm font-medium hover:bg-salon-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {sending ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail className="size-4" />}
              {sending ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        </section>

        {/* Current members */}
        <section className="space-y-3">
          <h2 className="font-semibold text-zinc-900">Miembros actuales ({members.length})</h2>
          {members.map(m => (
            <div key={m.id} className="rounded-2xl border border-zinc-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900 text-sm">{(m.staff as any)?.name ?? 'Sin perfil de staff'}</p>
                <p className="text-xs text-zinc-400">{roleLabel(m.role)}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'owner' ? 'bg-amber-100 text-amber-700' : m.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                {roleLabel(m.role)}
              </span>
            </div>
          ))}
        </section>

        {/* Pending invitations */}
        {invites.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
              <Clock className="size-4 text-zinc-400" /> Invitaciones pendientes
            </h2>
            {invites.map(inv => (
              <div key={inv.id} className="rounded-2xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 text-sm truncate">{inv.email}</p>
                  <p className="text-xs text-zinc-400">{roleLabel(inv.role)} · expira {new Date(inv.expires_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</p>
                </div>
                <button onClick={() => revokeInvite(inv.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors" aria-label="Revocar">
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
