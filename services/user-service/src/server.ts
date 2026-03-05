import { loadUserConfig } from './config';
import { buildApp } from './app';
import { createLogger } from '@auralux/logger';

async function main(): Promise<void> {
  const config = loadUserConfig();
  const logger = createLogger({ serviceName: config.serviceName, level: config.logLevel });
  try {
    const { app, shutdown } = await buildApp(config);
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`👤 ${config.serviceName} v${config.serviceVersion} running on port ${config.port}`);
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start user service', { error });
    process.exit(1);
  }
}

main();
