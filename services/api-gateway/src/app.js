"use strict";
/**
 * API Gateway — Application Factory
 * Constructs and configures the Fastify instance with all middleware,
 * security headers, rate limiting, metrics, and proxy routes.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const common_1 = require("@auralux/common");
const logger_1 = require("@auralux/logger");
const redis_client_1 = require("@auralux/redis-client");
const routes_1 = require("./routes");
const metrics_1 = require("./middleware/metrics");
async function buildApp(config) {
    const logger = (0, logger_1.createLogger)({
        serviceName: config.serviceName,
        level: config.logLevel,
    });
    const app = (0, fastify_1.default)({
        logger: false, // We use Winston instead
        requestIdHeader: 'x-request-id',
        trustProxy: true,
        bodyLimit: 1048576, // 1MB max body
    });
    /** ── Redis for rate-limit store (shared across gateway instances) ── */
    const redis = new redis_client_1.RedisCacheManager({
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword,
        keyPrefix: 'gateway:',
    });
    try {
        await redis.connect();
        logger.info('Redis connected for rate limiting');
    }
    catch (err) {
        logger.warn('Redis unavailable — falling back to in-memory rate limiting', { error: err });
    }
    /** ── Security Headers ── */
    await app.register(helmet_1.default, {
        contentSecurityPolicy: false, // Configured at CDN/proxy level
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    });
    /** ── CORS ── */
    await app.register(cors_1.default, {
        origin: config.corsOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID'],
        exposedHeaders: ['X-Response-Time', 'X-Request-ID', 'X-RateLimit-Remaining'],
        credentials: true,
        maxAge: 86400, // 24 hours preflight cache
    });
    /** ── Rate Limiting ── */
    await app.register(rate_limit_1.default, {
        max: config.rateLimitMax,
        timeWindow: config.rateLimitWindowMs,
        keyGenerator: (request) => {
            // Rate limit by user ID if authenticated, otherwise by IP
            return request.headers['x-user-id'] || request.ip;
        },
        addHeadersOnExceeding: {
            'x-ratelimit-limit': true,
            'x-ratelimit-remaining': true,
            'x-ratelimit-reset': true,
        },
        addHeaders: {
            'x-ratelimit-limit': true,
            'x-ratelimit-remaining': true,
            'x-ratelimit-reset': true,
            'retry-after': true,
        },
    });
    /** ── Cross-cutting Middleware ── */
    (0, common_1.registerRequestId)(app);
    (0, common_1.registerResponseTime)(app);
    (0, common_1.registerErrorHandler)(app);
    (0, metrics_1.registerMetrics)(app);
    /** ── Health Checks ── */
    (0, common_1.registerHealthCheck)(app, config.serviceName, config.serviceVersion, [
        {
            name: 'redis',
            check: () => redis.ping(),
        },
    ]);
    /** ── Request Logging ── */
    app.addHook('onRequest', async (request) => {
        logger.debug('Incoming request', {
            method: request.method,
            url: request.url,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            correlationId: request.headers['x-correlation-id'],
        });
    });
    app.addHook('onResponse', async (request, reply) => {
        logger.info('Request completed', {
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            responseTime: reply.getHeader('x-response-time'),
            correlationId: request.headers['x-correlation-id'],
        });
    });
    /** ── Reverse Proxy Routes ── */
    await (0, routes_1.registerRoutes)(app, config);
    /** ── Graceful Shutdown ── */
    const shutdown = async (signal) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        await app.close();
        await redis.disconnect();
        logger.info('Gateway shutdown complete');
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    return app;
}
//# sourceMappingURL=app.js.map