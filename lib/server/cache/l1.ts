// L1 cache: per-process in-memory TTL store.
//
// This layer is always available — it never depends on Redis and keeps working
// if Redis is down. It absorbs request bursts on a single server instance so
// repeat reads within the TTL window never touch Redis (protecting free-tier
// command/connection limits) or the database.

type L1Entry = {
  value: unknown;
  expiresAt: number;
  tags: string[];
};

const store = new Map<string, L1Entry>();

// Hard cap on the number of L1 entries so a single process can never grow the
// in-memory map unbounded. We cache a small, fixed set of dashboard keys, so
// this is a generous ceiling that should never be hit in practice.
const MAX_ENTRIES = 500;

export function l1Get<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function l1Set(key: string, value: unknown, ttlMs: number, tags: string[]): void {
  if (ttlMs <= 0) return;
  if (store.size >= MAX_ENTRIES && !store.has(key)) {
    // Evict the oldest inserted entry (Map preserves insertion order).
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs, tags });
}

export function l1Delete(key: string): void {
  store.delete(key);
}

export function l1InvalidateTags(tags: string[]): void {
  if (tags.length === 0) return;
  const tagSet = new Set(tags);
  for (const [key, entry] of store) {
    if (entry.tags.some((tag) => tagSet.has(tag))) {
      store.delete(key);
    }
  }
}

export function l1Clear(): void {
  store.clear();
}
