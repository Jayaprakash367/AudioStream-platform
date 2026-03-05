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
const logger = (0, logger_1.createLogger)({ service: 'recommendation-service', level: 'info' });
async function buildApp(config) {
    const app = (0, fastify_1.default)({
        logger: false,
        requestIdHeader: 'x-request-id',
        genReqId: () => crypto.randomUUID(),
    });
    /* ── Plugins ──────────────────────────────────────────────────────── */
    await app.register(helmet_1.default);
    await app.register(cors_1.default, { origin: config.corsOrigin || '*' });
    (0, common_1.registerRequestId)(app);
    (0, common_1.registerErrorHandler)(app);
    (0, common_1.registerHealthCheck)(app);
    /* ── Infrastructure ───────────────────────────────────────────────── */
    await mongoose_1.default.connect(config.mongoUri || 'mongodb://localhost:27017/auralux_recommendations');
    logger.info('MongoDB connected');
    const cache = new redis_client_1.RedisCacheManager({
        host: config.redisHost || 'localhost',
        port: config.redisPort || 6379,
        keyPrefix: 'rec:',
    });
    const kafka = new kafka_client_1.KafkaEventBus({
        clientId: 'recommendation-service',
        brokers: config.kafkaBrokers || ['localhost:9092'],
    });
    await kafka.connect();
    /* ── Service & Routes ─────────────────────────────────────────────── */
    const service = new services_1.RecommendationService(config, cache);
    await (0, routes_1.recommendationRoutes)(app, service);
    /* ── Kafka Consumer: listening.history events ─────────────────────── */
    await kafka.subscribe(shared_types_1.KafkaTopic.LISTENING_HISTORY, 'recommendation-consumer-group', async (event) => {
        try {
            await service.ingestListeningEvent(event.payload);
            logger.debug('Ingested listening event', { userId: event.payload.userId });
        }
        catch (err) {
            logger.error('Failed to ingest listening event', { error: err });
        }
    });
    /* ── Graceful shutdown hooks ──────────────────────────────────────── */
    app.addHook('onClose', async () => {
        await kafka.disconnect();
        await mongoose_1.default.disconnect();
        logger.info('Recommendation service shut down');
    });
    return app;
}
//# sourceMappingURL=app.js.map