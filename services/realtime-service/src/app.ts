/**
 * Real-Time Service — Application Bootstrap
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import { registerErrorHandler, registerRequestId, registerResponseTime, registerHealthCheck, BaseServiceConfig } from '@auralux/common';
import { createLogger } from '@auralux/logger';
import { KafkaEventBus } from '@auralux/kafka-client';
import { RedisCacheManager } from '@auralux/redis-client';
import { RealtimeService, NewSongPayload, TrendingUpdatePayload } from './services';
import { registerRealtimeRoutes } from './routes';

export async function buildApp(config: BaseServiceConfig & {
  wsHeartbeatInterval: number;
  maxConnectionsPerUser: number;
}): Promise<{ app: FastifyInstance; shutdown: () => Promise<void> }> {
  const logger = createLogger({ serviceName: config.serviceName, level: config.logLevel });
  const app = Fastify({ logger: false, requestIdHeader: 'x-request-id', trustProxy: true });

  // Redis connection
  const redis = new RedisCacheManager({
    host: config.redisHost,
    port: config.redisPort,
    password: config.redisPassword,
    keyPrefix: 'realtime:',
  });
  await redis.connect();
  logger.info('Redis connected');

  // Kafka connection
  const kafka = new KafkaEventBus({
    brokers: config.kafkaBrokers,
    clientId: config.kafkaClientId,
    groupId: config.kafkaGroupId,
  });
  await kafka.connectProducer();
  await kafka.connectConsumer();
  logger.info('Kafka connected');

  // Middlewares
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: config.corsOrigins, credentials: true });
  await app.register(websocket, {
    options: {
      maxPayload: 1024 * 64, // 64KB max message
      clientTracking: true,
    },
  });

  registerRequestId(app);
  registerResponseTime(app);
  registerErrorHandler(app);
  registerHealthCheck(app, config.serviceName, config.serviceVersion, [
    { name: 'redis', check: () => redis.ping() },
    { name: 'kafka', check: async () => kafka.isConnected() },
  ]);

  // Initialize real-time service
  const realtimeService = new RealtimeService(redis, kafka, {
    heartbeatInterval: config.wsHeartbeatInterval,
    maxConnectionsPerUser: config.maxConnectionsPerUser,
  });
  realtimeService.startHeartbeat();

  // Register routes
  await registerRealtimeRoutes(app, realtimeService);

  // ─── Kafka Consumer: New Song Events ───────────────────────────────────────

  await kafka.subscribe<{ event: string; song: NewSongPayload }>(
    'music.catalog.new',
    async (payload) => {
      if (payload.event === 'SONG_ADDED') {
        await realtimeService.publishNewSong(payload.song);
      }
    }
  );

  // ─── Kafka Consumer: Trending Updates ──────────────────────────────────────

  await kafka.subscribe<{ event: string; update: TrendingUpdatePayload }>(
    'music.trending',
    async (payload) => {
      if (payload.event === 'TRENDING_UPDATE') {
        await realtimeService.publishTrendingUpdate(payload.update);
      }
    }
  );

  logger.info('Real-time service initialized', { heartbeatInterval: config.wsHeartbeatInterval });

  const shutdown = async () => {
    await realtimeService.shutdown();
    await app.close();
    await redis.disconnect();
    await kafka.disconnect();
    logger.info('Real-time service shut down');
  };

  return { app, shutdown };
}
