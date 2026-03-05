"use strict";
/**
 * Fastify middleware factories for cross-cutting concerns.
 * Plugged into each microservice's Fastify instance for consistent behavior.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerErrorHandler = registerErrorHandler;
exports.registerRequestId = registerRequestId;
exports.registerResponseTime = registerResponseTime;
exports.registerHealthCheck = registerHealthCheck;
const errors_1 = require("./errors");
/** ─── Global Error Handler ────────────────────────────────── */
function registerErrorHandler(app) {
    app.setErrorHandler((error, request, reply) => {
        const isAppError = error instanceof errors_1.AppError;
        const statusCode = isAppError ? error.statusCode : 500;
        const code = isAppError ? error.code : 'INTERNAL_ERROR';
        const message = isAppError ? error.message : 'An unexpected error occurred';
        // Log all 5xx errors at error level
        if (statusCode >= 500) {
            request.log.error({
                err: error,
                requestId: request.id,
                method: request.method,
                url: request.url,
            }, 'Unhandled server error');
        }
        else {
            request.log.warn({
                code,
                message,
                requestId: request.id,
                method: request.method,
                url: request.url,
            }, 'Client error');
        }
        const responseBody = {
            success: false,
            error: {
                code,
                message,
                ...(isAppError && error.details
                    ? { details: error.details }
                    : {}),
                ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
            },
        };
        reply.status(statusCode).send(responseBody);
    });
}
/** ─── Request ID Injection ────────────────────────────────── */
function registerRequestId(app) {
    app.addHook('onRequest', async (request) => {
        // Use incoming X-Request-ID or Fastify's auto-generated one
        const correlationId = request.headers['x-request-id'] ||
            request.headers['x-correlation-id'] ||
            request.id;
        request.headers['x-correlation-id'] = correlationId;
    });
}
/** ─── Response Time Header ────────────────────────────────── */
function registerResponseTime(app) {
    app.addHook('onRequest', async (request) => {
        request._startTime = Date.now();
    });
    app.addHook('onSend', async (request, reply) => {
        const start = request._startTime;
        if (start) {
            const duration = Date.now() - start;
            reply.header('X-Response-Time', `${duration}ms`);
        }
    });
}
function registerHealthCheck(app, serviceName, version, dependencies = []) {
    const startTime = Date.now();
    app.get('/health', async (_request, reply) => {
        const depChecks = await Promise.allSettled(dependencies.map(async (dep) => {
            const start = Date.now();
            try {
                const healthy = await dep.check();
                return {
                    name: dep.name,
                    status: healthy ? 'connected' : 'disconnected',
                    latency: Date.now() - start,
                };
            }
            catch {
                return {
                    name: dep.name,
                    status: 'disconnected',
                    latency: Date.now() - start,
                };
            }
        }));
        const depResults = depChecks.map((r) => r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'disconnected', latency: 0 });
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
    app.get('/health/live', async (_request, reply) => {
        reply.status(200).send({ status: 'alive' });
    });
    /** Readiness probe for Kubernetes */
    app.get('/health/ready', async (_request, reply) => {
        const depChecks = await Promise.allSettled(dependencies.map(async (dep) => dep.check()));
        const allReady = depChecks.every((r) => r.status === 'fulfilled' && r.value === true);
        reply.status(allReady ? 200 : 503).send({ ready: allReady });
    });
}
//# sourceMappingURL=middleware.js.map