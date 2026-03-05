/**
 * Custom error hierarchy for structured error handling across services.
 * All errors extend AppError which includes HTTP status codes and
 * machine-readable error codes for API consumers.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    readonly details?: Record<string, unknown>;
    constructor(message: string, statusCode: number, code: string, isOperational?: boolean, details?: Record<string, unknown>);
}
/** 400 — Client sent malformed or invalid request data */
export declare class BadRequestError extends AppError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/** 401 — Missing or invalid authentication credentials */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/** 403 — Authenticated but insufficient permissions */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/** 404 — Requested resource does not exist */
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
/** 409 — Conflicting state (e.g., duplicate email registration) */
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
/** 422 — Request syntactically valid but semantically incorrect */
export declare class ValidationError extends AppError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/** 429 — Rate limit exceeded */
export declare class RateLimitError extends AppError {
    constructor(retryAfter: number);
}
/** 503 — Upstream service unavailable (circuit breaker open) */
export declare class ServiceUnavailableError extends AppError {
    constructor(service: string);
}
/** 500 — Unexpected internal failure */
export declare class InternalError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map