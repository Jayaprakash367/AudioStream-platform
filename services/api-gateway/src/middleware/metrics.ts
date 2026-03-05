/**
 * API Gateway — Prometheus Metrics
 * Exposes /metrics endpoint for Prometheus scraping.
 * Tracks HTTP request duration, counts, and custom business metrics.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import client from 'prom-client';

/** Create a dedicated metrics registry (avoids global state conflicts) */
const registry = new client.Registry();

/** Default Node.js runtime metrics (event loop lag, memory, GC) */
client.collectDefaultMetrics({ register: registry, prefix: 'auralux_gateway_' });

/** ─── Custom Metrics ──────────────────────────────────────── */

const httpRequestDuration = new client.Histogram({
  name: 'auralux_gateway_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

const httpRequestTotal = new client.Counter({
  name: 'auralux_gateway_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

const activeConnections = new client.Gauge({
  name: 'auralux_gateway_active_connections',
  help: 'Number of active HTTP connections',
  registers: [registry],
});

const upstreamErrors = new client.Counter({
  name: 'auralux_gateway_upstream_errors_total',
  help: 'Total upstream service errors',
  labelNames: ['service', 'error_type'],
  registers: [registry],
});

/**
 * Register metrics collection hooks and /metrics endpoint on the Fastify instance.
 */
export function registerMetrics(app: FastifyInstance): void {
  // Track request start time
  app.addHook('onRequest', async (request: FastifyRequest) => {
    (request as unknown as Record<string, unknown>)._metricsStart = process.hrtime.bigint();
    activeConnections.inc();
  });

  // Record duration and status on response
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    activeConnections.dec();
    const start = (request as unknown as Record<string, unknown>)._metricsStart as bigint;
    if (start) {
      const durationNs = Number(process.hrtime.bigint() - start);
      const durationSec = durationNs / 1e9;

      const route = request.routeOptions?.url || request.url;
      const labels = {
        method: request.method,
        route,
        status_code: String(reply.statusCode),
      };

      httpRequestDuration.observe(labels, durationSec);
      httpRequestTotal.inc(labels);
    }
  });

  // Expose /metrics endpoint for Prometheus scraping
  app.get('/metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
    const metrics = await registry.metrics();
    reply.header('Content-Type', registry.contentType).send(metrics);
  });
}

/** Export for use in circuit breaker error tracking */
export { upstreamErrors };
