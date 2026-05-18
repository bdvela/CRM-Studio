import 'server-only';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost';
const RESERVED_SLUGS = new Set([
  'www', 'app', 'api', 'admin', 'auth', 'static', 'assets',
  'mail', 'billing', 'support',
]);

export interface BusinessBranding {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  logo_emoji: string;
  theme_color: string;
  currency_symbol: string;
  locale: string;
}

export function extractSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const h = host.split(':')[0].toLowerCase();

  // Dev override via env var
  if (process.env.NEXT_PUBLIC_DEV_TENANT_SLUG && (h === 'localhost' || h === '127.0.0.1')) {
    return process.env.NEXT_PUBLIC_DEV_TENANT_SLUG;
  }

  // *.localhost (modern browsers resolve automatically)
  if (h.endsWith('.localhost')) {
    const sub = h.slice(0, -'.localhost'.length).split('.')[0];
    return RESERVED_SLUGS.has(sub) ? null : sub;
  }

  // Root domain itself
  if (h === ROOT_DOMAIN || h === `www.${ROOT_DOMAIN}`) return null;

  // *.ROOT_DOMAIN
  if (h.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = h.slice(0, -(`.${ROOT_DOMAIN}`).length).split('.')[0];
    return RESERVED_SLUGS.has(sub) ? null : sub;
  }

  return null;
}

export async function getCurrentBusiness(): Promise<BusinessBranding | null> {
  try {
    const hdrs = await headers();
    const slug = extractSlugFromHost(hdrs.get('host'));
    if (!slug) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from('businesses')
      .select('id, slug, name, short_name, logo_emoji, theme_color, currency_symbol, locale')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    return data ?? null;
  } catch {
    return null;
  }
}
