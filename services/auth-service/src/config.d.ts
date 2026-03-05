/**
 * Auth Service — Configuration
 */
import { BaseServiceConfig } from '@auralux/common';
export interface AuthServiceConfig extends BaseServiceConfig {
    bcryptSaltRounds: number;
}
export declare function loadAuthConfig(): AuthServiceConfig;
//# sourceMappingURL=config.d.ts.map