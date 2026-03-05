/**
 * User Service — Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services';
import { updateProfileSchema } from '@auralux/common';

export async function registerUserRoutes(app: FastifyInstance, userService: UserService): Promise<void> {
  /** GET /users/me — Get authenticated user's profile */
  app.get('/users/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.headers['x-user-id'] as string;
    const user = await userService.getUserById(userId);
    reply.send({ success: true, data: user });
  });

  /** GET /users/:userId */
  app.get('/users/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const user = await userService.getUserById(userId);
    reply.send({ success: true, data: user });
  });

  /** PATCH /users/me — Update profile */
  app.patch('/users/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.headers['x-user-id'] as string;
    const body = updateProfileSchema.parse(request.body);
    const user = await userService.updateUser(userId, body);
    reply.send({ success: true, data: user });
  });

  /** PATCH /users/me/subscription */
  app.patch('/users/me/subscription', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.headers['x-user-id'] as string;
    const { tier } = request.body as { tier: string };
    const user = await userService.updateSubscription(userId, tier);
    reply.send({ success: true, data: user });
  });
}
