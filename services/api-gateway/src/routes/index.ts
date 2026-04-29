/**
 * API Gateway — Route Definitions
 * Maps incoming API paths to upstream microservices via reverse proxy.
 * Public routes bypass JWT authentication; protected routes require it.
 */

import { FastifyInstance } from 'fastify';
import proxy from '@fastify/http-proxy';
import { GatewayConfig } from '../config';
import { createAuthMiddleware } from '../middleware/auth';

interface RouteDefinition {
  /** Path prefix to match incoming requests */
  prefix: string;
  /** Upstream service base URL */
  upstream: string;
  /** If true, skip JWT auth (for login, register, public catalog) */
  isPublic?: boolean;
  /** Rewrite prefix for upstream (e.g., /api/v1/auth → /auth) */
  rewritePrefix?: string;
}

/**
 * Register all reverse proxy routes.
 * The gateway forwards requests to the appropriate microservice,
 * injecting auth context for protected routes.
 */
export async function registerRoutes(app: FastifyInstance, config: GatewayConfig): Promise<void> {
  const authMiddleware = createAuthMiddleware(config.jwtSecret);

  const routes: RouteDefinition[] = [
    // ── Auth Service (public endpoints for login/register) ──
    {
      prefix: '/api/v1/auth',
      upstream: config.services.auth,
      isPublic: true,
      rewritePrefix: '/auth',
    },

    // ── User Service ──
    {
      prefix: '/api/v1/users',
      upstream: config.services.user,
      rewritePrefix: '/users',
    },

    // ── Music Catalog Service (search is public, some endpoints protected) ──
    {
      prefix: '/api/v1/music',
      upstream: config.services.music,
      isPublic: true,
      rewritePrefix: '/music',
    },

    // ── Streaming Service ──
    {
      prefix: '/api/v1/stream',
      upstream: config.services.streaming,
      rewritePrefix: '/stream',
    },

    // ── Playlist Service ──
    {
      prefix: '/api/v1/playlists',
      upstream: config.services.playlist,
      rewritePrefix: '/playlists',
    },

    // ── History Service ──
    {
      prefix: '/api/v1/history',
      upstream: config.services.history,
      rewritePrefix: '/history',
    },

    // ── Recommendation Service ──
    {
      prefix: '/api/v1/recommendations',
      upstream: config.services.recommendation,
      rewritePrefix: '/recommendations',
    },

    // ── Analytics Service ──
    {
      prefix: '/api/v1/analytics',
      upstream: config.services.analytics,
      rewritePrefix: '/analytics',
    },

    // ── Notification Service ──
    {
      prefix: '/api/v1/notifications',
      upstream: config.services.notification,
      rewritePrefix: '/notifications',
    },
  ];

  for (const route of routes) {
    await app.register(proxy, {
      upstream: route.upstream,
      prefix: route.prefix,
      rewritePrefix: route.rewritePrefix || route.prefix,
      http2: false,
      undici: {
        connections: 128,
        pipelining: 1,
      },
      // Inject auth middleware for protected routes
      preHandler: route.isPublic ? undefined : authMiddleware,
      replyOptions: {
        rewriteRequestHeaders: (originalRequest, headers) => {
          // Forward correlation ID for distributed tracing
          return {
            ...headers,
            'x-correlation-id': originalRequest.headers['x-correlation-id'] || originalRequest.id,
            'x-forwarded-for': originalRequest.ip,
          };
        },
      },
    });
  }
}
