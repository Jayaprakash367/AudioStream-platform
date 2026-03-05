"use strict";
/**
 * Circuit Breaker implementation for resilient inter-service communication.
 * Prevents cascading failures by short-circuiting requests to unhealthy
 * downstream services, allowing them time to recover.
 *
 * States:
 *  CLOSED   → Normal operation, requests pass through
 *  OPEN     → Failures exceeded threshold, requests are immediately rejected
 *  HALF_OPEN → Testing if downstream has recovered
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
const errors_1 = require("./errors");
class CircuitBreaker {
    state = 'CLOSED';
    failureCount = 0;
    successCount = 0;
    lastFailureTime = null;
    options;
    constructor(options) {
        this.options = {
            onStateChange: () => { },
            ...options,
        };
    }
    /**
     * Execute a function through the circuit breaker.
     * If the circuit is OPEN, the call is immediately rejected.
     * Failures and successes are tracked to transition between states.
     */
    async execute(fn) {
        if (this.state === 'OPEN') {
            // Check if reset timeout has elapsed → transition to HALF_OPEN
            if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
                this.transitionTo('HALF_OPEN');
            }
            else {
                throw new errors_1.ServiceUnavailableError(this.options.name);
            }
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= this.options.successThreshold) {
                this.transitionTo('CLOSED');
            }
        }
        // Reset failure count on success in CLOSED state
        if (this.state === 'CLOSED') {
            this.failureCount = 0;
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === 'HALF_OPEN') {
            // Any failure in HALF_OPEN immediately reopens
            this.transitionTo('OPEN');
        }
        else if (this.failureCount >= this.options.failureThreshold) {
            this.transitionTo('OPEN');
        }
    }
    transitionTo(newState) {
        const prevState = this.state;
        this.state = newState;
        if (newState === 'CLOSED') {
            this.failureCount = 0;
            this.successCount = 0;
        }
        else if (newState === 'HALF_OPEN') {
            this.successCount = 0;
        }
        this.options.onStateChange(this.options.name, prevState, newState);
    }
    /** Get current circuit state (for metrics/monitoring) */
    getState() {
        return this.state;
    }
    /** Get current failure count */
    getFailureCount() {
        return this.failureCount;
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=circuit-breaker.js.map