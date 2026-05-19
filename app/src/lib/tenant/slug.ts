// Pure utility — no server-only imports, safe in Edge runtime (middleware)

const RESERVED_SLUGS = new Set([
  'www', 'app', 'api', 'admin', 'auth', 'static', 'assets',
  'mail', 'billing', 'support',
]);

export function extractSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const h = host.split(':')[0].toLowerCase();

  // Dev override via env var (works in Edge via process.env)
  if (process.env.NEXT_PUBLIC_DEV_TENANT_SLUG && (h === 'localhost' || h === '127.0.0.1')) {
    return process.env.NEXT_PUBLIC_DEV_TENANT_SLUG;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost';

  // *.localhost
  if (h.endsWith('.localhost')) {
    const sub = h.slice(0, -'.localhost'.length).split('.')[0];
    return RESERVED_SLUGS.has(sub) ? null : sub;
  }

  // Root domain itself
  if (h === rootDomain || h === `www.${rootDomain}`) return null;

  // *.ROOT_DOMAIN
  if (h.endsWith(`.${rootDomain}`)) {
    const sub = h.slice(0, -(`.${rootDomain}`).length).split('.')[0];
    return RESERVED_SLUGS.has(sub) ? null : sub;
  }

  return null;
}
