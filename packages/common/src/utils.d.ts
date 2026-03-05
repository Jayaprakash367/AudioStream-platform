/**
 * General utility functions used across all services.
 */
/** Generate a unique correlation ID for distributed tracing */
export declare function generateCorrelationId(): string;
/** Generate a unique event ID for Kafka event deduplication */
export declare function generateEventId(): string;
/** Sleep utility for retry backoff */
export declare function sleep(ms: number): Promise<void>;
/**
 * Exponential backoff retry wrapper.
 * Retries a function up to `maxRetries` times with exponential delay.
 * Used for transient failures in DB connections, HTTP calls, etc.
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
}): Promise<T>;
/** Sanitize user input by stripping control characters */
export declare function sanitizeString(input: string): string;
/** Build pagination response metadata */
export declare function buildPaginationMeta(total: number, page: number, limit: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
/** Mask sensitive data for logging (e.g., email, tokens) */
export declare function maskSensitive(value: string, visibleChars?: number): string;
/** Convert duration in seconds to human-readable format */
export declare function formatDuration(seconds: number): string;
/** Deep freeze an object to make it immutable */
export declare function deepFreeze<T extends Record<string, unknown>>(obj: T): Readonly<T>;
//# sourceMappingURL=utils.d.ts.map