/**
 * Fastify middleware factories for cross-cutting concerns.
 * Plugged into each microservice's Fastify instance for consistent behavior.
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { AppError } from './errors';

/** ─── Global Error Handler ────────────────────────────────── */

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    const isAppError = error instanceof AppError;

    const statusCode = isAppError ? (error as AppError).statusCode : 500;
    const code = isAppError ? (error as AppError).code : 'INTERNAL_ERROR';
    const message = isAppError ? error.message : 'An unexpected error occurred';

    // Log all 5xx errors at error level
    if (statusCode >= 500) {
      request.log.error({
        err: error,
        requestId: request.id,
        method: request.method,
        url: request.url,
      }, 'Unhandled server error');
    } else {
      request.log.warn({
        code,
        message,
        requestId: request.id,
        method: request.method,
        url: request.url,
      }, 'Client error');
    }

    const responseBody: Record<string, unknown> = {
      success: false,
      error: {
        code,
        message,
        ...(isAppError && (error as AppError).details
          ? { details: (error as AppError).details }
          : {}),
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
      },
    };

    reply.status(statusCode).send(responseBody);
  });
}

/** ─── Request ID Injection ────────────────────────────────── */

export function registerRequestId(app: FastifyInstance): void {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    // Use incoming X-Request-ID or Fastify's auto-generated one
    const correlationId =
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-correlation-id'] as string) ||
      request.id;

    request.headers['x-correlation-id'] = correlationId;
  });
}

/** ─── Response Time Header ────────────────────────────────── */

export function registerResponseTime(app: FastifyInstance): void {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    (request as unknown as Record<string, unknown>)._startTime = Date.now();
  });

  app.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    const start = (request as unknown as Record<string, unknown>)._startTime as number;
    if (start) {
      const duration = Date.now() - start;
      reply.header('X-Response-Time', `${duration}ms`);
    }
  });
}

/** ─── Health Check Route ──────────────────────────────────── */

export interface HealthCheckDependency {
  name: string;
  check: () => Promise<boolean>;
}

export function registerHealthCheck(
  app: FastifyInstance,
  serviceName: string = 'service',
  version: string = '1.0.0',
  dependencies: HealthCheckDependency[] = []
): void {
  const startTime = Date.now();

  app.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    const depChecks = await Promise.allSettled(
      dependencies.map(async (dep) => {
        const start = Date.now();
        try {
          const healthy = await dep.check();
          return {
            name: dep.name,
            status: healthy ? 'connected' : 'disconnected',
            latency: Date.now() - start,
          };
        } catch {
          return {
            name: dep.name,
            status: 'disconnected',
            latency: Date.now() - start,
          };
        }
      })
    );

    const depResults = depChecks.map((r) =>
      r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'disconnected', latency: 0 }
    );

    const allHealthy = depResults.every((d) => d.status === 'connected');

    const response = {
      service: serviceName,
      status: allHealthy ? 'healthy' : 'degraded',
      version,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      dependencies: depResults,
    };

    reply.status(allHealthy ? 200 : 503).send(response);
  });

  /** Liveness probe for Kubernetes */
  app.get('/health/live', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send({ status: 'alive' });
  });

  /** Readiness probe for Kubernetes */
  app.get('/health/ready', async (_request: FastifyRequest, reply: FastifyReply) => {
    const depChecks = await Promise.allSettled(
      dependencies.map(async (dep) => dep.check())
    );
    const allReady = depChecks.every(
      (r) => r.status === 'fulfilled' && r.value === true
    );
    reply.status(allReady ? 200 : 503).send({ ready: allReady });
  });
}
