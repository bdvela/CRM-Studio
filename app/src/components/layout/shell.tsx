'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Palette, UserRound,
  CalendarDays, DollarSign, ChevronLeft, ChevronRight,
  Menu, X, UsersRound,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useOnlineStatus } from '@/context/online-context';
import { getQueueLength, isSyncing } from '@/lib/offline-queue';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

const ownerAdminNav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/citas', label: 'Citas', icon: CalendarDays },
  { href: '/servicios', label: 'Servicios', icon: Palette },
  { href: '/clientes', label: 'Clientas', icon: Users },
  { href: '/staff', label: 'Staff', icon: UserRound },
  { href: '/pagos', label: 'Pagos', icon: DollarSign },
  { href: '/team', label: 'Equipo', icon: UsersRound, ownerOnly: true },
] as const;

const staffNav = [
  { href: '/mis-citas', label: 'Mis Citas', icon: CalendarDays },
  { href: '/mis-comisiones', label: 'Mis Comisiones', icon: DollarSign },
];

const mobileNavItems = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard },
  { href: '/citas', label: 'Citas', icon: CalendarDays },
  { href: '/clientes', label: 'Clientas', icon: Users },
  { href: '/staff', label: 'Staff', icon: UserRound },
  { href: '/pagos', label: 'Pagos', icon: DollarSign },
];

function SidebarNav({ collapsed, onNavClick, isStaff, memberRole }: { collapsed: boolean; onNavClick?: () => void; isStaff?: boolean; memberRole?: string | null }) {
  const pathname = usePathname();
  const baseNav = isStaff ? staffNav : ownerAdminNav;
  const nav = (baseNav as readonly { href: string; label: string; icon: React.ElementType; ownerOnly?: boolean }[])
    .filter(item => !item.ownerOnly || memberRole === 'owner');

  return (
    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
      {nav.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={onNavClick}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              isActive ? 'bg-salon-50 text-salon-700' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
              collapsed && 'justify-center'
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="size-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, business, memberRole, loading, signOut } = useAuth();
  const isStaff = memberRole === 'staff';
  const { isOnline } = useOnlineStatus();
  const [tabletMenuOpen, setTabletMenuOpen] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    function update() { getQueueLength().then(setPendingCount); }
    update();
    const interval = setInterval(update, 5000);
    window.addEventListener('online', update);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', update);
    };
  }, []);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const noop = () => {};
    document.addEventListener('touchstart', noop, { passive: true });
    return () => document.removeEventListener('touchstart', noop);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="size-8 border-2 border-salon-200 border-t-salon-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  const isCalendarPage = pathname === '/citas' || pathname.startsWith('/citas/');
  const sidebarCollapsed = isCalendarPage || userCollapsed;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col border-r border-zinc-200 bg-white transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}>
        <div className="flex items-center gap-3 p-5 border-b border-zinc-100">
          <div className="size-10 rounded-xl bg-gradient-to-br from-salon-500 to-accent-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">{business?.logo_emoji ?? '🌸'}</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-semibold text-zinc-900 leading-tight">{business?.name ?? 'CRM Studio'}</h1>
              <p className="text-xs text-zinc-400">Gestión integral</p>
            </div>
          )}
        </div>

        <SidebarNav collapsed={sidebarCollapsed} isStaff={isStaff} memberRole={memberRole} />

        <div className="p-3 border-t border-zinc-100 space-y-1">
          <button
            onClick={() => setUserCollapsed(c => !c)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            {!sidebarCollapsed && <span className="text-xs">Colapsar</span>}
          </button>
          {pendingCount > 0 && (
            <div className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-amber-600">
              {isSyncing() ? (
                <RefreshCw className="size-3 animate-spin" />
              ) : (
                <CloudOff className="size-3" />
              )}
              {!sidebarCollapsed && (
                <span>{isSyncing() ? 'Sincronizando...' : `${pendingCount} cambio(s) pendiente(s)`}</span>
              )}
            </div>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label="Cerrar sesión"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!sidebarCollapsed && <span className="text-xs">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Tablet Sidebar Drawer */}
      <>
        {tabletMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setTabletMenuOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setTabletMenuOpen(false); }}
            role="button"
            tabIndex={0}
            aria-label="Cerrar menú"
          />
        )}
        <aside className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-zinc-200 z-50 transform transition-transform duration-300 lg:hidden',
          tabletMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex items-center justify-between p-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-gradient-to-br from-salon-500 to-accent-600 flex items-center justify-center">
                <span className="text-white text-lg">🌸</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-zinc-900 leading-tight">{business?.short_name ?? business?.name ?? 'CRM Studio'}</h1>
                <p className="text-xs text-zinc-400">Gestión integral</p>
              </div>
            </div>
            <button onClick={() => setTabletMenuOpen(false)} className="p-2 rounded-lg hover:bg-zinc-100">
              <X className="size-5 text-zinc-500" />
            </button>
          </div>

          <SidebarNav collapsed={false} isStaff={isStaff} memberRole={memberRole} onNavClick={() => setTabletMenuOpen(false)} />
        </aside>
      </>

      {/* Tablet menu button */}
      <button
        onClick={() => setTabletMenuOpen(true)}
        className="hidden md:flex lg:hidden fixed top-3 left-3 z-30 p-2 rounded-lg bg-white border border-zinc-200 shadow-md"
      >
        <Menu className="size-5 text-zinc-700" />
      </button>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0" style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}>
          <div className="hidden md:block lg:hidden h-12" />
          {children}
        </main>
      </div>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 safe-area-bottom pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around p-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[52px] transition-colors duration-200',
                isActive
                  ? 'text-salon-600 bg-salon-100/60 shadow-inner'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <item.icon className={cn('size-5 transition-transform duration-200', isActive && 'scale-110')} />
              <span className={cn(
                'text-[10px] font-medium truncate w-full text-center transition-colors duration-200',
                isActive && 'font-semibold'
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Header({ title, action }: { title?: string; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 min-h-[60px]">
        {title && <h1 className="text-base sm:text-lg md:text-xl font-semibold text-zinc-900 truncate max-w-[60%] sm:max-w-none">{title}</h1>}
        {!title && <div className="flex-1" />}
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </header>
  );
}
