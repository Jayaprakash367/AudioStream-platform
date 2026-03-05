import { BaseServiceConfig, loadBaseConfig } from '@auralux/common';

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

export function loadConfig(): NotificationServiceConfig {
  const base = loadBaseConfig();
  return {
    ...base,
    port: parseInt(process.env.PORT || '3009', 10),
    serviceName: 'notification-service',
    smtpHost: process.env.SMTP_HOST || 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'noreply@auralux.io',
    pushEnabled: process.env.PUSH_ENABLED === 'true',
    smsEnabled: process.env.SMS_ENABLED === 'true',
    maxRetries: parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.NOTIFICATION_RETRY_DELAY_MS || '5000', 10),
  };
}
