'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/auth-context';
import { Check, ChevronRight } from 'lucide-react';

const CURRENCIES = [
  { value: 'PEN', label: 'PEN — Soles peruanos', symbol: 'S/' },
  { value: 'USD', label: 'USD — Dólares', symbol: '$' },
  { value: 'ARS', label: 'ARS — Pesos argentinos', symbol: '$' },
  { value: 'COP', label: 'COP — Pesos colombianos', symbol: '$' },
  { value: 'MXN', label: 'MXN — Pesos mexicanos', symbol: '$' },
];

const LOCALES = [
  { value: 'es-PE', label: 'Español (Perú)' },
  { value: 'es-MX', label: 'Español (México)' },
  { value: 'es-AR', label: 'Español (Argentina)' },
  { value: 'es-CO', label: 'Español (Colombia)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'en-US', label: 'English (US)' },
];

const COUNTRY_CODES = [
  { value: '+51', label: '🇵🇪 +51 Perú' },
  { value: '+1',  label: '🇺🇸 +1 EEUU' },
  { value: '+54', label: '🇦🇷 +54 Argentina' },
  { value: '+57', label: '🇨🇴 +57 Colombia' },
  { value: '+52', label: '🇲🇽 +52 México' },
];

const EMOJIS = ['🌸','💅','✨','💄','👁️','🦋','🌺','💕','🌟','🎀','💅🏻','🪷'];

export default function OnboardingClient() {
  const { business } = useAuth();
  const { push } = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: business?.name ?? '',
    short_name: business?.short_name ?? '',
    logo_emoji: business?.logo_emoji ?? '🌸',
    theme_color: business?.theme_color ?? '#db2777',
    currency: 'PEN',
    currency_symbol: 'S/',
    phone_country: '+51',
    locale: 'es-PE',
  });

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!business?.id) { push('/'); return; }
    setSaving(true);
    try {
      await supabase.from('businesses').update({
        name: form.name.trim() || business.name,
        short_name: form.short_name.trim() || form.name.trim() || business.name,
        logo_emoji: form.logo_emoji,
        theme_color: form.theme_color,
        currency: form.currency,
        currency_symbol: form.currency_symbol,
        phone_country: form.phone_country,
        locale: form.locale,
      }).eq('id', business.id);
    } finally {
      setSaving(false);
      push('/');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-salon-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {[1, 2].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-salon-500' : 'bg-zinc-200'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              {step === 1 ? 'Identidad del negocio' : 'Configuración regional'}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {step === 1 ? 'Cómo aparecerá tu negocio' : 'Moneda y formato local'}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Nombre del negocio</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  maxLength={80}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Nombre corto <span className="text-zinc-400">(para header)</span></label>
                <input
                  type="text"
                  value={form.short_name}
                  onChange={e => set('short_name', e.target.value)}
                  placeholder={form.name.slice(0, 20)}
                  maxLength={20}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Emoji / ícono</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => set('logo_emoji', e)}
                      className={`size-10 rounded-xl text-xl flex items-center justify-center transition-colors ${form.logo_emoji === e ? 'bg-salon-100 ring-2 ring-salon-500' : 'bg-zinc-50 hover:bg-zinc-100'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Color de tema</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.theme_color} onChange={e => set('theme_color', e.target.value)}
                    className="size-10 rounded-lg border border-zinc-200 cursor-pointer" />
                  <span className="text-sm text-zinc-600 font-mono">{form.theme_color}</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Moneda</label>
                <select value={form.currency} onChange={e => {
                  const c = CURRENCIES.find(c => c.value === e.target.value);
                  set('currency', e.target.value);
                  if (c) set('currency_symbol', c.symbol);
                }} className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500 bg-white">
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Símbolo de moneda</label>
                <input type="text" value={form.currency_symbol} onChange={e => set('currency_symbol', e.target.value)}
                  maxLength={5}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Código de país (teléfonos)</label>
                <select value={form.phone_country} onChange={e => set('phone_country', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500 bg-white">
                  {COUNTRY_CODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Idioma / Locale</label>
                <select value={form.locale} onChange={e => set('locale', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-salon-500 bg-white">
                  {LOCALES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => push('/')}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
              Omitir
            </button>
            {step === 1 ? (
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 py-2.5 rounded-xl bg-salon-600 text-white text-sm font-medium hover:bg-salon-700 transition-colors flex items-center justify-center gap-2">
                Siguiente <ChevronRight className="size-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-salon-500 to-accent-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {saving ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="size-4" />}
                {saving ? 'Guardando...' : 'Finalizar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
