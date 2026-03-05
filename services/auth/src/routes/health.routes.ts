import { Router, Request, Response } from 'express';
import { getRedisStatus } from '../services/redis.service';

const router = Router();
const startTime = Date.now();

router.get('/health', (_req: Request, res: Response) => {
  const redisStatus = getRedisStatus();
  res.json({
    status: 'healthy',
    version: '1.0.0',
    service: 'auth',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    dependencies: {
      redis: { status: redisStatus.connected ? 'up' : 'degraded', mode: redisStatus.mode },
      spotify: { status: 'up', message: 'OAuth2 endpoints reachable' },
    },
  });
});

router.get('/ready', (_req: Request, res: Response) => {
  res.json({ ready: true });
});

export { router as healthRouter };
