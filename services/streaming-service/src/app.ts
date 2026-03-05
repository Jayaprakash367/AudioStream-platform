import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { registerErrorHandler, registerRequestId, registerResponseTime, registerHealthCheck, BaseServiceConfig } from '@auralux/common';
import { createLogger } from '@auralux/logger';
import { KafkaEventBus } from '@auralux/kafka-client';
import { RedisCacheManager } from '@auralux/redis-client';
import { StreamingService } from './services';
import { registerStreamRoutes } from './routes';

export async function buildApp(config: BaseServiceConfig): Promise<{ app: FastifyInstance; shutdown: () => Promise<void> }> {
  const logger = createLogger({ serviceName: config.serviceName, level: config.logLevel });
  const app = Fastify({ logger: false, requestIdHeader: 'x-request-id', trustProxy: true });

  const redis = new RedisCacheManager({ host: config.redisHost, port: config.redisPort, password: config.redisPassword, keyPrefix: 'streaming:' });
  await redis.connect();

  const kafka = new KafkaEventBus({ brokers: config.kafkaBrokers, clientId: config.kafkaClientId });
  await kafka.connectProducer();

  await app.register(helmet);
  await app.register(cors, { origin: config.corsOrigins, credentials: true });
  registerRequestId(app);
  registerResponseTime(app);
  registerErrorHandler(app);
  registerHealthCheck(app, config.serviceName, config.serviceVersion, [
    { name: 'redis', check: () => redis.ping() },
    { name: 'kafka', check: async () => kafka.isConnected() },
  ]);

  const streamingService = new StreamingService(redis, kafka, config.jwtSecret);
  await registerStreamRoutes(app, streamingService);

  const shutdown = async () => { await app.close(); await redis.disconnect(); await kafka.disconnect(); };
  return { app, shutdown };
}
