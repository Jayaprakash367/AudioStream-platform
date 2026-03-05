import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import mongoose from 'mongoose';
import { registerErrorHandler, registerRequestId, registerResponseTime, registerHealthCheck, BaseServiceConfig } from '@auralux/common';
import { createLogger } from '@auralux/logger';
import { KafkaEventBus } from '@auralux/kafka-client';
import { RedisCacheManager } from '@auralux/redis-client';
import { MusicService } from './services';
import { registerMusicRoutes } from './routes';

export async function buildApp(config: BaseServiceConfig): Promise<{ app: FastifyInstance; shutdown: () => Promise<void> }> {
  const logger = createLogger({ serviceName: config.serviceName, level: config.logLevel });
  const app = Fastify({ logger: false, requestIdHeader: 'x-request-id', trustProxy: true });

  await mongoose.connect(`${config.mongoUri}/${config.mongoDbName}`);
  logger.info('MongoDB connected', { db: config.mongoDbName });

  const redis = new RedisCacheManager({ host: config.redisHost, port: config.redisPort, password: config.redisPassword, keyPrefix: 'music:' });
  await redis.connect();

  const kafka = new KafkaEventBus({ brokers: config.kafkaBrokers, clientId: config.kafkaClientId, groupId: config.kafkaGroupId });
  await kafka.connectProducer();

  await app.register(helmet);
  await app.register(cors, { origin: config.corsOrigins, credentials: true });
  registerRequestId(app);
  registerResponseTime(app);
  registerErrorHandler(app);
  registerHealthCheck(app, config.serviceName, config.serviceVersion, [
    { name: 'mongodb', check: async () => mongoose.connection.readyState === 1 },
    { name: 'redis', check: () => redis.ping() },
  ]);

  const musicService = new MusicService(redis, kafka);
  await registerMusicRoutes(app, musicService);

  // Consume song.played events to increment play counts
  await kafka.subscribe<{ songId: string }>(
    'song.played',
    async (payload) => {
      await musicService.incrementPlayCount(payload.songId);
    }
  );

  const shutdown = async () => {
    await app.close();
    await mongoose.disconnect();
    await redis.disconnect();
    await kafka.disconnect();
  };
  return { app, shutdown };
}
