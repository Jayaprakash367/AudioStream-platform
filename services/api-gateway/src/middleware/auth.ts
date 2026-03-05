/**
 * API Gateway — JWT Authentication Middleware
 * Validates Bearer tokens on protected routes and injects
 * decoded user context into the request for downstream proxying.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '@auralux/common';

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
export function createAuthMiddleware(jwtSecret: string) {
  return async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      request.user = decoded;

      // Forward user context to downstream services via headers
      request.headers['x-user-id'] = decoded.sub;
      request.headers['x-user-email'] = decoded.email;
      request.headers['x-user-role'] = decoded.role;
      request.headers['x-user-subscription'] = decoded.subscription;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Authentication failed');
    }
  };
}

/**
 * Role-based access control guard.
 * Checks if the authenticated user has one of the required roles.
 */
export function requireRole(...allowedRoles: string[]) {
  return async function checkRole(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenError(
        `Role '${request.user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`
      );
    }
  };
}
