/**
 * API Gateway — Application Factory
 * Constructs and configures the Fastify instance with all middleware,
 * security headers, rate limiting, metrics, and proxy routes.
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import {
  registerErrorHandler,
  registerRequestId,
  registerResponseTime,
  registerHealthCheck,
} from '@auralux/common';
import { createLogger } from '@auralux/logger';
import { RedisCacheManager } from '@auralux/redis-client';
import { GatewayConfig } from './config';
import { registerRoutes } from './routes';
import { registerMetrics } from './middleware/metrics';

export async function buildApp(config: GatewayConfig): Promise<FastifyInstance> {
  const logger = createLogger({
    serviceName: config.serviceName,
    level: config.logLevel,
  });

  const app = Fastify({
    logger: false, // We use Winston instead
    requestIdHeader: 'x-request-id',
    trustProxy: true,
    bodyLimit: 1048576, // 1MB max body
  });

  /** ── Redis for rate-limit store (shared across gateway instances) ── */
  const redis = new RedisCacheManager({
    host: config.redisHost,
    port: config.redisPort,
    password: config.redisPassword,
    keyPrefix: 'gateway:',
  });

  try {
    await redis.connect();
    logger.info('Redis connected for rate limiting');
  } catch (err) {
    logger.warn('Redis unavailable — falling back to in-memory rate limiting', { error: err });
  }

  /** ── Security Headers ── */
  await app.register(helmet, {
    contentSecurityPolicy: false, // Configured at CDN/proxy level
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  /** ── CORS ── */
  await app.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID'],
    exposedHeaders: ['X-Response-Time', 'X-Request-ID', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  });

  /** ── Rate Limiting ── */
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
    keyGenerator: (request) => {
      // Rate limit by user ID if authenticated, otherwise by IP
      return request.headers['x-user-id'] as string || request.ip;
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
  registerRequestId(app);
  registerResponseTime(app);
  registerErrorHandler(app);
  registerMetrics(app);

  /** ── Health Checks ── */
  registerHealthCheck(app, config.serviceName, config.serviceVersion, [
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
  await registerRoutes(app, config);

  /** ── Graceful Shutdown ── */
  const shutdown = async (signal: string) => {
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
