import { createLogger } from '@auralux/logger';
import { loadConfig } from './config';
import { buildApp } from './app';

const logger = createLogger({ service: 'recommendation-service', level: 'info' });

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  await app.listen({ port: config.port, host: '0.0.0.0' });
  logger.info(`Recommendation service listening on port ${config.port}`);

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Failed to start recommendation service', { error: err });
  process.exit(1);
});
