'use client';

import { use, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/auth-context';
import { Check, AlertCircle } from 'lucide-react';

interface Props {
  paramsPromise: Promise<{ token: string }>;
}

export default function InviteClient({ paramsPromise }: Props) {
  const { token } = use(paramsPromise);
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepting' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setStatus('ready'); return; }
    // User already logged in — accept immediately
    accept();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function accept() {
    setStatus('accepting');
    try {
      const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
      if (error) throw new Error(error.message);
      setBusinessId(data as string);
      setStatus('done');
      // Redirect to the business subdomain
      setTimeout(() => {
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost';
        window.location.href = `${window.location.protocol}//${window.location.host.replace(/.*\./, '')}/`;
      }, 2000);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Error al aceptar la invitación');
      setStatus('error');
    }
  }

  if (status === 'loading' || status === 'accepting') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 border-2 border-salon-200 border-t-salon-600 rounded-full animate-spin" />
    </div>
  );

  if (status === 'done') return (
    <div className="min-h-screen bg-gradient-to-br from-salon-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Check className="size-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">¡Bienvenido al equipo!</h2>
        <p className="text-sm text-zinc-500">Redirigiendo a tu negocio…</p>
      </div>
    </div>
  );

  if (status === 'error') return (
    <div className="min-h-screen bg-gradient-to-br from-salon-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="text-center space-y-3 max-w-sm">
        <AlertCircle className="size-12 text-red-400 mx-auto" />
        <h2 className="text-lg font-semibold text-zinc-900">Invitación inválida</h2>
        <p className="text-sm text-zinc-500">{errorMsg}</p>
        <a href="/login" className="inline-block mt-2 px-4 py-2 rounded-xl bg-salon-600 text-white text-sm font-medium">
          Ir al inicio
        </a>
      </div>
    </div>
  );

  // status === 'ready' && no user — show info, auto-accept after login (Supabase magic link handles this)
  return (
    <div className="min-h-screen bg-gradient-to-br from-salon-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-salon-500 to-accent-600 flex items-center justify-center mx-auto">
          <span className="text-3xl">🌸</span>
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">Fuiste invitado a un negocio</h2>
        <p className="text-sm text-zinc-500">
          Iniciá sesión o creá tu cuenta para aceptar la invitación.
        </p>
        <div className="flex flex-col gap-3">
          <a href={`/login?redirect=/invite/${token}`}
            className="py-2.5 rounded-xl bg-salon-600 text-white text-sm font-medium hover:bg-salon-700 transition-colors block text-center">
            Iniciar sesión
          </a>
        </div>
      </div>
    </div>
  );
}
