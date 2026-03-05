"use strict";
/**
 * Auth Service — Server Entry Point
 */
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const app_1 = require("./app");
const logger_1 = require("@auralux/logger");
async function main() {
    const config = (0, config_1.loadAuthConfig)();
    const logger = (0, logger_1.createLogger)({ serviceName: config.serviceName, level: config.logLevel });
    try {
        const { app, shutdown } = await (0, app_1.buildApp)(config);
        await app.listen({ port: config.port, host: '0.0.0.0' });
        logger.info(`🔐 ${config.serviceName} v${config.serviceVersion} running on port ${config.port}`);
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        logger.error('Failed to start auth service', { error });
        process.exit(1);
    }
}
main();
//# sourceMappingURL=server.js.map