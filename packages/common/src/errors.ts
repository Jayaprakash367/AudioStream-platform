/**
 * Custom error hierarchy for structured error handling across services.
 * All errors extend AppError which includes HTTP status codes and
 * machine-readable error codes for API consumers.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 — Client sent malformed or invalid request data */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: Record<string, unknown>) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}

/** 401 — Missing or invalid authentication credentials */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

/** 403 — Authenticated but insufficient permissions */
export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN', true);
  }
}

/** 404 — Requested resource does not exist */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

/** 409 — Conflicting state (e.g., duplicate email registration) */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT', true);
  }
}

/** 422 — Request syntactically valid but semantically incorrect */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: Record<string, unknown>) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}

/** 429 — Rate limit exceeded */
export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMITED', true, { retryAfter });
  }
}

/** 503 — Upstream service unavailable (circuit breaker open) */
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`Service ${service} is temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE', true);
  }
}

/** 500 — Unexpected internal failure */
export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR', false);
  }
}
