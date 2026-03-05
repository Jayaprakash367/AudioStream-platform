"use strict";
/**
 * API Gateway — Server Entry Point
 * Boots the gateway, binds to the configured port, and logs startup info.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const app_1 = require("./app");
const logger_1 = require("@auralux/logger");
async function main() {
    const config = (0, config_1.loadGatewayConfig)();
    const logger = (0, logger_1.createLogger)({ serviceName: config.serviceName, level: config.logLevel });
    try {
        const app = await (0, app_1.buildApp)(config);
        await app.listen({ port: config.port, host: '0.0.0.0' });
        logger.info(`🚀 ${config.serviceName} v${config.serviceVersion} running`, {
            port: config.port,
            env: config.nodeEnv,
            services: Object.entries(config.services).map(([name, url]) => `${name}→${url}`),
        });
    }
    catch (error) {
        logger.error('Failed to start API Gateway', { error });
        process.exit(1);
    }
}
main();
//# sourceMappingURL=server.js.map