import { BaseServiceConfig, loadBaseConfig } from '@auralux/common';

export interface AnalyticsServiceConfig extends BaseServiceConfig {
  aggregationIntervalMs: number;
  retentionDays: number;
  batchInsertSize: number;
}

export function loadConfig(): AnalyticsServiceConfig {
  const base = loadBaseConfig();
  return {
    ...base,
    port: parseInt(process.env.PORT || '3008', 10),
    serviceName: 'analytics-service',
    aggregationIntervalMs: parseInt(process.env.AGGREGATION_INTERVAL_MS || '60000', 10),
    retentionDays: parseInt(process.env.RETENTION_DAYS || '365', 10),
    batchInsertSize: parseInt(process.env.BATCH_INSERT_SIZE || '500', 10),
  };
}
