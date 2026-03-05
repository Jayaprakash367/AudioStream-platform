"use strict";
/**
 * Auth Service — Application Factory
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const common_1 = require("@auralux/common");
const logger_1 = require("@auralux/logger");
const kafka_client_1 = require("@auralux/kafka-client");
const redis_client_1 = require("@auralux/redis-client");
const services_1 = require("./services");
const routes_1 = require("./routes");
async function buildApp(config) {
    const logger = (0, logger_1.createLogger)({ serviceName: config.serviceName, level: config.logLevel });
    const app = (0, fastify_1.default)({
        logger: false,
        requestIdHeader: 'x-request-id',
        trustProxy: true,
    });
    /** ── MongoDB Connection ── */
    await mongoose_1.default.connect(`${config.mongoUri}/${config.mongoDbName}`);
    logger.info('MongoDB connected', { db: config.mongoDbName });
    /** ── Redis ── */
    const redis = new redis_client_1.RedisCacheManager({
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword,
        keyPrefix: 'auth:',
    });
    await redis.connect();
    logger.info('Redis connected');
    /** ── Kafka Producer ── */
    const kafka = new kafka_client_1.KafkaEventBus({
        brokers: config.kafkaBrokers,
        clientId: config.kafkaClientId,
    });
    await kafka.connectProducer();
    logger.info('Kafka producer connected');
    /** ── Plugins ── */
    await app.register(helmet_1.default);
    await app.register(cors_1.default, { origin: config.corsOrigins, credentials: true });
    /** ── Middleware ── */
    (0, common_1.registerRequestId)(app);
    (0, common_1.registerResponseTime)(app);
    (0, common_1.registerErrorHandler)(app);
    /** ── Health Checks ── */
    (0, common_1.registerHealthCheck)(app, config.serviceName, config.serviceVersion, [
        { name: 'mongodb', check: async () => mongoose_1.default.connection.readyState === 1 },
        { name: 'redis', check: () => redis.ping() },
        { name: 'kafka', check: async () => kafka.isConnected() },
    ]);
    /** ── Service Layer ── */
    const authService = new services_1.AuthService(config, kafka, redis);
    /** ── Routes ── */
    await (0, routes_1.registerAuthRoutes)(app, authService);
    /** ── Graceful Shutdown ── */
    const shutdown = async () => {
        logger.info('Shutting down auth service...');
        await app.close();
        await mongoose_1.default.disconnect();
        await redis.disconnect();
        await kafka.disconnect();
        logger.info('Auth service shutdown complete');
    };
    return { app, shutdown };
}
//# sourceMappingURL=app.js.map