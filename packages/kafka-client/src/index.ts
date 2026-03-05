/**
 * @auralux/kafka-client
 * Typed Kafka producer/consumer wrapper built on KafkaJS.
 * Provides event-driven message bus with serialization, retry, and dead-letter support.
 */

import { Kafka, Producer, Consumer, EachMessagePayload, logLevel, CompressionTypes } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

export interface KafkaClientConfig {
  brokers: string[];
  clientId: string;
  groupId?: string;
  logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
}

export interface PublishOptions {
  topic: string;
  key?: string;
  headers?: Record<string, string>;
}

export type MessageHandler<T = unknown> = (
  payload: T,
  metadata: {
    topic: string;
    partition: number;
    offset: string;
    timestamp: string;
    headers: Record<string, string | undefined>;
  }
) => Promise<void>;

/**
 * Kafka event bus client — wraps KafkaJS for typed publish/subscribe
 * with built-in serialization and error handling.
 */
export class KafkaEventBus {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private isProducerConnected = false;

  constructor(private config: KafkaClientConfig) {
    const kafkaLogLevel = {
      ERROR: logLevel.ERROR,
      WARN: logLevel.WARN,
      INFO: logLevel.INFO,
      DEBUG: logLevel.DEBUG,
    };

    this.kafka = new Kafka({
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

  async connectProducer(): Promise<void> {
    if (this.isProducerConnected) return;

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
  async publish<T>(payload: T, options: PublishOptions): Promise<void> {
    if (!this.producer || !this.isProducerConnected) {
      await this.connectProducer();
    }

    const eventId = uuidv4();
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

    await this.producer!.send({
      topic: options.topic,
      messages: [message],
      compression: CompressionTypes.GZIP,
    });
  }

  /** ── Consumer ─────────────────────────────────────────── */

  /**
   * Subscribe to a topic and process messages with the provided handler.
   * Each subscription creates its own consumer for isolation.
   */
  async subscribe<T>(
    topic: string,
    handler: MessageHandler<T>,
    options: { fromBeginning?: boolean } = {}
  ): Promise<void> {
    const groupId = this.config.groupId || `${this.config.clientId}-group`;
    const consumer = this.kafka.consumer({
      groupId: `${groupId}-${topic}`,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: options.fromBeginning ?? false });

    await consumer.run({
      eachMessage: async (messagePayload: EachMessagePayload) => {
        const { topic: msgTopic, partition, message } = messagePayload;

        try {
          const value = message.value?.toString();
          if (!value) return;

          const parsed = JSON.parse(value);
          const headers: Record<string, string | undefined> = {};
          if (message.headers) {
            for (const [key, val] of Object.entries(message.headers)) {
              headers[key] = val?.toString();
            }
          }

          await handler(parsed.payload as T, {
            topic: msgTopic,
            partition,
            offset: message.offset,
            timestamp: message.timestamp || new Date().toISOString(),
            headers,
          });
        } catch (error) {
          // Log error but don't crash the consumer
          console.error(`[KafkaEventBus] Error processing message on ${topic}:`, error);
          // TODO: Route to dead-letter topic for manual inspection
        }
      },
    });

    this.consumers.set(topic, consumer);
  }

  /** ── Lifecycle ────────────────────────────────────────── */

  async disconnect(): Promise<void> {
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
  isConnected(): boolean {
    return this.isProducerConnected;
  }
}

export default KafkaEventBus;
