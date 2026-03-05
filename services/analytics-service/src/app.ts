import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import mongoose from 'mongoose';
import { createLogger } from '@auralux/logger';
import { registerErrorHandler, registerRequestId, registerHealthCheck } from '@auralux/common';
import { KafkaEventBus } from '@auralux/kafka-client';
import { RedisCacheManager } from '@auralux/redis-client';
import { KafkaTopic } from '@auralux/shared-types';
import { AnalyticsService } from './services';
import { analyticsRoutes } from './routes';
import { AnalyticsServiceConfig } from './config';

const logger = createLogger({ service: 'analytics-service', level: 'info' });

export async function buildApp(config: AnalyticsServiceConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });

  await app.register(helmet);
  await app.register(cors, { origin: config.corsOrigins?.[0] || '*' });

  registerRequestId(app);
  registerErrorHandler(app);
  registerHealthCheck(app);

  /* ── Infrastructure ───────────────────────────────────────────────── */
  await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/auralux_analytics');
  logger.info('MongoDB connected');

  const cache = new RedisCacheManager({
    host: config.redisHost || 'localhost',
    port: config.redisPort || 6379,
    keyPrefix: 'analytics:',
  });

  const kafka = new KafkaEventBus({
    clientId: 'analytics-service',
    brokers: config.kafkaBrokers || ['localhost:9092'],
  });

  /* ── Service & Routes ─────────────────────────────────────────────── */
  const service = new AnalyticsService(config, cache);
  await analyticsRoutes(app, service);

  /* ── Kafka Consumers ──────────────────────────────────────────────── */

  // Consume analytics events from dedicated topic
  await kafka.subscribe(
    KafkaTopic.ANALYTICS_EVENT,
    async (event: any) => {
      try {
        await service.ingestEvent(event.payload);
      } catch (err) {
        logger.error('Failed to ingest analytics event from Kafka', { error: err });
      }
    }
  );

  // Also consume song.played for real-time song analytics
  await kafka.subscribe(
    KafkaTopic.SONG_PLAYED,
    async (event: any) => {
      try {
        const { songId, userId, duration } = event.payload as any;
        await service.trackSongPlay({
          songId,
          userId,
          duration: duration || 0,
          completionRate: (event.payload as any).completionRate || 0,
          skipped: (event.payload as any).skipped || false,
          country: (event.payload as any).country,
        });
      } catch (err) {
        logger.error('Failed to track song play from Kafka', { error: err });
      }
    },
  );

  /* ── Graceful shutdown ────────────────────────────────────────────── */
  app.addHook('onClose', async () => {
    await service.shutdown();
    await kafka.disconnect();
    await mongoose.disconnect();
    logger.info('Analytics service shut down');
  });

  return app;
}
