"use strict";
/**
 * API Gateway — Prometheus Metrics
 * Exposes /metrics endpoint for Prometheus scraping.
 * Tracks HTTP request duration, counts, and custom business metrics.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upstreamErrors = void 0;
exports.registerMetrics = registerMetrics;
const prom_client_1 = __importDefault(require("prom-client"));
/** Create a dedicated metrics registry (avoids global state conflicts) */
const registry = new prom_client_1.default.Registry();
/** Default Node.js runtime metrics (event loop lag, memory, GC) */
prom_client_1.default.collectDefaultMetrics({ register: registry, prefix: 'auralux_gateway_' });
/** ─── Custom Metrics ──────────────────────────────────────── */
const httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'auralux_gateway_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
});
const httpRequestTotal = new prom_client_1.default.Counter({
    name: 'auralux_gateway_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry],
});
const activeConnections = new prom_client_1.default.Gauge({
    name: 'auralux_gateway_active_connections',
    help: 'Number of active HTTP connections',
    registers: [registry],
});
const upstreamErrors = new prom_client_1.default.Counter({
    name: 'auralux_gateway_upstream_errors_total',
    help: 'Total upstream service errors',
    labelNames: ['service', 'error_type'],
    registers: [registry],
});
exports.upstreamErrors = upstreamErrors;
/**
 * Register metrics collection hooks and /metrics endpoint on the Fastify instance.
 */
function registerMetrics(app) {
    // Track request start time
    app.addHook('onRequest', async (request) => {
        request._metricsStart = process.hrtime.bigint();
        activeConnections.inc();
    });
    // Record duration and status on response
    app.addHook('onResponse', async (request, reply) => {
        activeConnections.dec();
        const start = request._metricsStart;
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
    app.get('/metrics', async (_request, reply) => {
        const metrics = await registry.metrics();
        reply.header('Content-Type', registry.contentType).send(metrics);
    });
}
//# sourceMappingURL=metrics.js.map