/**
 * @auralux/redis-client
 * Typed Redis wrapper with connection pooling, health checks,
 * and convenience methods for caching patterns (cache-aside, TTL, pub/sub).
 */

import Redis, { RedisOptions } from 'ioredis';

export interface RedisClientConfig {
  host: string;
  port: number;
  password?: string;
  keyPrefix?: string;
  db?: number;
  maxRetriesPerRequest?: number;
}

/**
 * Redis cache manager — provides typed get/set with JSON serialization,
 * TTL management, and cache-aside pattern support.
 */
export class RedisCacheManager {
  private client: Redis;
  private isConnected = false;

  constructor(config: RedisClientConfig) {
    const options: RedisOptions = {
      host: config.host,
      port: config.port,
      password: config.password || undefined,
      keyPrefix: config.keyPrefix || 'auralux:',
      db: config.db || 0,
      maxRetriesPerRequest: config.maxRetriesPerRequest ?? 3,
      retryStrategy: (times: number) => {
        if (times > 10) return null; // Stop retrying
        return Math.min(times * 200, 5000);
      },
      lazyConnect: true,
    };

    this.client = new Redis(options);

    this.client.on('connect', () => {
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });
  }

  /** Connect to Redis */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  /** Disconnect gracefully */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
    }
  }

  /** Health check */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /** ─── Basic Operations ──────────────────────────────── */

  /** Get a cached value with automatic JSON deserialization */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /** Set a value with optional TTL (seconds) */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  /** Delete a key */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Check if key exists */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /** Set TTL on existing key */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  /** ─── Cache-Aside Pattern ───────────────────────────── */

  /**
   * Implements cache-aside (lazy-loading) pattern:
   * 1. Check cache first
   * 2. On miss, call the loader function
   * 3. Store result in cache with TTL
   * 4. Return the result
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await loader();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /** ─── Counter Operations ────────────────────────────── */

  /** Increment a counter (atomic) */
  async increment(key: string, amount = 1): Promise<number> {
    return this.client.incrby(key, amount);
  }

  /** Decrement a counter (atomic) */
  async decrement(key: string, amount = 1): Promise<number> {
    return this.client.decrby(key, amount);
  }

  /** ─── Rate Limiting ─────────────────────────────────── */

  /**
   * Sliding window rate limiter using Redis sorted sets.
   * Returns true if request is allowed, false if limit exceeded.
   */
  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const key = `ratelimit:${identifier}`;

    const pipeline = this.client.pipeline();
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Count current entries
    pipeline.zcard(key);
    // Add current request
    pipeline.zadd(key, now.toString(), `${now}:${Math.random()}`);
    // Set key expiry
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();
    const currentCount = (results?.[1]?.[1] as number) || 0;

    return {
      allowed: currentCount < maxRequests,
      remaining: Math.max(0, maxRequests - currentCount - 1),
      resetAt: now + windowMs,
    };
  }

  /** ─── Hash Operations (for structured data) ─────────── */

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  /** ─── Raw Client Access ─────────────────────────────── */

  /** Access the underlying ioredis client for advanced operations */
  getClient(): Redis {
    return this.client;
  }

  /** Check connection status */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export default RedisCacheManager;
