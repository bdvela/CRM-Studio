import { get, set, del, keys, type UseStore } from 'idb-keyval';

const STORE_PREFIX = 'qc:';

function storeKey(key: string): string {
  return `${STORE_PREFIX}${key}`;
}

function isStoreKey(k: IDBValidKey): boolean {
  return String(k).startsWith(STORE_PREFIX);
}

function originalKey(k: IDBValidKey): string {
  return String(k).slice(STORE_PREFIX.length);
}

export interface PersistentCacheEntry {
  value: unknown;
  expiresAt: number;
  staleAt: number;
}

let storeAvailable = true;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

export async function persistEntry(key: string, entry: PersistentCacheEntry): Promise<void> {
  if (!storeAvailable || !isBrowser()) return;
  try {
    await set(storeKey(key), entry);
  } catch {
    storeAvailable = false;
  }
}

export async function loadPersistedEntries(): Promise<Map<string, PersistentCacheEntry>> {
  const map = new Map<string, PersistentCacheEntry>();
  if (!isBrowser()) return map;

  try {
    const allKeys = await keys();
    for (const k of allKeys) {
      if (isStoreKey(k)) {
        const entry = await get<PersistentCacheEntry>(k);
        if (entry) {
          map.set(originalKey(k), entry);
        }
      }
    }
  } catch {
    storeAvailable = false;
  }

  return map;
}

export async function removePersistedEntry(key: string): Promise<void> {
  if (!storeAvailable || !isBrowser()) return;
  try {
    await del(storeKey(key));
  } catch {
    storeAvailable = false;
  }
}

export async function clearPersistentCache(): Promise<void> {
  if (!isBrowser()) return;
  try {
    const allKeys = await keys();
    const cacheKeys = allKeys.filter(isStoreKey);
    await Promise.all(cacheKeys.map(k => del(k)));
  } catch {
    storeAvailable = false;
  }
}
