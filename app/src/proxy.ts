import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { extractSlugFromHost } from '@/lib/tenant/slug';

const PUBLIC_PATHS = ['/login', '/signup', '/serwist', '/invite', '/tenant-not-found', '/manifest'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host');
  const slug = extractSlugFromHost(host);
  const pathname = request.nextUrl.pathname;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ─── Root domain (no subdomain) ─────────────────────────────────────────────
  // Only public routes are allowed here; protected routes redirect to /signup
  if (!slug) {
    if (!isPublicPath(pathname) && pathname !== '/') {
      return NextResponse.redirect(new URL('/signup', request.url));
    }
    return supabaseResponse;
  }

  // ─── Subdomain — resolve business ────────────────────────────────────────────
  // RLS note: businesses table allows anon SELECT via biz_select_public policy
  const { data: biz } = await supabase
    .from('businesses')
    .select('id, active')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (!biz || !biz.active) {
    return NextResponse.rewrite(new URL('/tenant-not-found', request.url));
  }

  // Auth gate
  if (!user && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && pathname === '/login') {
    // memberRole check for staff redirect handled client-side in auth-context
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Membership gate
  if (user) {
    const { data: member } = await supabase
      .from('business_members')
      .select('role, staff_id')
      .eq('business_id', biz.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member && !isPublicPath(pathname)) {
      return NextResponse.redirect(new URL('/login?error=no_access', request.url));
    }

    if (member) {
      supabaseResponse.headers.set('x-member-role', member.role);
      supabaseResponse.headers.set('x-staff-id', member.staff_id ?? '');
    }
  }

  supabaseResponse.headers.set('x-business-id', biz.id);
  supabaseResponse.headers.set('x-business-slug', slug);

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|apple-touch-icon\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
