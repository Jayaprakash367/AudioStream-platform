import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import mongoose from 'mongoose';
import { registerErrorHandler, registerRequestId, registerResponseTime, registerHealthCheck, BaseServiceConfig } from '@auralux/common';
import { createLogger } from '@auralux/logger';
import { KafkaEventBus } from '@auralux/kafka-client';
import { KafkaTopic, SongPlayedPayload } from '@auralux/shared-types';
import { HistoryService } from './services';
import { registerHistoryRoutes } from './routes';

export async function buildApp(config: BaseServiceConfig): Promise<{ app: FastifyInstance; shutdown: () => Promise<void> }> {
  const logger = createLogger({ serviceName: config.serviceName, level: config.logLevel });
  const app = Fastify({ logger: false, requestIdHeader: 'x-request-id', trustProxy: true });

  await mongoose.connect(`${config.mongoUri}/${config.mongoDbName}`);
  logger.info('MongoDB connected');

  const kafka = new KafkaEventBus({ brokers: config.kafkaBrokers, clientId: config.kafkaClientId, groupId: config.kafkaGroupId });
  await kafka.connectProducer();

  await app.register(helmet);
  await app.register(cors, { origin: config.corsOrigins, credentials: true });
  registerRequestId(app);
  registerResponseTime(app);
  registerErrorHandler(app);
  registerHealthCheck(app, config.serviceName, config.serviceVersion, [
    { name: 'mongodb', check: async () => mongoose.connection.readyState === 1 },
  ]);

  const historyService = new HistoryService(kafka);
  await registerHistoryRoutes(app, historyService);

  // Consume song.played events from Kafka
  await kafka.subscribe<SongPlayedPayload>(KafkaTopic.SONG_PLAYED, async (payload) => {
    logger.debug('Recording listening event', { userId: payload.userId, songId: payload.songId });
    await historyService.recordListening(payload);
  });

  const shutdown = async () => { await app.close(); await mongoose.disconnect(); await kafka.disconnect(); };
  return { app, shutdown };
}
