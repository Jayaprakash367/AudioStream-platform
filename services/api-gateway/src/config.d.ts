/**
 * API Gateway — Configuration
 * Extends base config with gateway-specific settings (upstream service URLs).
 */
import { BaseServiceConfig } from '@auralux/common';
export interface GatewayConfig extends BaseServiceConfig {
    /** Upstream service URLs */
    services: {
        auth: string;
        user: string;
        music: string;
        streaming: string;
        playlist: string;
        history: string;
        recommendation: string;
        analytics: string;
        notification: string;
    };
}
export declare function loadGatewayConfig(): GatewayConfig;
//# sourceMappingURL=config.d.ts.map