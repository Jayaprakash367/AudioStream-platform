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
export function loadBaseConfig(serviceName: string = 'service', defaultPort: number = 3000): BaseServiceConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as BaseServiceConfig['nodeEnv'];

  const config: BaseServiceConfig = {
    serviceName,
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    nodeEnv,
    port: parseInt(process.env.PORT || String(defaultPort), 10),

    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    mongoDbName: process.env.MONGO_DB_NAME || `auralux_${serviceName.replace(/-/g, '_')}`,

    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    redisPassword: process.env.REDIS_PASSWORD || '',

    kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    kafkaClientId: process.env.KAFKA_CLIENT_ID || `auralux-${serviceName}`,
    kafkaGroupId: process.env.KAFKA_GROUP_ID || `auralux-${serviceName}-group`,

    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),

    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),

    logLevel: process.env.LOG_LEVEL || 'info',
  };

  // Fail fast in production if critical secrets are defaults
  if (nodeEnv === 'production') {
    const criticalChecks = [
      { key: 'JWT_SECRET', value: config.jwtSecret, isDefault: config.jwtSecret === 'dev-secret-change-in-production' },
    ];

    const failures = criticalChecks.filter((c) => c.isDefault);
    if (failures.length > 0) {
      const missing = failures.map((f) => f.key).join(', ');
      throw new Error(`FATAL: Production requires non-default values for: ${missing}`);
    }
  }

  return config;
}
