"use strict";
/**
 * General utility functions used across all services.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCorrelationId = generateCorrelationId;
exports.generateEventId = generateEventId;
exports.sleep = sleep;
exports.retryWithBackoff = retryWithBackoff;
exports.sanitizeString = sanitizeString;
exports.buildPaginationMeta = buildPaginationMeta;
exports.maskSensitive = maskSensitive;
exports.formatDuration = formatDuration;
exports.deepFreeze = deepFreeze;
const uuid_1 = require("uuid");
/** Generate a unique correlation ID for distributed tracing */
function generateCorrelationId() {
    return (0, uuid_1.v4)();
}
/** Generate a unique event ID for Kafka event deduplication */
function generateEventId() {
    return `evt_${(0, uuid_1.v4)().replace(/-/g, '')}`;
}
/** Sleep utility for retry backoff */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Exponential backoff retry wrapper.
 * Retries a function up to `maxRetries` times with exponential delay.
 * Used for transient failures in DB connections, HTTP calls, etc.
 */
async function retryWithBackoff(fn, options = {}) {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, onRetry } = options;
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt === maxRetries)
                break;
            const jitter = Math.random() * 200;
            const delay = Math.min(baseDelay * Math.pow(2, attempt) + jitter, maxDelay);
            onRetry?.(attempt + 1, lastError);
            await sleep(delay);
        }
    }
    throw lastError;
}
/** Sanitize user input by stripping control characters */
function sanitizeString(input) {
    // eslint-disable-next-line no-control-regex
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}
/** Build pagination response metadata */
function buildPaginationMeta(total, page, limit) {
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
function maskSensitive(value, visibleChars = 3) {
    if (value.length <= visibleChars)
        return '***';
    return value.substring(0, visibleChars) + '***' + value.substring(value.length - 2);
}
/** Convert duration in seconds to human-readable format */
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}
/** Deep freeze an object to make it immutable */
function deepFreeze(obj) {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
        const value = obj[prop];
        if (value && typeof value === 'object' && !Object.isFrozen(value)) {
            deepFreeze(value);
        }
    });
    return obj;
}
//# sourceMappingURL=utils.js.map