/**
 * @auralux/redis-client
 * Typed Redis wrapper with connection pooling, health checks,
 * and convenience methods for caching patterns (cache-aside, TTL, pub/sub).
 */
import Redis from 'ioredis';
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
export declare class RedisCacheManager {
    private client;
    private isConnected;
    constructor(config: RedisClientConfig);
    /** Connect to Redis */
    connect(): Promise<void>;
    /** Disconnect gracefully */
    disconnect(): Promise<void>;
    /** Health check */
    ping(): Promise<boolean>;
    /** ─── Basic Operations ──────────────────────────────── */
    /** Get a cached value with automatic JSON deserialization */
    get<T>(key: string): Promise<T | null>;
    /** Set a value with optional TTL (seconds) */
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    /** Delete a key */
    del(key: string): Promise<void>;
    /** Check if key exists */
    exists(key: string): Promise<boolean>;
    /** Set TTL on existing key */
    expire(key: string, ttlSeconds: number): Promise<void>;
    /** ─── Cache-Aside Pattern ───────────────────────────── */
    /**
     * Implements cache-aside (lazy-loading) pattern:
     * 1. Check cache first
     * 2. On miss, call the loader function
     * 3. Store result in cache with TTL
     * 4. Return the result
     */
    getOrSet<T>(key: string, loader: () => Promise<T>, ttlSeconds: number): Promise<T>;
    /** ─── Counter Operations ────────────────────────────── */
    /** Increment a counter (atomic) */
    increment(key: string, amount?: number): Promise<number>;
    /** Decrement a counter (atomic) */
    decrement(key: string, amount?: number): Promise<number>;
    /** ─── Rate Limiting ─────────────────────────────────── */
    /**
     * Sliding window rate limiter using Redis sorted sets.
     * Returns true if request is allowed, false if limit exceeded.
     */
    checkRateLimit(identifier: string, maxRequests: number, windowMs: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetAt: number;
    }>;
    /** ─── Hash Operations (for structured data) ─────────── */
    hset(key: string, field: string, value: string): Promise<void>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string>>;
    /** ─── Raw Client Access ─────────────────────────────── */
    /** Access the underlying ioredis client for advanced operations */
    getClient(): Redis;
    /** Check connection status */
    getConnectionStatus(): boolean;
}
export default RedisCacheManager;
//# sourceMappingURL=index.d.ts.map