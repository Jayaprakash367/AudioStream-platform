import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createLogger, RATE_LIMITS } from '@auralux/shared';
import { config } from './config';
import { initRedis, shutdownRedis } from './services/redis.service';
import { authRouter } from './routes/auth.routes';
import { healthRouter } from './routes/health.routes';

import * as dotenv from 'dotenv';
dotenv.config();

const logger = createLogger('auth-server');
const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many auth requests. Please try again later.',
      retryable: true,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api', healthRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found', retryable: false },
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isDev ? err.message : 'Internal server error',
      retryable: true,
    },
  });
});

// Start
async function start() {
  try {
    await initRedis();
    app.listen(config.port, () => {
      logger.info(`Auth service running on port ${config.port}`, {
        env: config.nodeEnv,
        redirectUri: config.spotify.redirectUri,
        corsOrigins: config.cors.allowedOrigins,
      });
    });
  } catch (error) {
    logger.error('Failed to start auth service', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await shutdownRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  await shutdownRedis();
  process.exit(0);
});

start();

export { app };
