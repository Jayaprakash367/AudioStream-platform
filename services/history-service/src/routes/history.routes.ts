import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { HistoryService } from '../services';

export async function registerHistoryRoutes(app: FastifyInstance, service: HistoryService): Promise<void> {
  app.get('/history', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.headers['x-user-id'] as string;
    const { page, limit } = request.query as { page?: string; limit?: string };
    const result = await service.getUserHistory(userId, parseInt(page || '1', 10), parseInt(limit || '20', 10));
    reply.send({ success: true, data: result.entries, meta: result.meta });
  });

  app.get('/history/recent', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.headers['x-user-id'] as string;
    const entries = await service.getRecentlyPlayed(userId);
    reply.send({ success: true, data: entries });
  });
}
