import { getRedisClient } from '@packages/clients/redis';

export async function cacheItems(key: string, value: unknown, ttlSeconds = 60) {
  const redis = await getRedisClient();
  if (!redis) return;

  await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

export async function getCachedItems<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  const value = await redis.get(key);
  return value ? (JSON.parse(value) as T) : null;
}

export async function invalidateItems(...keysOrPatterns: string[]) {
  const redis = await getRedisClient();
  if (!redis) return;

  for (const keyOrPattern of keysOrPatterns) {
    if (!keyOrPattern.includes('*')) {
      await redis.del(keyOrPattern);
      continue;
    }

    // After creating a file inside a folder, invalidate every cached page for that folder.
    for await (const keys of redis.scanIterator({
      MATCH: keyOrPattern,
      COUNT: 100,
    })) {
      if (keys.length) await redis.del(keys);
    }
  }
}
