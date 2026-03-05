import { BaseServiceConfig } from '@auralux/common';
export interface NotificationServiceConfig extends BaseServiceConfig {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpFrom: string;
    pushEnabled: boolean;
    smsEnabled: boolean;
    maxRetries: number;
    retryDelayMs: number;
}
export declare function loadConfig(): NotificationServiceConfig;
//# sourceMappingURL=config.d.ts.map