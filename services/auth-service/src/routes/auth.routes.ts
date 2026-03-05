/**
 * Auth Service — Route Handlers
 * REST endpoints for authentication operations.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} from '@auralux/common';

export async function registerAuthRoutes(
  app: FastifyInstance,
  authService: AuthService
): Promise<void> {
  /** POST /auth/register */
  app.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.parse(request.body);
    const result = await authService.register(body);

    reply.status(201).send({
      success: true,
      data: {
        userId: result.userId,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
        tokenType: 'Bearer',
      },
    });
  });

  /** POST /auth/login */
  app.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.parse(request.body);
    const result = await authService.login({
      ...body,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || 'unknown',
    });

    reply.status(200).send({
      success: true,
      data: {
        userId: result.userId,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
        tokenType: 'Bearer',
      },
    });
  });

  /** POST /auth/refresh */
  app.post('/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refreshTokenSchema.parse(request.body);
    const tokens = await authService.refreshToken(body.refreshToken);

    reply.status(200).send({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      },
    });
  });

  /** POST /auth/logout */
  app.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.headers['x-user-id'] as string;
    const { refreshToken } = request.body as { refreshToken?: string };

    if (userId) {
      await authService.logout(userId, refreshToken);
    }

    reply.status(200).send({ success: true, data: { message: 'Logged out successfully' } });
  });

  /** POST /auth/verify-email */
  app.post('/auth/verify-email', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.body as { token: string };
    await authService.verifyEmail(token);

    reply.status(200).send({ success: true, data: { message: 'Email verified successfully' } });
  });

  /** POST /auth/password-reset */
  app.post('/auth/password-reset', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = passwordResetRequestSchema.parse(request.body);
    const message = await authService.requestPasswordReset(body.email);

    reply.status(200).send({ success: true, data: { message } });
  });

  /** POST /auth/password-reset/confirm */
  app.post('/auth/password-reset/confirm', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = passwordResetConfirmSchema.parse(request.body);
    await authService.confirmPasswordReset(body.token, body.newPassword);

    reply.status(200).send({ success: true, data: { message: 'Password reset successful' } });
  });
}
