/**
 * Auth Service — Application Factory
 */
import { FastifyInstance } from 'fastify';
import { AuthServiceConfig } from './config';
export declare function buildApp(config: AuthServiceConfig): Promise<{
    app: FastifyInstance;
    shutdown: () => Promise<void>;
}>;
//# sourceMappingURL=app.d.ts.map