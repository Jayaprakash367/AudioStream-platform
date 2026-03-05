/**
 * API Gateway — Application Factory
 * Constructs and configures the Fastify instance with all middleware,
 * security headers, rate limiting, metrics, and proxy routes.
 */
import { FastifyInstance } from 'fastify';
import { GatewayConfig } from './config';
export declare function buildApp(config: GatewayConfig): Promise<FastifyInstance>;
//# sourceMappingURL=app.d.ts.map