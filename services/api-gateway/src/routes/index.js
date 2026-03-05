"use strict";
/**
 * API Gateway — Route Definitions
 * Maps incoming API paths to upstream microservices via reverse proxy.
 * Public routes bypass JWT authentication; protected routes require it.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const http_proxy_1 = __importDefault(require("@fastify/http-proxy"));
const auth_1 = require("../middleware/auth");
/**
 * Register all reverse proxy routes.
 * The gateway forwards requests to the appropriate microservice,
 * injecting auth context for protected routes.
 */
async function registerRoutes(app, config) {
    const authMiddleware = (0, auth_1.createAuthMiddleware)(config.jwtSecret);
    const routes = [
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
        await app.register(http_proxy_1.default, {
            upstream: route.upstream,
            prefix: route.prefix,
            rewritePrefix: route.rewritePrefix || route.prefix,
            http2: false,
            // Inject auth middleware for protected routes
            preHandler: route.isPublic ? undefined : authMiddleware,
            replyOptions: {
                rewriteRequestHeaders: (originalRequest, headers) => {
                    // Forward correlation ID for distributed tracing
                    return {
                        ...headers,
                        'x-correlation-id': originalRequest.headers['x-correlation-id'] || originalRequest.id,
                        'x-forwarded-for': originalRequest.ip,
                        'x-gateway-timestamp': new Date().toISOString(),
                    };
                },
            },
        });
    }
}
//# sourceMappingURL=index.js.map