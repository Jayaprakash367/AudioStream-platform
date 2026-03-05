"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = notificationRoutes;
async function notificationRoutes(app, service) {
    /* GET /notifications – list user notifications */
    app.get('/notifications', async (request, reply) => {
        const userId = request.headers['x-user-id'] || '';
        if (!userId)
            return reply.status(401).send({ error: 'Missing user context' });
        const page = Math.max(parseInt(request.query.page || '1', 10), 1);
        const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);
        const status = request.query.status;
        const { notifications, total } = await service.getUserNotifications(userId, { page, limit, status });
        return reply.send({
            data: notifications,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    });
    /* GET /notifications/unread-count */
    app.get('/notifications/unread-count', async (request, reply) => {
        const userId = request.headers['x-user-id'] || '';
        if (!userId)
            return reply.status(401).send({ error: 'Missing user context' });
        const count = await service.getUnreadCount(userId);
        return reply.send({ data: { unreadCount: count } });
    });
    /* PATCH /notifications/:id/read */
    app.patch('/notifications/:id/read', async (request, reply) => {
        const userId = request.headers['x-user-id'] || '';
        if (!userId)
            return reply.status(401).send({ error: 'Missing user context' });
        const notification = await service.markAsRead(request.params.id, userId);
        if (!notification)
            return reply.status(404).send({ error: 'Notification not found' });
        return reply.send({ data: notification });
    });
    /* POST /notifications/read-all */
    app.post('/notifications/read-all', async (request, reply) => {
        const userId = request.headers['x-user-id'] || '';
        if (!userId)
            return reply.status(401).send({ error: 'Missing user context' });
        const count = await service.markAllAsRead(userId);
        return reply.send({ data: { markedRead: count } });
    });
    /* GET /notifications/preferences */
    app.get('/notifications/preferences', async (request, reply) => {
        const userId = request.headers['x-user-id'] || '';
        if (!userId)
            return reply.status(401).send({ error: 'Missing user context' });
        const prefs = await service.updatePreferences(userId, {}); // get or create
        return reply.send({ data: prefs });
    });
    /* PATCH /notifications/preferences */
    app.patch('/notifications/preferences', async (request, reply) => {
        const userId = request.headers['x-user-id'] || '';
        if (!userId)
            return reply.status(401).send({ error: 'Missing user context' });
        const prefs = await service.updatePreferences(userId, request.body);
        return reply.send({ data: prefs });
    });
    /* POST /notifications/send – internal / admin endpoint to dispatch notification */
    app.post('/notifications/send', async (request, reply) => {
        const { userId, type, channels, title, body, metadata, scheduledAt } = request.body;
        const notifications = await service.send({
            userId,
            type,
            channels,
            title,
            body,
            metadata,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        });
        return reply.status(201).send({ data: notifications });
    });
}
//# sourceMappingURL=notification.routes.js.map