"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHistoryRoutes = registerHistoryRoutes;
async function registerHistoryRoutes(app, service) {
    app.get('/history', async (request, reply) => {
        const userId = request.headers['x-user-id'];
        const { page, limit } = request.query;
        const result = await service.getUserHistory(userId, parseInt(page || '1', 10), parseInt(limit || '20', 10));
        reply.send({ success: true, data: result.entries, meta: result.meta });
    });
    app.get('/history/recent', async (request, reply) => {
        const userId = request.headers['x-user-id'];
        const entries = await service.getRecentlyPlayed(userId);
        reply.send({ success: true, data: entries });
    });
}
//# sourceMappingURL=history.routes.js.map