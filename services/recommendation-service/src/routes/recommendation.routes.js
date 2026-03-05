"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendationRoutes = recommendationRoutes;
async function recommendationRoutes(app, service) {
    /* GET /recommendations – personalised recommendations */
    app.get('/recommendations', async (request, reply) => {
        const userId = request.headers['x-user-id'] || '';
        if (!userId)
            return reply.status(401).send({ error: 'Missing user context' });
        const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);
        const items = await service.getRecommendations(userId, limit);
        return reply.send({ data: items, meta: { count: items.length, limit } });
    });
    /* GET /recommendations/profile – user's taste profile */
    app.get('/recommendations/profile', async (request, reply) => {
        const userId = request.headers['x-user-id'] || '';
        if (!userId)
            return reply.status(401).send({ error: 'Missing user context' });
        const profile = await service.getUserTasteProfile(userId);
        if (!profile)
            return reply.status(404).send({ error: 'No taste profile yet' });
        return reply.send({ data: profile });
    });
    /* POST /recommendations/refresh – force-refresh cached recommendations */
    app.post('/recommendations/refresh', async (request, reply) => {
        const userId = request.headers['x-user-id'] || '';
        if (!userId)
            return reply.status(401).send({ error: 'Missing user context' });
        // Invalidate cached batch
        const cacheKey = `recommendations:${userId}`;
        // Generate fresh
        const items = await service.getRecommendations(userId, 20);
        return reply.send({ data: items, meta: { refreshed: true } });
    });
}
//# sourceMappingURL=recommendation.routes.js.map