import { get, set, del } from 'idb-keyval';
import { supabase } from './supabase/client';

const QUEUE_KEY = 'offline-mutation-queue';

const RETRY_DELAYS_MS = [5_000, 15_000, 60_000] as const;
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length;

export interface QueuedMutation {
  id: string;
  table: string;
  method: 'insert' | 'update' | 'delete';
  filters: Record<string, string>;
  data: Record<string, unknown>;
  attempts: number;
  createdAt: number;
  nextRetryAt?: number;
}

async function loadQueue(): Promise<QueuedMutation[]> {
  try {
    return (await get<QueuedMutation[]>(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedMutation[]): Promise<void> {
  await set(QUEUE_KEY, queue);
}

export async function enqueue(mutation: {
  table: string;
  method: QueuedMutation['method'];
  filters?: Record<string, string>;
  data?: Record<string, unknown>;
}): Promise<void> {
  const queue = await loadQueue();
  const filters = mutation.filters || {};

  // Dedup: skip if identical (table + method + filters) already queued
  const isDuplicate = queue.some(
    (m) =>
      m.table === mutation.table &&
      m.method === mutation.method &&
      JSON.stringify(m.filters) === JSON.stringify(filters)
  );
  if (isDuplicate) return;

  queue.push({
    id: crypto.randomUUID(),
    table: mutation.table,
    method: mutation.method,
    filters,
    data: mutation.data || {},
    attempts: 0,
    createdAt: Date.now(),
  });
  await saveQueue(queue);
}

async function dequeue(id: string): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.filter((m) => m.id !== id));
}

export async function getQueueLength(): Promise<number> {
  return (await loadQueue()).length;
}

export async function clearQueue(): Promise<void> {
  await del(QUEUE_KEY);
}

function isNetworkError(error: unknown): boolean {
  if (!navigator.onLine) return true;
  const msg = (error as any)?.message || String(error);
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('ERR_INTERNET_DISCONNECTED') ||
    msg.includes('Network request failed') ||
    msg.includes('ERR_CONNECTION_REFUSED') ||
    msg.includes('TypeError: fetch')
  );
}

async function replayMutation(m: QueuedMutation): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[offline-queue] session expired — skipping replay, will retry after login');
      return false;
    }

    switch (m.method) {
      case 'insert': {
        const { error } = await supabase.from(m.table).insert(m.data).select().single();
        if (error) throw error;
        return true;
      }
      case 'update': {
        let q = supabase.from(m.table).update(m.data);
        for (const [col, val] of Object.entries(m.filters)) {
          q = q.eq(col, val);
        }
        const { error } = await q.select().single();
        if (error) throw error;
        return true;
      }
      case 'delete': {
        let q = supabase.from(m.table).delete();
        for (const [col, val] of Object.entries(m.filters)) {
          q = q.eq(col, val);
        }
        const { error } = await q;
        if (error) throw error;
        return true;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error(`[offline-queue] replay failed — table: ${m.table}, method: ${m.method}`, error);
    return false;
  }
}

export async function processQueue(): Promise<{ synced: number; failed: number; skipped: number }> {
  const queue = await loadQueue();
  if (queue.length === 0) return { synced: 0, failed: 0, skipped: 0 };

  let synced = 0;
  let failed = 0;
  let skipped = 0;
  const now = Date.now();

  for (const m of queue) {
    if (m.attempts >= MAX_ATTEMPTS) {
      failed++;
      await dequeue(m.id);
      continue;
    }

    if (m.nextRetryAt && now < m.nextRetryAt) {
      skipped++;
      continue;
    }

    const success = await replayMutation(m);

    if (success) {
      synced++;
      await dequeue(m.id);
    } else {
      failed++;
      m.attempts++;
      m.nextRetryAt = now + (RETRY_DELAYS_MS[m.attempts - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]);
      await saveQueue(queue);
    }
  }

  return { synced, failed, skipped };
}

export async function tryMutation<T>(
  execute: () => Promise<T>,
  offlinePayload: {
    table: string;
    method: QueuedMutation['method'];
    filters?: Record<string, string>;
    data?: Record<string, unknown>;
  },
): Promise<{ data: T | null; offline: boolean }> {
  try {
    const data = await execute();
    return { data, offline: false };
  } catch (error) {
    if (isNetworkError(error)) {
      await enqueue(offlinePayload);
      return { data: null, offline: true };
    }
    throw error;
  }
}

let _syncInProgress = false;

export function isSyncing(): boolean {
  return _syncInProgress;
}

export function onOnline(): void {
  if (_syncInProgress) return;
  _syncInProgress = true;

  processQueue().finally(() => {
    _syncInProgress = false;
  });
}
