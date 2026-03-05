/**
 * @auralux/kafka-client
 * Typed Kafka producer/consumer wrapper built on KafkaJS.
 * Provides event-driven message bus with serialization, retry, and dead-letter support.
 */
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
export type MessageHandler<T = unknown> = (payload: T, metadata: {
    topic: string;
    partition: number;
    offset: string;
    timestamp: string;
    headers: Record<string, string | undefined>;
}) => Promise<void>;
/**
 * Kafka event bus client — wraps KafkaJS for typed publish/subscribe
 * with built-in serialization and error handling.
 */
export declare class KafkaEventBus {
    private config;
    private kafka;
    private producer;
    private consumers;
    private isProducerConnected;
    constructor(config: KafkaClientConfig);
    /** ── Producer ─────────────────────────────────────────── */
    connectProducer(): Promise<void>;
    /**
     * Publish a typed event to a Kafka topic.
     * Automatically serializes payload and injects event metadata.
     */
    publish<T>(payload: T, options: PublishOptions): Promise<void>;
    /** ── Consumer ─────────────────────────────────────────── */
    /**
     * Subscribe to a topic and process messages with the provided handler.
     * Each subscription creates its own consumer for isolation.
     */
    subscribe<T>(topic: string, handler: MessageHandler<T>, options?: {
        fromBeginning?: boolean;
    }): Promise<void>;
    /** ── Lifecycle ────────────────────────────────────────── */
    disconnect(): Promise<void>;
    /** Check if producer is connected */
    isConnected(): boolean;
}
export default KafkaEventBus;
//# sourceMappingURL=index.d.ts.map