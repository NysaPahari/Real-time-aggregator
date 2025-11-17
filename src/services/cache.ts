// src/services/cache.ts

import Redis from 'ioredis';

// We are creating a "mock" or "fake" Redis object
// This allows the server to run without a real Redis connection
const redis = {
  on: (event: string, callback: (err?: Error) => void) => {
    // Call the 'error' callback once to simulate a connection failure
    if (event === 'error') {
      callback(new Error('Redis is not connected (mock mode).'));
    }
  },
  status: 'end', // Pretend it's not connected
  get: async (key: string): Promise<string | null> => {
    console.log(`[Cache Mock] GET: ${key} (returning null)`);
    return null; // Always return null as if cache is empty
  },
  set: async (
    key: string,
    value: any,
    mode?: string,
    ttl?: number
  ): Promise<void> => {
    console.log(`[Cache Mock] SET: ${key} (caching disabled)`);
    return; // Do nothing
  },
};

redis.on('error', (err) => {
  console.error('[Redis] Connection Error:', err.message);
  console.log(
    '[Redis] This is normal in mock mode. Caching will be disabled.'
  );
});

redis.on('connect', () => {
  // This will not be called in mock mode, which is fine
  console.log('[Redis] Connected successfully.');
});

const DEFAULT_TTL_SECONDS = 30;

export const getCache = async <T>(key: string): Promise<T | null> => {
  // We check the 'status' of our mock object
  if (redis.status !== 'end') {
    try {
      const data = await redis.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      console.error(`[Redis] Error getting cache for key: ${key}`, error);
      return null;
    }
  }
  return null; // Return null if "not connected"
};

export const setCache = async (
  key: string,
  value: any,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> => {
  if (redis.status !== 'end') {
    try {
      const stringValue = JSON.stringify(value);
      await redis.set(key, stringValue, 'EX', ttlSeconds);
    } catch (error) {
      console.error(`[Redis] Error setting cache for key: ${key}`, error);
    }
  }
};