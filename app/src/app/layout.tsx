import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppLayout, MobileNav } from '@/components/layout/shell';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { SerwistProvider } from '@serwist/turbopack/react';
import { getCurrentBusiness } from '@/lib/tenant/resolve';

export async function generateMetadata(): Promise<Metadata> {
  const biz = await getCurrentBusiness();
  const name = biz?.name ?? 'CRM Studio';
  const shortName = biz?.short_name ?? name;

  return {
    title: { default: name, template: `%s | ${name}` },
    description: `Gestión integral — ${name}`,
    manifest: '/manifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: shortName,
    },
    formatDetection: { telephone: false },
    icons: {
      icon: '/icon-512.png',
      apple: '/apple-touch-icon.png',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#db2777',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-zinc-50 text-zinc-900">
        <Providers>
          <SerwistProvider swUrl="/serwist/sw.js">
            <AppLayout>{children}</AppLayout>
            <MobileNav />
            <Toaster richColors position="top-center" />
          </SerwistProvider>
        </Providers>
      </body>
    </html>
  );
}
