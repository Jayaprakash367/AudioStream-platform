/**
 * API Gateway — JWT Authentication Middleware
 * Validates Bearer tokens on protected routes and injects
 * decoded user context into the request for downstream proxying.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    subscription: string;
    iat: number;
    exp: number;
    jti: string;
}
declare module 'fastify' {
    interface FastifyRequest {
        user?: JwtPayload;
    }
}
/**
 * Creates an authentication hook for Fastify.
 * Verifies JWT from Authorization header and attaches decoded payload to request.
 */
export declare function createAuthMiddleware(jwtSecret: string): (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
/**
 * Role-based access control guard.
 * Checks if the authenticated user has one of the required roles.
 */
export declare function requireRole(...allowedRoles: string[]): (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
export {};
//# sourceMappingURL=auth.d.ts.map