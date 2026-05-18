'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Branding {
  name: string;
  short_name: string;
  logo_emoji: string;
}

async function fetchBranding(): Promise<Branding | null> {
  try {
    const host = window.location.host.split(':')[0].toLowerCase();
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost';
    let slug: string | null = null;

    if (host.endsWith('.localhost')) slug = host.slice(0, -'.localhost'.length).split('.')[0];
    else if (host.endsWith(`.${rootDomain}`)) slug = host.slice(0, -(`.${rootDomain}`).length).split('.')[0];
    else if (process.env.NEXT_PUBLIC_DEV_TENANT_SLUG) slug = process.env.NEXT_PUBLIC_DEV_TENANT_SLUG;

    if (!slug) return null;

    const { data } = await supabase.rpc('get_business_branding', { p_slug: slug });
    if (data && data.length > 0) return data[0] as Branding;
    return null;
  } catch {
    return null;
  }
}

export default function LoginClient() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [branding, setBranding] = useState<Branding | null>(null);

  useEffect(() => {
    fetchBranding().then(setBranding);
  }, []);

  // Check for no_access error from middleware redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'no_access') {
      setError('No tenés acceso a este negocio. Contactá al administrador.');
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const err = await signIn(email.trim(), password);
    if (err) {
      setError(err === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : err);
      setSubmitting(false);
    }
  }

  const displayName = branding?.name ?? 'CRM Studio';
  const displayEmoji = branding?.logo_emoji ?? '🌸';

  return (
    <div className="min-h-screen bg-gradient-to-br from-salon-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-salon-500 to-accent-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-salon-200/50">
            <span className="text-white text-3xl">{displayEmoji}</span>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">{displayName}</h1>
          <p className="text-sm text-zinc-500 mt-1">Inicia sesión para continuar</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" aria-hidden="true" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent transition-shadow"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent transition-shadow"
                style={{ fontSize: '16px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!email.trim() || submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-salon-500 to-accent-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            {submitting ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        {!branding && (
          <p className="text-center text-xs text-zinc-400 mt-4">
            ¿Sos dueño de un salón?{' '}
            <a href="/signup" className="text-salon-600 hover:underline font-medium">Crear mi negocio</a>
          </p>
        )}
        <p className="text-center text-xs text-zinc-400 mt-3">CRM Studio</p>
      </div>
    </div>
  );
}
