"use strict";
/**
 * API Gateway — JWT Authentication Middleware
 * Validates Bearer tokens on protected routes and injects
 * decoded user context into the request for downstream proxying.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = createAuthMiddleware;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const common_1 = require("@auralux/common");
/**
 * Creates an authentication hook for Fastify.
 * Verifies JWT from Authorization header and attaches decoded payload to request.
 */
function createAuthMiddleware(jwtSecret) {
    return async function authenticate(request, _reply) {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedError('Missing or invalid authorization header');
        }
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            request.user = decoded;
            // Forward user context to downstream services via headers
            request.headers['x-user-id'] = decoded.sub;
            request.headers['x-user-email'] = decoded.email;
            request.headers['x-user-role'] = decoded.role;
            request.headers['x-user-subscription'] = decoded.subscription;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new common_1.UnauthorizedError('Token has expired');
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new common_1.UnauthorizedError('Invalid token');
            }
            throw new common_1.UnauthorizedError('Authentication failed');
        }
    };
}
/**
 * Role-based access control guard.
 * Checks if the authenticated user has one of the required roles.
 */
function requireRole(...allowedRoles) {
    return async function checkRole(request, _reply) {
        if (!request.user) {
            throw new common_1.UnauthorizedError('Authentication required');
        }
        if (!allowedRoles.includes(request.user.role)) {
            throw new common_1.ForbiddenError(`Role '${request.user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`);
        }
    };
}
//# sourceMappingURL=auth.js.map