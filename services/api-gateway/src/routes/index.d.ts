/**
 * API Gateway — Route Definitions
 * Maps incoming API paths to upstream microservices via reverse proxy.
 * Public routes bypass JWT authentication; protected routes require it.
 */
import { FastifyInstance } from 'fastify';
import { GatewayConfig } from '../config';
/**
 * Register all reverse proxy routes.
 * The gateway forwards requests to the appropriate microservice,
 * injecting auth context for protected routes.
 */
export declare function registerRoutes(app: FastifyInstance, config: GatewayConfig): Promise<void>;
//# sourceMappingURL=index.d.ts.map