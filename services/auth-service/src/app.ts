/**
 * Auth Service — Application Factory
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import mongoose from 'mongoose';
import {
  registerErrorHandler,
  registerRequestId,
  registerResponseTime,
  registerHealthCheck,
} from '@auralux/common';
import { createLogger } from '@auralux/logger';
import { KafkaEventBus } from '@auralux/kafka-client';
import { RedisCacheManager } from '@auralux/redis-client';
import { AuthServiceConfig } from './config';
import { AuthService } from './services';
import { registerAuthRoutes } from './routes';

export async function buildApp(config: AuthServiceConfig): Promise<{
  app: FastifyInstance;
  shutdown: () => Promise<void>;
}> {
  const logger = createLogger({ serviceName: config.serviceName, level: config.logLevel });

  const app = Fastify({
    logger: false,
    requestIdHeader: 'x-request-id',
    trustProxy: true,
  });

  /** ── MongoDB Connection ── */
  await mongoose.connect(`${config.mongoUri}/${config.mongoDbName}`);
  logger.info('MongoDB connected', { db: config.mongoDbName });

  /** ── Redis ── */
  const redis = new RedisCacheManager({
    host: config.redisHost,
    port: config.redisPort,
    password: config.redisPassword,
    keyPrefix: 'auth:',
  });
  await redis.connect();
  logger.info('Redis connected');

  /** ── Kafka Producer ── */
  const kafka = new KafkaEventBus({
    brokers: config.kafkaBrokers,
    clientId: config.kafkaClientId,
  });
  await kafka.connectProducer();
  logger.info('Kafka producer connected');

  /** ── Plugins ── */
  await app.register(helmet);
  await app.register(cors, { origin: config.corsOrigins, credentials: true });

  /** ── Middleware ── */
  registerRequestId(app);
  registerResponseTime(app);
  registerErrorHandler(app);

  /** ── Health Checks ── */
  registerHealthCheck(app, config.serviceName, config.serviceVersion, [
    { name: 'mongodb', check: async () => mongoose.connection.readyState === 1 },
    { name: 'redis', check: () => redis.ping() },
    { name: 'kafka', check: async () => kafka.isConnected() },
  ]);

  /** ── Service Layer ── */
  const authService = new AuthService(config, kafka, redis);

  /** ── Routes ── */
  await registerAuthRoutes(app, authService);

  /** ── Graceful Shutdown ── */
  const shutdown = async () => {
    logger.info('Shutting down auth service...');
    await app.close();
    await mongoose.disconnect();
    await redis.disconnect();
    await kafka.disconnect();
    logger.info('Auth service shutdown complete');
  };

  return { app, shutdown };
}
