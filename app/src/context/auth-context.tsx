'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';
import { setTenantContext } from '@/lib/tenant/context';
import type { BusinessBranding } from '@/lib/tenant/resolve';

export type MemberRole = 'owner' | 'admin' | 'staff';

interface AuthContextValue {
  user: User | null;
  business: BusinessBranding | null;
  memberRole: MemberRole | null;
  staffId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  business: null,
  memberRole: null,
  staffId: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
});

async function fetchMembership(userId: string): Promise<{
  business: BusinessBranding | null;
  memberRole: MemberRole | null;
  staffId: string | null;
}> {
  try {
    // Get slug from host
    const host = typeof window !== 'undefined' ? window.location.host.split(':')[0].toLowerCase() : '';
    let slug: string | null = null;

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost';
    if (host.endsWith('.localhost')) {
      slug = host.slice(0, -'.localhost'.length).split('.')[0];
    } else if (host.endsWith(`.${rootDomain}`)) {
      slug = host.slice(0, -(`.${rootDomain}`).length).split('.')[0];
    } else if (process.env.NEXT_PUBLIC_DEV_TENANT_SLUG) {
      slug = process.env.NEXT_PUBLIC_DEV_TENANT_SLUG;
    }

    if (!slug) return { business: null, memberRole: null, staffId: null };

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, slug, name, short_name, logo_emoji, theme_color, currency_symbol, locale')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (!biz) return { business: null, memberRole: null, staffId: null };

    const { data: member } = await supabase
      .from('business_members')
      .select('role, staff_id')
      .eq('business_id', biz.id)
      .eq('user_id', userId)
      .maybeSingle();

    return {
      business: biz as BusinessBranding,
      memberRole: (member?.role as MemberRole) ?? null,
      staffId: member?.staff_id ?? null,
    };
  } catch {
    return { business: null, memberRole: null, staffId: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<BusinessBranding | null>(null);
  const [memberRole, setMemberRole] = useState<MemberRole | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { push } = useRouter();

  const loadMembership = useCallback(async (userId: string) => {
    const result = await fetchMembership(userId);
    setBusiness(result.business);
    setMemberRole(result.memberRole);
    setStaffId(result.staffId);
    setTenantContext(result.business);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await loadMembership(u.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await loadMembership(u.id);
      } else {
        setBusiness(null);
        setMemberRole(null);
        setStaffId(null);
        setTenantContext(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadMembership]);

  useEffect(() => {
    if (loading) return;
    const publicPaths = ['/login', '/signup', '/onboarding'];
    const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (!user && !isPublic) push('/login');
    if (user && pathname === '/login') {
      push(memberRole === 'staff' ? '/mis-citas' : '/');
    }
  }, [user, loading, pathname, push, memberRole]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBusiness(null);
    setMemberRole(null);
    setStaffId(null);
    setTenantContext(null);
    push('/login');
  }, [push]);

  return (
    <AuthContext.Provider value={{ user, business, memberRole, staffId, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
