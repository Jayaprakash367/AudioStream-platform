import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import mongoose from 'mongoose';
import { createLogger } from '@auralux/logger';
import { registerErrorHandler, registerRequestId, registerHealthCheck } from '@auralux/common';
import { KafkaEventBus } from '@auralux/kafka-client';
import { RedisCacheManager } from '@auralux/redis-client';
import { KafkaTopic } from '@auralux/shared-types';
import { NotificationService } from './services';
import { notificationRoutes } from './routes';
import { NotificationServiceConfig } from './config';
import { NotificationChannel, NotificationType } from './models';

const logger = createLogger({ service: 'notification-service', level: 'info' });

export async function buildApp(config: NotificationServiceConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });

  await app.register(helmet);
  await app.register(cors, { origin: config.corsOrigin || '*' });

  registerRequestId(app);
  registerErrorHandler(app);
  registerHealthCheck(app);

  /* ── Infrastructure ───────────────────────────────────────────────── */
  await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/auralux_notifications');
  logger.info('MongoDB connected');

  const cache = new RedisCacheManager({
    host: config.redisHost || 'localhost',
    port: config.redisPort || 6379,
    keyPrefix: 'notif:',
  });

  const kafka = new KafkaEventBus({
    clientId: 'notification-service',
    brokers: config.kafkaBrokers || ['localhost:9092'],
  });
  await kafka.connect();

  /* ── Service & Routes ─────────────────────────────────────────────── */
  const service = new NotificationService(config, cache);
  await notificationRoutes(app, service);

  /* ── Kafka Consumer: notification.send events ─────────────────────── */
  await kafka.subscribe(
    KafkaTopic.NOTIFICATION_SEND,
    'notification-dispatch-group',
    async (event) => {
      try {
        const { userId, type, channels, title, body, metadata } = event.payload as any;
        await service.send({
          userId,
          type: type as NotificationType,
          channels: channels || [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          title,
          body,
          metadata,
        });
      } catch (err) {
        logger.error('Failed to process notification event', { error: err });
      }
    },
  );

  /* ── Scheduled notification processor (runs every 30s) ────────────── */
  const scheduledInterval = setInterval(async () => {
    try {
      await service.processScheduledNotifications();
    } catch (err) {
      logger.error('Scheduled notification processing failed', { error: err });
    }
  }, 30_000);

  /* ── Graceful shutdown ────────────────────────────────────────────── */
  app.addHook('onClose', async () => {
    clearInterval(scheduledInterval);
    await kafka.disconnect();
    await mongoose.disconnect();
    logger.info('Notification service shut down');
  });

  return app;
}
