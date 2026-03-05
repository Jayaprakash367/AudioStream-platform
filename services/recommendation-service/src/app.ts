import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import mongoose from 'mongoose';
import { createLogger } from '@auralux/logger';
import { registerErrorHandler, registerRequestId, registerHealthCheck } from '@auralux/common';
import { KafkaEventBus } from '@auralux/kafka-client';
import { RedisCacheManager } from '@auralux/redis-client';
import { KafkaTopic, IListeningHistoryEvent } from '@auralux/shared-types';
import { RecommendationService } from './services';
import { recommendationRoutes } from './routes';
import { RecommendationServiceConfig } from './config';

const logger = createLogger({ service: 'recommendation-service', level: 'info' });

export async function buildApp(config: RecommendationServiceConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });

  /* ── Plugins ──────────────────────────────────────────────────────── */
  await app.register(helmet);
  await app.register(cors, { origin: config.corsOrigin || '*' });

  registerRequestId(app);
  registerErrorHandler(app);
  registerHealthCheck(app);

  /* ── Infrastructure ───────────────────────────────────────────────── */
  await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/auralux_recommendations');
  logger.info('MongoDB connected');

  const cache = new RedisCacheManager({
    host: config.redisHost || 'localhost',
    port: config.redisPort || 6379,
    keyPrefix: 'rec:',
  });

  const kafka = new KafkaEventBus({
    clientId: 'recommendation-service',
    brokers: config.kafkaBrokers || ['localhost:9092'],
  });
  await kafka.connect();

  /* ── Service & Routes ─────────────────────────────────────────────── */
  const service = new RecommendationService(config, cache);
  await recommendationRoutes(app, service);

  /* ── Kafka Consumer: listening.history events ─────────────────────── */
  await kafka.subscribe<IListeningHistoryEvent>(
    KafkaTopic.LISTENING_HISTORY,
    'recommendation-consumer-group',
    async (event) => {
      try {
        await service.ingestListeningEvent(event.payload);
        logger.debug('Ingested listening event', { userId: event.payload.userId });
      } catch (err) {
        logger.error('Failed to ingest listening event', { error: err });
      }
    },
  );

  /* ── Graceful shutdown hooks ──────────────────────────────────────── */
  app.addHook('onClose', async () => {
    await kafka.disconnect();
    await mongoose.disconnect();
    logger.info('Recommendation service shut down');
  });

  return app;
}
