"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const common_1 = require("@auralux/common");
function loadConfig() {
    const base = (0, common_1.loadBaseConfig)();
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
//# sourceMappingURL=config.js.map