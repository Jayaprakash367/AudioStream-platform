/**
 * Auth Service — Route Handlers
 * REST endpoints for authentication operations.
 *
 * Additions over base:
 *   - rememberMe flag → 30-day vs 1-day refresh token TTL
 *   - POST /auth/me — verify current session via Redis cache
 *   - POST /auth/validate — lightweight JWT validation for gateway
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
        rememberMe: false,
      },
    });
  });

  /** POST /auth/login
   *  Body: { email, password, rememberMe?: boolean }
   *
   *  rememberMe=true  → refreshToken lives 30 days  (stored in localStorage by client)
   *  rememberMe=false → refreshToken lives 1 day    (sessionStorage only)
   */
  app.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawBody = request.body as Record<string, unknown>;
    const body = loginSchema.parse(rawBody);
    const rememberMe = rawBody.rememberMe === true;

    const result = await authService.login({
      ...body,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || 'unknown',
      rememberMe,
    });

    reply.status(200).send({
      success: true,
      data: {
        userId: result.userId,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
        tokenType: 'Bearer',
        rememberMe,
      },
    });
  });

  /** POST /auth/refresh
   *  Rotates the refresh token — client always gets a fresh pair.
   *  The old refresh token is revoked immediately (token rotation pattern).
   */
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

  /** POST /auth/logout
   *  Revokes the given refresh token (or all tokens if none supplied).
   *  Also blacklists the user's access token in Redis for 15 minutes.
   */
  app.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.headers['x-user-id'] as string;
    const { refreshToken } = request.body as { refreshToken?: string };

    if (userId) {
      await authService.logout(userId, refreshToken);
    }

    reply.status(200).send({ success: true, data: { message: 'Logged out successfully' } });
  });

  /** GET /auth/me
   *  Returns the cached user profile from Redis (session check).
   *  Used by the frontend on page load to auto-login.
   *  The client sends: Authorization: Bearer <accessToken>
   */
  app.get('/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers['authorization'];
    const userId = request.headers['x-user-id'] as string;

    if (!authHeader || !authHeader.startsWith('Bearer ') || !userId) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const profile = await authService.getSessionProfile(userId);
    if (!profile) {
      return reply.status(401).send({ success: false, error: 'Session expired' });
    }

    reply.status(200).send({ success: true, data: profile });
  });

  /** POST /auth/validate
   *  Lightweight: returns decoded token payload if valid.
   *  Used by api-gateway to authenticate every inbound request.
   */
  app.post('/auth/validate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.body as { token: string };
    const payload = await authService.validateToken(token);

    reply.status(200).send({ success: true, data: payload });
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
