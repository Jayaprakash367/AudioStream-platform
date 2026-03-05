import { FastifyInstance } from 'fastify';
import { RecommendationService } from '../services';

export async function recommendationRoutes(
  app: FastifyInstance,
  service: RecommendationService,
): Promise<void> {

  /* GET /recommendations – personalised recommendations */
  app.get<{ Querystring: { limit?: string } }>(
    '/recommendations',
    async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || '';
      if (!userId) return reply.status(401).send({ error: 'Missing user context' });

      const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);
      const items = await service.getRecommendations(userId, limit);
      return reply.send({ data: items, meta: { count: items.length, limit } });
    },
  );

  /* GET /recommendations/profile – user's taste profile */
  app.get('/recommendations/profile', async (request, reply) => {
    const userId = (request.headers['x-user-id'] as string) || '';
    if (!userId) return reply.status(401).send({ error: 'Missing user context' });

    const profile = await service.getUserTasteProfile(userId);
    if (!profile) return reply.status(404).send({ error: 'No taste profile yet' });
    return reply.send({ data: profile });
  });

  /* POST /recommendations/refresh – force-refresh cached recommendations */
  app.post('/recommendations/refresh', async (request, reply) => {
    const userId = (request.headers['x-user-id'] as string) || '';
    if (!userId) return reply.status(401).send({ error: 'Missing user context' });

    // Invalidate cached batch
    const cacheKey = `recommendations:${userId}`;
    // Generate fresh
    const items = await service.getRecommendations(userId, 20);
    return reply.send({ data: items, meta: { refreshed: true } });
  });
}
