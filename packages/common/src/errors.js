"use strict";
/**
 * Custom error hierarchy for structured error handling across services.
 * All errors extend AppError which includes HTTP status codes and
 * machine-readable error codes for API consumers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalError = exports.ServiceUnavailableError = exports.RateLimitError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    details;
    constructor(message, statusCode, code, isOperational = true, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/** 400 — Client sent malformed or invalid request data */
class BadRequestError extends AppError {
    constructor(message = 'Bad request', details) {
        super(message, 400, 'BAD_REQUEST', true, details);
    }
}
exports.BadRequestError = BadRequestError;
/** 401 — Missing or invalid authentication credentials */
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED', true);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/** 403 — Authenticated but insufficient permissions */
class ForbiddenError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'FORBIDDEN', true);
    }
}
exports.ForbiddenError = ForbiddenError;
/** 404 — Requested resource does not exist */
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND', true);
    }
}
exports.NotFoundError = NotFoundError;
/** 409 — Conflicting state (e.g., duplicate email registration) */
class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT', true);
    }
}
exports.ConflictError = ConflictError;
/** 422 — Request syntactically valid but semantically incorrect */
class ValidationError extends AppError {
    constructor(message = 'Validation failed', details) {
        super(message, 422, 'VALIDATION_ERROR', true, details);
    }
}
exports.ValidationError = ValidationError;
/** 429 — Rate limit exceeded */
class RateLimitError extends AppError {
    constructor(retryAfter) {
        super('Rate limit exceeded', 429, 'RATE_LIMITED', true, { retryAfter });
    }
}
exports.RateLimitError = RateLimitError;
/** 503 — Upstream service unavailable (circuit breaker open) */
class ServiceUnavailableError extends AppError {
    constructor(service) {
        super(`Service ${service} is temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE', true);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/** 500 — Unexpected internal failure */
class InternalError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, 'INTERNAL_ERROR', false);
    }
}
exports.InternalError = InternalError;
//# sourceMappingURL=errors.js.map