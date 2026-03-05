"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("@auralux/logger");
const common_1 = require("@auralux/common");
const kafka_client_1 = require("@auralux/kafka-client");
const redis_client_1 = require("@auralux/redis-client");
const shared_types_1 = require("@auralux/shared-types");
const services_1 = require("./services");
const routes_1 = require("./routes");
const logger = (0, logger_1.createLogger)({ service: 'analytics-service', level: 'info' });
async function buildApp(config) {
    const app = (0, fastify_1.default)({
        logger: false,
        requestIdHeader: 'x-request-id',
        genReqId: () => crypto.randomUUID(),
    });
    await app.register(helmet_1.default);
    await app.register(cors_1.default, { origin: config.corsOrigin || '*' });
    (0, common_1.registerRequestId)(app);
    (0, common_1.registerErrorHandler)(app);
    (0, common_1.registerHealthCheck)(app);
    /* ── Infrastructure ───────────────────────────────────────────────── */
    await mongoose_1.default.connect(config.mongoUri || 'mongodb://localhost:27017/auralux_analytics');
    logger.info('MongoDB connected');
    const cache = new redis_client_1.RedisCacheManager({
        host: config.redisHost || 'localhost',
        port: config.redisPort || 6379,
        keyPrefix: 'analytics:',
    });
    const kafka = new kafka_client_1.KafkaEventBus({
        clientId: 'analytics-service',
        brokers: config.kafkaBrokers || ['localhost:9092'],
    });
    await kafka.connect();
    /* ── Service & Routes ─────────────────────────────────────────────── */
    const service = new services_1.AnalyticsService(config, cache);
    await (0, routes_1.analyticsRoutes)(app, service);
    /* ── Kafka Consumers ──────────────────────────────────────────────── */
    // Consume analytics events from dedicated topic
    await kafka.subscribe(shared_types_1.KafkaTopic.ANALYTICS_EVENT, 'analytics-event-group', async (event) => {
        try {
            await service.ingestEvent(event.payload);
        }
        catch (err) {
            logger.error('Failed to ingest analytics event from Kafka', { error: err });
        }
    });
    // Also consume song.played for real-time song analytics
    await kafka.subscribe(shared_types_1.KafkaTopic.SONG_PLAYED, 'analytics-song-played-group', async (event) => {
        try {
            const { songId, userId, duration } = event.payload;
            await service.trackSongPlay({
                songId,
                userId,
                duration: duration || 0,
                completionRate: event.payload.completionRate || 0,
                skipped: event.payload.skipped || false,
                country: event.payload.country,
            });
        }
        catch (err) {
            logger.error('Failed to track song play from Kafka', { error: err });
        }
    });
    /* ── Graceful shutdown ────────────────────────────────────────────── */
    app.addHook('onClose', async () => {
        await service.shutdown();
        await kafka.disconnect();
        await mongoose_1.default.disconnect();
        logger.info('Analytics service shut down');
    });
    return app;
}
//# sourceMappingURL=app.js.map