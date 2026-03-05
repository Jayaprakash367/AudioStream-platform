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
const common_1 = require("@auralux/common");
const logger_1 = require("@auralux/logger");
const kafka_client_1 = require("@auralux/kafka-client");
const shared_types_1 = require("@auralux/shared-types");
const services_1 = require("./services");
const routes_1 = require("./routes");
async function buildApp(config) {
    const logger = (0, logger_1.createLogger)({ serviceName: config.serviceName, level: config.logLevel });
    const app = (0, fastify_1.default)({ logger: false, requestIdHeader: 'x-request-id', trustProxy: true });
    await mongoose_1.default.connect(`${config.mongoUri}/${config.mongoDbName}`);
    logger.info('MongoDB connected');
    const kafka = new kafka_client_1.KafkaEventBus({ brokers: config.kafkaBrokers, clientId: config.kafkaClientId, groupId: config.kafkaGroupId });
    await kafka.connectProducer();
    await app.register(helmet_1.default);
    await app.register(cors_1.default, { origin: config.corsOrigins, credentials: true });
    (0, common_1.registerRequestId)(app);
    (0, common_1.registerResponseTime)(app);
    (0, common_1.registerErrorHandler)(app);
    (0, common_1.registerHealthCheck)(app, config.serviceName, config.serviceVersion, [
        { name: 'mongodb', check: async () => mongoose_1.default.connection.readyState === 1 },
    ]);
    const historyService = new services_1.HistoryService(kafka);
    await (0, routes_1.registerHistoryRoutes)(app, historyService);
    // Consume song.played events from Kafka
    await kafka.subscribe(shared_types_1.KafkaTopic.SONG_PLAYED, async (payload) => {
        logger.debug('Recording listening event', { userId: payload.userId, songId: payload.songId });
        await historyService.recordListening(payload);
    });
    const shutdown = async () => { await app.close(); await mongoose_1.default.disconnect(); await kafka.disconnect(); };
    return { app, shutdown };
}
//# sourceMappingURL=app.js.map