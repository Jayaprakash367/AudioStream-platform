import { BaseServiceConfig } from '@auralux/common';
export interface AnalyticsServiceConfig extends BaseServiceConfig {
    aggregationIntervalMs: number;
    retentionDays: number;
    batchInsertSize: number;
}
export declare function loadConfig(): AnalyticsServiceConfig;
//# sourceMappingURL=config.d.ts.map