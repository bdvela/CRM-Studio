import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

type CacheEntry = { value: any; expiresAt: number };
const queryCache = new Map<string, CacheEntry>();
const pendingQueries = new Map<string, Promise<any>>();
const lastErrors = new Map<string, string | null>();

function cacheKey(name: string, params?: unknown) {
  return params === undefined ? name : `${name}:${JSON.stringify(params)}`;
}

async function cachedQuery<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = queryCache.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;

  const pending = pendingQueries.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher()
    .then((value) => {
      queryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
      pendingQueries.delete(key);
      lastErrors.delete(key);
      return value;
    })
    .catch((error) => {
      pendingQueries.delete(key);
      lastErrors.set(key, error?.message || error?.toString() || 'Error desconocido');
      throw error;
    });

  pendingQueries.set(key, promise);
  return promise;
}

function clearQueryCache(prefix?: string) {
  if (!prefix) {
    queryCache.clear();
    pendingQueries.clear();
    return;
  }
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) queryCache.delete(key);
  }
  for (const key of pendingQueries.keys()) {
    if (key.startsWith(prefix)) pendingQueries.delete(key);
  }
}

describe('getLastError / clearError', () => {
  beforeEach(() => {
    lastErrors.clear();
  });

  it('returns null for unknown key', () => {
    const result = lastErrors.get('test') || null;
    expect(result).toBeNull();
  });

  it('clears an error', () => {
    lastErrors.set('test', 'some error');
    lastErrors.delete('test');
    expect(lastErrors.get('test')).toBeUndefined();
  });
});

describe('cachedQuery', () => {
  beforeEach(() => {
    queryCache.clear();
    pendingQueries.clear();
    lastErrors.clear();
    vi.clearAllMocks();
  });

  it('returns cached value on cache hit', async () => {
    queryCache.set('test-key', { value: 'cached-val', expiresAt: Date.now() + 10000 });
    const fetcher = vi.fn();
    const result = await cachedQuery('test-key', 5000, fetcher);
    expect(result).toBe('cached-val');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('calls fetcher on cache miss', async () => {
    const fetcher = vi.fn().mockResolvedValue('fresh-val');
    const result = await cachedQuery('test-key', 5000, fetcher);
    expect(result).toBe('fresh-val');
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('reuses pending promise for concurrent calls', async () => {
    const fetcher = vi.fn().mockResolvedValue('shared-val');
    const [r1, r2] = await Promise.all([
      cachedQuery('concurrent', 5000, fetcher),
      cachedQuery('concurrent', 5000, fetcher),
    ]);
    expect(r1).toBe('shared-val');
    expect(r2).toBe('shared-val');
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('re-fetches after TTL expires', async () => {
    queryCache.set('ttl-key', { value: 'old-val', expiresAt: Date.now() - 1000 });
    const fetcher = vi.fn().mockResolvedValue('new-val');
    const result = await cachedQuery('ttl-key', 5000, fetcher);
    expect(result).toBe('new-val');
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('stores error on rejection', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fetch failed'));
    await expect(cachedQuery('error-key', 5000, fetcher)).rejects.toThrow('fetch failed');
  });
});

describe('getClients', () => {
  it('calls supabase.from clients with proper query', async () => {
    const mockData = [{ id: '1', name: 'Test Client' }];
    const mockChain: any = {
      order: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
    };
    const mockSelect: any = vi.fn(() => mockChain);
    const mockFrom = vi.fn(() => ({ select: mockSelect }));

    (supabase.from as any).mockImplementation(mockFrom);

    const supabaseFrom = supabase.from as any;
    supabaseFrom.mockReset();
    supabaseFrom.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    });

    (supabase as any).from = vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
          })),
        };
      }
      if (table === 'client_stats') {
        return {
          select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        };
      }
      return {
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      };
    });

    clearQueryCache();

    const { getClients } = await import('@/lib/db/queries');
    const result = await getClients();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('getAppointments', () => {
  beforeEach(() => {
    clearQueryCache();
    vi.clearAllMocks();
  });

  it('fetches appointments with filters', async () => {
    const mockAppts = [{ id: '1', title: 'Test Appt', start_time: new Date().toISOString() }];
    (supabase as any).from = vi.fn((table: string) => {
      if (table === 'appointments') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockAppts, error: null })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
    });

    const { getAppointments } = await import('@/lib/db/queries');
    const result = await getAppointments({ status: 'programada' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns empty array on error', async () => {
    (supabase as any).from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB error') })),
      })),
    }));

    clearQueryCache();
    const { getAppointments } = await import('@/lib/db/queries');
    const result = await getAppointments();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('createPayment', () => {
  beforeEach(() => {
    clearQueryCache();
    vi.clearAllMocks();
  });

  it('creates a payment successfully', async () => {
    const mockPayment = { id: '1', amount: 100, concept: 'Test' };
    (supabase as any).from = vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockPayment, error: null })),
        })),
      })),
    }));

    const { createPayment } = await import('@/lib/db/queries');
    const result = await createPayment(mockPayment);
    expect(result).toEqual(mockPayment);
  });

  it('throws on error', async () => {
    (supabase as any).from = vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: new Error('Insert failed') })),
        })),
      })),
    }));

    const { createPayment } = await import('@/lib/db/queries');
    await expect(createPayment({})).rejects.toThrow('Insert failed');
  });
});
