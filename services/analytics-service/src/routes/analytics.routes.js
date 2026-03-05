"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = analyticsRoutes;
async function analyticsRoutes(app, service) {
    /* POST /analytics/event – ingest a raw analytics event */
    app.post('/analytics/event', async (request, reply) => {
        await service.ingestEvent(request.body);
        return reply.status(202).send({ accepted: true });
    });
    /* GET /analytics/realtime – real-time counters for today */
    app.get('/analytics/realtime', async (_request, reply) => {
        const stats = await service.getRealTimeStats();
        return reply.send({ data: stats });
    });
    /* GET /analytics/daily/:date – aggregated daily metrics */
    app.get('/analytics/daily/:date', async (request, reply) => {
        const metrics = await service.getDailyMetrics(request.params.date);
        if (!metrics)
            return reply.status(404).send({ error: 'No metrics for this date' });
        return reply.send({ data: metrics });
    });
    /* GET /analytics/range – metrics over date range */
    app.get('/analytics/range', async (request, reply) => {
        const { start, end } = request.query;
        if (!start || !end)
            return reply.status(400).send({ error: 'start and end query params required' });
        const metrics = await service.getMetricsRange(start, end);
        return reply.send({ data: metrics, meta: { count: metrics.length } });
    });
    /* GET /analytics/songs/top – top songs by plays */
    app.get('/analytics/songs/top', async (request, reply) => {
        const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
        const songs = await service.getTopSongs(limit);
        return reply.send({ data: songs, meta: { count: songs.length } });
    });
    /* GET /analytics/songs/:songId – single song analytics */
    app.get('/analytics/songs/:songId', async (request, reply) => {
        const stats = await service.getSongAnalytics(request.params.songId);
        if (!stats)
            return reply.status(404).send({ error: 'No analytics for this song' });
        return reply.send({ data: stats });
    });
    /* POST /analytics/aggregate – trigger daily aggregation (admin) */
    app.post('/analytics/aggregate', async (request, reply) => {
        const { date } = request.body;
        if (!date)
            return reply.status(400).send({ error: 'date is required (YYYY-MM-DD)' });
        await service.aggregateDailyMetrics(date);
        return reply.send({ message: `Aggregation complete for ${date}` });
    });
}
//# sourceMappingURL=analytics.routes.js.map