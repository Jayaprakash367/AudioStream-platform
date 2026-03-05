import { FastifyInstance } from 'fastify';
import { NotificationService } from '../services';
import { NotificationChannel, NotificationType, NotificationStatus } from '../models';

export async function notificationRoutes(
  app: FastifyInstance,
  service: NotificationService,
): Promise<void> {

  /* GET /notifications – list user notifications */
  app.get<{ Querystring: { page?: string; limit?: string; status?: string } }>(
    '/notifications',
    async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || '';
      if (!userId) return reply.status(401).send({ error: 'Missing user context' });

      const page = Math.max(parseInt(request.query.page || '1', 10), 1);
      const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);
      const status = request.query.status as NotificationStatus | undefined;

      const { notifications, total } = await service.getUserNotifications(userId, { page, limit, status });
      return reply.send({
        data: notifications,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    },
  );

  /* GET /notifications/unread-count */
  app.get('/notifications/unread-count', async (request, reply) => {
    const userId = (request.headers['x-user-id'] as string) || '';
    if (!userId) return reply.status(401).send({ error: 'Missing user context' });

    const count = await service.getUnreadCount(userId);
    return reply.send({ data: { unreadCount: count } });
  });

  /* PATCH /notifications/:id/read */
  app.patch<{ Params: { id: string } }>(
    '/notifications/:id/read',
    async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || '';
      if (!userId) return reply.status(401).send({ error: 'Missing user context' });

      const notification = await service.markAsRead(request.params.id, userId);
      if (!notification) return reply.status(404).send({ error: 'Notification not found' });
      return reply.send({ data: notification });
    },
  );

  /* POST /notifications/read-all */
  app.post('/notifications/read-all', async (request, reply) => {
    const userId = (request.headers['x-user-id'] as string) || '';
    if (!userId) return reply.status(401).send({ error: 'Missing user context' });

    const count = await service.markAllAsRead(userId);
    return reply.send({ data: { markedRead: count } });
  });

  /* GET /notifications/preferences */
  app.get('/notifications/preferences', async (request, reply) => {
    const userId = (request.headers['x-user-id'] as string) || '';
    if (!userId) return reply.status(401).send({ error: 'Missing user context' });

    const prefs = await service.updatePreferences(userId, {}); // get or create
    return reply.send({ data: prefs });
  });

  /* PATCH /notifications/preferences */
  app.patch<{
    Body: {
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      smsEnabled?: boolean;
      inAppEnabled?: boolean;
      quietHoursStart?: string;
      quietHoursEnd?: string;
      disabledTypes?: NotificationType[];
    };
  }>('/notifications/preferences', async (request, reply) => {
    const userId = (request.headers['x-user-id'] as string) || '';
    if (!userId) return reply.status(401).send({ error: 'Missing user context' });

    const prefs = await service.updatePreferences(userId, request.body);
    return reply.send({ data: prefs });
  });

  /* POST /notifications/send – internal / admin endpoint to dispatch notification */
  app.post<{
    Body: {
      userId: string;
      type: NotificationType;
      channels: NotificationChannel[];
      title: string;
      body: string;
      metadata?: Record<string, unknown>;
      scheduledAt?: string;
    };
  }>('/notifications/send', async (request, reply) => {
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
