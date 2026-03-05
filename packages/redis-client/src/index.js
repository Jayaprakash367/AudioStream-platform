"use strict";
/**
 * @auralux/redis-client
 * Typed Redis wrapper with connection pooling, health checks,
 * and convenience methods for caching patterns (cache-aside, TTL, pub/sub).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheManager = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Redis cache manager — provides typed get/set with JSON serialization,
 * TTL management, and cache-aside pattern support.
 */
class RedisCacheManager {
    client;
    isConnected = false;
    constructor(config) {
        const options = {
            host: config.host,
            port: config.port,
            password: config.password || undefined,
            keyPrefix: config.keyPrefix || 'auralux:',
            db: config.db || 0,
            maxRetriesPerRequest: config.maxRetriesPerRequest ?? 3,
            retryStrategy: (times) => {
                if (times > 10)
                    return null; // Stop retrying
                return Math.min(times * 200, 5000);
            },
            lazyConnect: true,
        };
        this.client = new ioredis_1.default(options);
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
    async connect() {
        if (!this.isConnected) {
            await this.client.connect();
        }
    }
    /** Disconnect gracefully */
    async disconnect() {
        if (this.isConnected) {
            await this.client.quit();
        }
    }
    /** Health check */
    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch {
            return false;
        }
    }
    /** ─── Basic Operations ──────────────────────────────── */
    /** Get a cached value with automatic JSON deserialization */
    async get(key) {
        const value = await this.client.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    /** Set a value with optional TTL (seconds) */
    async set(key, value, ttlSeconds) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, serialized);
        }
        else {
            await this.client.set(key, serialized);
        }
    }
    /** Delete a key */
    async del(key) {
        await this.client.del(key);
    }
    /** Check if key exists */
    async exists(key) {
        const result = await this.client.exists(key);
        return result === 1;
    }
    /** Set TTL on existing key */
    async expire(key, ttlSeconds) {
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
    async getOrSet(key, loader, ttlSeconds) {
        const cached = await this.get(key);
        if (cached !== null)
            return cached;
        const value = await loader();
        await this.set(key, value, ttlSeconds);
        return value;
    }
    /** ─── Counter Operations ────────────────────────────── */
    /** Increment a counter (atomic) */
    async increment(key, amount = 1) {
        return this.client.incrby(key, amount);
    }
    /** Decrement a counter (atomic) */
    async decrement(key, amount = 1) {
        return this.client.decrby(key, amount);
    }
    /** ─── Rate Limiting ─────────────────────────────────── */
    /**
     * Sliding window rate limiter using Redis sorted sets.
     * Returns true if request is allowed, false if limit exceeded.
     */
    async checkRateLimit(identifier, maxRequests, windowMs) {
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
        const currentCount = results?.[1]?.[1] || 0;
        return {
            allowed: currentCount < maxRequests,
            remaining: Math.max(0, maxRequests - currentCount - 1),
            resetAt: now + windowMs,
        };
    }
    /** ─── Hash Operations (for structured data) ─────────── */
    async hset(key, field, value) {
        await this.client.hset(key, field, value);
    }
    async hget(key, field) {
        return this.client.hget(key, field);
    }
    async hgetall(key) {
        return this.client.hgetall(key);
    }
    /** ─── Raw Client Access ─────────────────────────────── */
    /** Access the underlying ioredis client for advanced operations */
    getClient() {
        return this.client;
    }
    /** Check connection status */
    getConnectionStatus() {
        return this.isConnected;
    }
}
exports.RedisCacheManager = RedisCacheManager;
exports.default = RedisCacheManager;
//# sourceMappingURL=index.js.map