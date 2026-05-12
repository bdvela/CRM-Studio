import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppLayout, MobileNav } from '@/components/layout/shell';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'CRM Salón de Belleza',
    template: '%s | Ara Zevallos Studio',
  },
  description: 'Gestión integral para salón de belleza',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ara Zevallos Studio',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-zinc-50 text-zinc-900">
        <Providers>
          <AppLayout>{children}</AppLayout>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}