import { createLogger } from '@auralux/shared';

const logger = createLogger('auth-config');

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    logger.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config = {
  port: parseInt(optionalEnv('PORT', '4001'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isDev: optionalEnv('NODE_ENV', 'development') === 'development',

  spotify: {
    clientId: requireEnv('SPOTIFY_CLIENT_ID'),
    clientSecret: requireEnv('SPOTIFY_CLIENT_SECRET'),
    redirectUri: optionalEnv('SPOTIFY_REDIRECT_URI', 'http://localhost:4001/api/auth/callback'),
  },

  frontend: {
    url: optionalEnv('FRONTEND_URL', 'http://localhost:3000'),
  },

  redis: {
    url: optionalEnv('REDIS_URL', 'redis://localhost:6379'),
  },

  security: {
    sessionSecret: optionalEnv('SESSION_SECRET', 'dev-session-secret-change-in-production'),
    encryptionKey: optionalEnv('ENCRYPTION_KEY', 'dev-encryption-key-32chars-long!'),
  },

  cors: {
    allowedOrigins: optionalEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map((s) => s.trim()),
  },
} as const;

export type Config = typeof config;
