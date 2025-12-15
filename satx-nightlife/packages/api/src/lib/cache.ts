/**
 * Caching Utilities
 * KV-based caching with TTL support
 */

/**
 * Get cached response from KV
 */
export async function getCachedResponse<T>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  try {
    const cached = await kv.get(key, 'json');
    return cached as T | null;
  } catch (error) {
    console.error(`[Cache] Error reading ${key}:`, error);
    return null;
  }
}

/**
 * Set cached response in KV with TTL
 */
export async function setCachedResponse(
  kv: KVNamespace,
  key: string,
  data: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    await kv.put(key, JSON.stringify(data), {
      expirationTtl: ttlSeconds,
    });
  } catch (error) {
    console.error(`[Cache] Error writing ${key}:`, error);
  }
}

/**
 * Delete cached response
 */
export async function deleteCachedResponse(
  kv: KVNamespace,
  key: string
): Promise<void> {
  try {
    await kv.delete(key);
  } catch (error) {
    console.error(`[Cache] Error deleting ${key}:`, error);
  }
}

/**
 * Get or set cached response (cache-aside pattern)
 */
export async function getOrSetCached<T>(
  kv: KVNamespace,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await getCachedResponse<T>(kv, key);

  if (cached) {
    return cached;
  }

  const fresh = await fetcher();
  await setCachedResponse(kv, key, fresh, ttlSeconds);
  return fresh;
}

/**
 * Invalidate cache entries matching a prefix
 */
export async function invalidateCachePrefix(
  kv: KVNamespace,
  prefix: string
): Promise<number> {
  let deleted = 0;
  let cursor: string | undefined;

  do {
    const list = await kv.list({ prefix, cursor });

    for (const key of list.keys) {
      await kv.delete(key.name);
      deleted++;
    }

    cursor = list.cursor;
  } while (cursor);

  return deleted;
}

/**
 * Cache key builders for consistent key naming
 */
export const CacheKeys = {
  tonight: (lat: number, lng: number, radius: number, expertMode: boolean) =>
    `tonight:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}:${expertMode}`,

  monthly: (year: number, month: number, lat: number, lng: number, radius: number) =>
    `monthly:${year}:${month}:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}`,

  trending: (year: number, month: number, lat: number, lng: number, radius: number) =>
    `trending:${year}:${month}:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}`,

  venue: (idOrSlug: string) => `venue:${idOrSlug}`,

  yearStandings: (year: number) => `year:${year}`,

  config: (key: string) => `config:${key}`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  TONIGHT: 60,           // 1 minute
  MONTHLY: 3600,         // 1 hour
  TRENDING: 1800,        // 30 minutes
  VENUE: 300,            // 5 minutes
  YEAR: 3600,            // 1 hour
  CONFIG: 86400,         // 24 hours
};
