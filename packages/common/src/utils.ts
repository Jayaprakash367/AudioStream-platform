/**
 * General utility functions used across all services.
 */

import { v4 as uuidv4 } from 'uuid';

/** Generate a unique correlation ID for distributed tracing */
export function generateCorrelationId(): string {
  return uuidv4();
}

/** Generate a unique event ID for Kafka event deduplication */
export function generateEventId(): string {
  return `evt_${uuidv4().replace(/-/g, '')}`;
}

/** Sleep utility for retry backoff */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry wrapper.
 * Retries a function up to `maxRetries` times with exponential delay.
 * Used for transient failures in DB connections, HTTP calls, etc.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, onRetry } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) break;

      const jitter = Math.random() * 200;
      const delay = Math.min(baseDelay * Math.pow(2, attempt) + jitter, maxDelay);

      onRetry?.(attempt + 1, lastError);
      await sleep(delay);
    }
  }

  throw lastError;
}

/** Sanitize user input by stripping control characters */
export function sanitizeString(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/** Build pagination response metadata */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/** Mask sensitive data for logging (e.g., email, tokens) */
export function maskSensitive(value: string, visibleChars = 3): string {
  if (value.length <= visibleChars) return '***';
  return value.substring(0, visibleChars) + '***' + value.substring(value.length - 2);
}

/** Convert duration in seconds to human-readable format */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Deep freeze an object to make it immutable */
export function deepFreeze<T extends Record<string, unknown>>(obj: T): Readonly<T> {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as Record<string, unknown>);
    }
  });
  return obj;
}
