import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sidebar, MobileNav } from '@/components/layout/shell';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'CRM Salón de Belleza',
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
      <body className="bg-gray-50 text-gray-900">
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {children}
              </main>
            </div>
          </div>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
