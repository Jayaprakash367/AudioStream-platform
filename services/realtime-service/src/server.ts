/**
 * Real-Time Service — Server Entry Point
 */

import { buildApp } from './app';
import { loadConfig } from './config';
import { createLogger } from '@auralux/logger';

async function main() {
  const config = loadConfig();
  const logger = createLogger({ serviceName: config.serviceName, level: config.logLevel });

  const { app, shutdown } = await buildApp(config);

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down...`);
      await shutdown();
      process.exit(0);
    });
  });

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`Real-time WebSocket service running on port ${config.port}`);
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
}

main();
