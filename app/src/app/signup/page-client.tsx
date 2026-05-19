'use client';

import { useState, FormEvent, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Mail, Lock, Eye, EyeOff, Building2, AtSign, Check, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost';
const RESERVED = new Set(['www','app','api','admin','auth','static','assets','mail','billing','support']);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
}

export default function SignupClient() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(slugify(name));
    }
  }, [name, slugEdited]);

  // Debounced slug availability check
  const checkSlug = useCallback(async (s: string) => {
    if (!s || s.length < 2) { setSlugStatus('invalid'); return; }
    if (!/^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/.test(s)) { setSlugStatus('invalid'); return; }
    if (RESERVED.has(s)) { setSlugStatus('taken'); return; }
    setSlugStatus('checking');
    const { data } = await supabase.from('businesses').select('id').eq('slug', s).maybeSingle();
    setSlugStatus(data ? 'taken' : 'available');
  }, []);

  useEffect(() => {
    if (!slug) { setSlugStatus('idle'); return; }
    const timer = setTimeout(() => checkSlug(slug), 500);
    return () => clearTimeout(timer);
  }, [slug, checkSlug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || slugStatus !== 'available') return;
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setSubmitting(true);
    setError(null);
    try {
      // 1. Create auth user
      const authErr = await signUp(email.trim(), password);
      if (authErr) { setError(authErr); return; }

      // 2. Check if session was established (email confirmation might be required)
      let attempts = 0;
      let session = null;
      while (attempts < 5 && !session) {
        await new Promise(r => setTimeout(r, 600));
        const { data } = await supabase.auth.getSession();
        session = data.session;
        attempts++;
      }

      if (!session) {
        // Email confirmation required — show message
        setError('Revisá tu email para confirmar tu cuenta, luego volvé a intentar.');
        setSubmitting(false);
        return;
      }

      // 3. Create business with confirmed session
      const { error: bizErr } = await supabase.rpc('create_business_with_owner', {
        p_slug: slug,
        p_name: name.trim(),
      });
      if (bizErr) { setError(bizErr.message); return; }

      setDone(true);
      // Redirect to subdomain
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';
      const base = ROOT_DOMAIN === 'localhost' ? `localhost${port}` : ROOT_DOMAIN;
      setTimeout(() => {
        window.location.href = `${protocol}//${slug}.${base}/onboarding`;
      }, 1500);
    } catch (e: any) {
      setError(e?.message ?? 'Error al crear el negocio');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-salon-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Check className="size-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">¡Negocio creado!</h2>
        <p className="text-sm text-zinc-500">Redirigiendo a tu espacio…</p>
      </div>
    </div>
  );

  const slugOk = slugStatus === 'available';
  const canSubmit = name.trim().length >= 2 && slugOk && email.trim() && password.length >= 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-salon-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-salon-500 to-accent-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-salon-200/50">
            <span className="text-white text-3xl">🌸</span>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Crear mi negocio</h1>
          <p className="text-sm text-zinc-500 mt-1">Tu espacio de gestión en minutos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3" role="alert">{error}</div>
          )}

          {/* Business name */}
          <div className="space-y-1">
            <label htmlFor="biz-name" className="text-sm font-medium text-zinc-700">Nombre del negocio <span className="text-red-500">*</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" aria-hidden="true" />
              <input
                id="biz-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Mi Studio de Belleza"
                maxLength={80}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <label htmlFor="biz-slug" className="text-sm font-medium text-zinc-700">Subdominio <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 focus-within:ring-2 focus-within:ring-salon-500 bg-white overflow-hidden">
              <AtSign className="size-4 text-zinc-400 ml-3 flex-shrink-0" aria-hidden="true" />
              <input
                id="biz-slug"
                type="text"
                value={slug}
                onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
                placeholder="mi-studio"
                maxLength={30}
                className="flex-1 py-2.5 px-1 text-sm outline-none bg-transparent"
                style={{ fontSize: '16px' }}
              />
              <span className="text-xs text-zinc-400 pr-3 flex-shrink-0 whitespace-nowrap">
                .{ROOT_DOMAIN === 'localhost' ? 'localhost' : ROOT_DOMAIN}
              </span>
              <div className="pr-2">
                {slugStatus === 'checking' && <div className="size-4 border-2 border-zinc-300 border-t-salon-500 rounded-full animate-spin" />}
                {slugStatus === 'available' && <Check className="size-4 text-green-500" />}
                {(slugStatus === 'taken' || slugStatus === 'invalid') && <X className="size-4 text-red-500" />}
              </div>
            </div>
            {slugStatus === 'taken' && <p className="text-xs text-red-600">Este subdominio ya está en uso</p>}
            {slugStatus === 'invalid' && slug.length > 0 && <p className="text-xs text-red-600">Solo letras, números y guiones (mín. 2 chars)</p>}
            {slugStatus === 'available' && <p className="text-xs text-green-600">¡Disponible!</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="signup-email" className="text-sm font-medium text-zinc-700">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" aria-hidden="true" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="signup-password" className="text-sm font-medium text-zinc-700">Contraseña <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" aria-hidden="true" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
                style={{ fontSize: '16px' }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" tabIndex={-1}
                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-salon-500 to-accent-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {submitting ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {submitting ? 'Creando...' : 'Crear mi negocio'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400 mt-4">
          ¿Ya tenés cuenta?{' '}
          <a href="/login" className="text-salon-600 hover:underline font-medium">Iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}
