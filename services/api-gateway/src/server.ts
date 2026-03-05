/**
 * API Gateway — Server Entry Point
 * Boots the gateway, binds to the configured port, and logs startup info.
 */

import { loadGatewayConfig } from './config';
import { buildApp } from './app';
import { createLogger } from '@auralux/logger';

async function main(): Promise<void> {
  const config = loadGatewayConfig();
  const logger = createLogger({ serviceName: config.serviceName, level: config.logLevel });

  try {
    const app = await buildApp(config);

    await app.listen({ port: config.port, host: '0.0.0.0' });

    logger.info(`🚀 ${config.serviceName} v${config.serviceVersion} running`, {
      port: config.port,
      env: config.nodeEnv,
      services: Object.entries(config.services).map(([name, url]) => `${name}→${url}`),
    });
  } catch (error) {
    logger.error('Failed to start API Gateway', { error });
    process.exit(1);
  }
}

main();
