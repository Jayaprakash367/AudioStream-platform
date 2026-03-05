"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@auralux/logger");
const config_1 = require("./config");
const app_1 = require("./app");
const logger = (0, logger_1.createLogger)({ service: 'analytics-service', level: 'info' });
async function main() {
    const config = (0, config_1.loadConfig)();
    const app = await (0, app_1.buildApp)(config);
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`Analytics service listening on port ${config.port}`);
    const shutdown = async (signal) => {
        logger.info(`Received ${signal}, shutting down gracefully`);
        await app.close();
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
main().catch((err) => {
    logger.error('Failed to start analytics service', { error: err });
    process.exit(1);
});
//# sourceMappingURL=server.js.map