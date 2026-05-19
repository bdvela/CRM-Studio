import 'server-only';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// Re-export pure slug extractor (also used by middleware/Edge runtime)
export { extractSlugFromHost } from './slug';

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

export async function getCurrentBusiness(): Promise<BusinessBranding | null> {
  try {
    const { extractSlugFromHost } = await import('./slug');
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
