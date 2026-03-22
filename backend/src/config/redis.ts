import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const BASE_REDIS_OPTIONS = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 30000,
  connectTimeout: 10000,
  retryStrategy: (times: number) => Math.min(times * 200, 2000),
  reconnectOnError: () => true,
} as const;

function bindRedisLogs(client: Redis, label: string) {
  client.on('connect', () => console.log(`✅ Redis connected (${label})`));
  client.on('reconnecting', () => console.warn(`⚠️ Redis reconnecting (${label})`));

  client.on('error', (err: NodeJS.ErrnoException) => {
    const code = err.code || 'UNKNOWN';
    const transientCodes = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED']);

    if (transientCodes.has(code)) {
      console.warn(`⚠️ Redis transient error (${label}): ${code}`);
      return;
    }

    console.error(`❌ Redis error (${label}):`, err.message || err);
  });
}

export function createRedisClient(label: string): Redis {
  const client = new Redis(REDIS_URL, BASE_REDIS_OPTIONS);
  bindRedisLogs(client, label);
  return client;
}

export const redis = createRedisClient('app');

export const redisSubscriber = createRedisClient('subscriber');



export const CACHE_TTL = 3600; // 1 hour

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl = CACHE_TTL): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error('Cache set error:', err);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('Cache invalidate error:', err);
  }
}
