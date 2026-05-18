import { NextResponse } from 'next/server';
import { getCurrentBusiness } from '@/lib/tenant/resolve';

export async function GET() {
  const biz = await getCurrentBusiness();
  const name = biz?.name ?? 'CRM Studio';
  const shortName = biz?.short_name ?? name;
  const themeColor = biz?.theme_color ?? '#db2777';
  const emoji = biz?.logo_emoji ?? '🌸';

  const manifest = {
    name,
    short_name: shortName,
    description: `Gestión integral — ${name}`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fafafa',
    theme_color: themeColor,
    lang: 'es',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    shortcuts: [
      { name: 'Nueva cita', url: '/citas', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
    ],
    categories: ['business', 'productivity'],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  });
}
