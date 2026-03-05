"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const common_1 = require("@auralux/common");
function loadConfig() {
    const base = (0, common_1.loadBaseConfig)();
    return {
        ...base,
        port: parseInt(process.env.PORT || '3008', 10),
        serviceName: 'analytics-service',
        aggregationIntervalMs: parseInt(process.env.AGGREGATION_INTERVAL_MS || '60000', 10),
        retentionDays: parseInt(process.env.RETENTION_DAYS || '365', 10),
        batchInsertSize: parseInt(process.env.BATCH_INSERT_SIZE || '500', 10),
    };
}
//# sourceMappingURL=config.js.map