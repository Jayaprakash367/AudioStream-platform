/**
 * Fastify middleware factories for cross-cutting concerns.
 * Plugged into each microservice's Fastify instance for consistent behavior.
 */
import { FastifyInstance } from 'fastify';
/** ─── Global Error Handler ────────────────────────────────── */
export declare function registerErrorHandler(app: FastifyInstance): void;
/** ─── Request ID Injection ────────────────────────────────── */
export declare function registerRequestId(app: FastifyInstance): void;
/** ─── Response Time Header ────────────────────────────────── */
export declare function registerResponseTime(app: FastifyInstance): void;
/** ─── Health Check Route ──────────────────────────────────── */
export interface HealthCheckDependency {
    name: string;
    check: () => Promise<boolean>;
}
export declare function registerHealthCheck(app: FastifyInstance, serviceName: string, version: string, dependencies?: HealthCheckDependency[]): void;
//# sourceMappingURL=middleware.d.ts.map