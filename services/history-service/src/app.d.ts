import { FastifyInstance } from 'fastify';
import { BaseServiceConfig } from '@auralux/common';
export declare function buildApp(config: BaseServiceConfig): Promise<{
    app: FastifyInstance;
    shutdown: () => Promise<void>;
}>;
//# sourceMappingURL=app.d.ts.map