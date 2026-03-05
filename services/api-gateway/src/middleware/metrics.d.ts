/**
 * API Gateway — Prometheus Metrics
 * Exposes /metrics endpoint for Prometheus scraping.
 * Tracks HTTP request duration, counts, and custom business metrics.
 */
import { FastifyInstance } from 'fastify';
import client from 'prom-client';
declare const upstreamErrors: client.Counter<"service" | "error_type">;
/**
 * Register metrics collection hooks and /metrics endpoint on the Fastify instance.
 */
export declare function registerMetrics(app: FastifyInstance): void;
/** Export for use in circuit breaker error tracking */
export { upstreamErrors };
//# sourceMappingURL=metrics.d.ts.map