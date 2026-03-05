import Redis from 'ioredis';
import { createLogger } from '@auralux/shared';
import { config } from '../config';

const logger = createLogger('auth-redis');

let redis: Redis | null = null;
let isConnected = false;

// In-memory fallback for development without Redis
const memoryStore = new Map<string, { value: string; expiresAt: number | null }>();

function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt && entry.expiresAt < now) {
      memoryStore.delete(key);
    }
  }
}

setInterval(cleanupMemoryStore, 60000);

export async function initRedis(): Promise<void> {
  try {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          logger.warn('Redis connection failed after 5 retries, using in-memory fallback');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      isConnected = true;
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      isConnected = false;
      logger.warn('Redis error, using in-memory fallback', { error: err.message });
    });

    redis.on('close', () => {
      isConnected = false;
      logger.warn('Redis connection closed');
    });

    await redis.connect();
  } catch (error) {
    logger.warn('Failed to connect to Redis, using in-memory store', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    isConnected = false;
  }
}

export async function setSession(key: string, value: string, ttlSeconds?: number): Promise<void> {
  try {
    if (redis && isConnected) {
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, value);
      } else {
        await redis.set(key, value);
      }
    } else {
      memoryStore.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
      });
    }
  } catch (error) {
    logger.error('Failed to set session', { key, error });
    memoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }
}

export async function getSession(key: string): Promise<string | null> {
  try {
    if (redis && isConnected) {
      return await redis.get(key);
    } else {
      const entry = memoryStore.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        memoryStore.delete(key);
        return null;
      }
      return entry.value;
    }
  } catch (error) {
    logger.error('Failed to get session', { key, error });
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }
}

export async function deleteSession(key: string): Promise<void> {
  try {
    if (redis && isConnected) {
      await redis.del(key);
    }
    memoryStore.delete(key);
  } catch (error) {
    logger.error('Failed to delete session', { key, error });
    memoryStore.delete(key);
  }
}

export function getRedisStatus(): { connected: boolean; mode: string } {
  return {
    connected: isConnected,
    mode: isConnected ? 'redis' : 'memory',
  };
}

export async function shutdownRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    logger.info('Redis disconnected');
  }
}
