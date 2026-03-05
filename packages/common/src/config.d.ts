/**
 * Service configuration loader.
 * Reads environment variables with validation and type-safe defaults.
 * Each microservice extends this base config with service-specific settings.
 */
export interface BaseServiceConfig {
    /** Service identity */
    serviceName: string;
    serviceVersion: string;
    nodeEnv: 'development' | 'production' | 'test';
    port: number;
    /** MongoDB connection */
    mongoUri: string;
    mongoDbName: string;
    /** Redis connection */
    redisHost: string;
    redisPort: number;
    redisPassword: string;
    /** Kafka connection */
    kafkaBrokers: string[];
    kafkaClientId: string;
    kafkaGroupId: string;
    /** JWT (used by services that validate tokens) */
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    /** CORS */
    corsOrigins: string[];
    /** Rate limiting */
    rateLimitMax: number;
    rateLimitWindowMs: number;
    /** Logging */
    logLevel: string;
}
/**
 * Loads base configuration from environment variables.
 * Fails fast on missing required variables in production.
 */
export declare function loadBaseConfig(serviceName: string, defaultPort: number): BaseServiceConfig;
//# sourceMappingURL=config.d.ts.map