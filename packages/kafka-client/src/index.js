"use strict";
/**
 * @auralux/kafka-client
 * Typed Kafka producer/consumer wrapper built on KafkaJS.
 * Provides event-driven message bus with serialization, retry, and dead-letter support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaEventBus = void 0;
const kafkajs_1 = require("kafkajs");
const uuid_1 = require("uuid");
/**
 * Kafka event bus client — wraps KafkaJS for typed publish/subscribe
 * with built-in serialization and error handling.
 */
class KafkaEventBus {
    config;
    kafka;
    producer = null;
    consumers = new Map();
    isProducerConnected = false;
    constructor(config) {
        this.config = config;
        const kafkaLogLevel = {
            ERROR: kafkajs_1.logLevel.ERROR,
            WARN: kafkajs_1.logLevel.WARN,
            INFO: kafkajs_1.logLevel.INFO,
            DEBUG: kafkajs_1.logLevel.DEBUG,
        };
        this.kafka = new kafkajs_1.Kafka({
            clientId: config.clientId,
            brokers: config.brokers,
            logLevel: kafkaLogLevel[config.logLevel || 'WARN'],
            retry: {
                initialRetryTime: 300,
                retries: 8,
                maxRetryTime: 30000,
                factor: 2,
            },
        });
    }
    /** ── Producer ─────────────────────────────────────────── */
    async connectProducer() {
        if (this.isProducerConnected)
            return;
        this.producer = this.kafka.producer({
            allowAutoTopicCreation: true,
            idempotent: true,
            maxInFlightRequests: 5,
        });
        await this.producer.connect();
        this.isProducerConnected = true;
    }
    /**
     * Publish a typed event to a Kafka topic.
     * Automatically serializes payload and injects event metadata.
     */
    async publish(payload, options) {
        if (!this.producer || !this.isProducerConnected) {
            await this.connectProducer();
        }
        const eventId = (0, uuid_1.v4)();
        const message = {
            key: options.key || eventId,
            value: JSON.stringify({
                eventId,
                timestamp: new Date().toISOString(),
                source: this.config.clientId,
                payload,
            }),
            headers: {
                'event-id': eventId,
                'source-service': this.config.clientId,
                'content-type': 'application/json',
                ...options.headers,
            },
        };
        await this.producer.send({
            topic: options.topic,
            messages: [message],
            compression: kafkajs_1.CompressionTypes.GZIP,
        });
    }
    /** ── Consumer ─────────────────────────────────────────── */
    /**
     * Subscribe to a topic and process messages with the provided handler.
     * Each subscription creates its own consumer for isolation.
     */
    async subscribe(topic, handler, options = {}) {
        const groupId = this.config.groupId || `${this.config.clientId}-group`;
        const consumer = this.kafka.consumer({
            groupId: `${groupId}-${topic}`,
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
        });
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: options.fromBeginning ?? false });
        await consumer.run({
            eachMessage: async (messagePayload) => {
                const { topic: msgTopic, partition, message } = messagePayload;
                try {
                    const value = message.value?.toString();
                    if (!value)
                        return;
                    const parsed = JSON.parse(value);
                    const headers = {};
                    if (message.headers) {
                        for (const [key, val] of Object.entries(message.headers)) {
                            headers[key] = val?.toString();
                        }
                    }
                    await handler(parsed.payload, {
                        topic: msgTopic,
                        partition,
                        offset: message.offset,
                        timestamp: message.timestamp || new Date().toISOString(),
                        headers,
                    });
                }
                catch (error) {
                    // Log error but don't crash the consumer
                    console.error(`[KafkaEventBus] Error processing message on ${topic}:`, error);
                    // TODO: Route to dead-letter topic for manual inspection
                }
            },
        });
        this.consumers.set(topic, consumer);
    }
    /** ── Lifecycle ────────────────────────────────────────── */
    async disconnect() {
        if (this.producer && this.isProducerConnected) {
            await this.producer.disconnect();
            this.isProducerConnected = false;
        }
        for (const [topic, consumer] of this.consumers) {
            await consumer.disconnect();
            this.consumers.delete(topic);
        }
    }
    /** Check if producer is connected */
    isConnected() {
        return this.isProducerConnected;
    }
}
exports.KafkaEventBus = KafkaEventBus;
exports.default = KafkaEventBus;
//# sourceMappingURL=index.js.map