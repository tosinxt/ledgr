// Simple frontend caching utilities
// - JSON: localStorage with TTL
// - Blob: in-memory Map with TTL (not persisted)

export type CacheEntry<T> = {
  v: T;
  e: number; // expiry timestamp ms
};

const LS_PREFIX = 'cache:';

export function setJSONCache<T>(key: string, value: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { v: value, e: Date.now() + ttlMs };
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Ignore localStorage failures (e.g., private mode, quota exceeded)
    return;
  }
}

export function getJSONCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const { v, e } = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > e) {
      localStorage.removeItem(LS_PREFIX + key);
      return null;
    }
    return v as T;
  } catch {
    return null;
  }
}

export function clearCacheKey(key: string): void {
  try {
    localStorage.removeItem(LS_PREFIX + key);
  } catch {
    // ignore
    return;
  }
}

// Blob cache (memory only)
const blobCache = new Map<string, { b: Blob; e: number; name?: string }>();

export function setBlobCache(key: string, blob: Blob, ttlMs: number, filename?: string) {
  blobCache.set(key, { b: blob, e: Date.now() + ttlMs, name: filename });
}

export function getBlobCache(key: string): { blob: Blob; filename?: string } | null {
  const hit = blobCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.e) {
    blobCache.delete(key);
    return null;
  }
  return { blob: hit.b, filename: hit.name };
}

export function clearBlobCacheKey(key: string) {
  blobCache.delete(key);
}
