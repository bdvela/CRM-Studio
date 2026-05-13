'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Palette, UserRound,
  CalendarDays, DollarSign, ChevronLeft, ChevronRight,
  TrendingUp, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/citas', label: 'Citas', icon: CalendarDays },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/servicios', label: 'Servicios', icon: Palette },
  { href: '/staff', label: 'Staff', icon: UserRound },
  { href: '/pagos', label: 'Pagos', icon: DollarSign },
  { href: '/reportes/comisiones', label: 'Comisiones', icon: TrendingUp },
];

const mobileNavItems = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard },
  { href: '/citas', label: 'Citas', icon: CalendarDays },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/staff', label: 'Staff', icon: UserRound },
  { href: '/pagos', label: 'Pagos', icon: DollarSign },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [tabletMenuOpen, setTabletMenuOpen] = useState(false);
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col border-r border-zinc-200 bg-white transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}>
        <div className="flex items-center gap-3 p-5 border-b border-zinc-100">
          <div className="size-10 rounded-xl bg-gradient-to-br from-salon-500 to-accent-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">🌸</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-semibold text-zinc-900 leading-tight">Ara Zevallos Studio</h1>
              <p className="text-xs text-zinc-400">Gestión integral</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive ? 'bg-salon-50 text-salon-700' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                  sidebarCollapsed && 'justify-center'
                )}
              >
                <item.icon className="size-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-100">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            {!sidebarCollapsed && <span className="text-xs">Colapsar</span>}
          </button>
        </div>
      </aside>

      {/* Tablet Sidebar Drawer */}
      <>
        {tabletMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setTabletMenuOpen(false)} />
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
                <h1 className="text-sm font-semibold text-zinc-900 leading-tight">Ara Zevallos</h1>
                <p className="text-xs text-zinc-400">Studio</p>
              </div>
            </div>
            <button onClick={() => setTabletMenuOpen(false)} className="p-2 rounded-lg hover:bg-zinc-100">
              <X className="size-5 text-zinc-500" />
            </button>
          </div>
          
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => setTabletMenuOpen(false)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive ? 'bg-salon-50 text-salon-700' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  )}
                >
                  <item.icon className="size-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
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
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <div className="hidden md:block lg:hidden h-12" /> {/* Spacer for tablet menu button */}
          {children}
        </main>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'hidden lg:flex flex-col border-r border-zinc-200 bg-white transition-all duration-300',
      collapsed ? 'lg:w-20' : 'lg:w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 lg:p-5 border-b border-zinc-100">
        <div className="size-10 rounded-xl bg-gradient-to-br from-salon-500 to-accent-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-lg">🌸</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-semibold text-zinc-900 leading-tight">Ara Zevallos Studio</h1>
            <p className="text-xs text-zinc-400">Gestión integral</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 lg:py-4 px-2 lg:px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                'w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-salon-50 text-salon-700'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                collapsed && 'justify-center'
              )}
            >
              <item.icon className="size-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 lg:p-3 border-t border-zinc-100 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-2 lg:px-3 py-2 rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          {!collapsed && <span className="text-xs">Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-40 safe-area-bottom pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-1 py-1">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg min-w-[60px]',
                isActive ? 'text-salon-600 bg-salon-50' : 'text-zinc-400'
              )}
            >
              <item.icon className="size-5" />
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
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
