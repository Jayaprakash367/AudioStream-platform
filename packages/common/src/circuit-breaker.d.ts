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
export interface CircuitBreakerOptions {
    /** Name of the downstream service (for logging/metrics) */
    name: string;
    /** Number of consecutive failures before opening the circuit */
    failureThreshold: number;
    /** Time in ms to wait before transitioning from OPEN → HALF_OPEN */
    resetTimeout: number;
    /** Number of successful requests in HALF_OPEN to close the circuit */
    successThreshold: number;
    /** Optional callback on state change */
    onStateChange?: (name: string, from: string, to: string) => void;
}
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private readonly options;
    constructor(options: CircuitBreakerOptions);
    /**
     * Execute a function through the circuit breaker.
     * If the circuit is OPEN, the call is immediately rejected.
     * Failures and successes are tracked to transition between states.
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private transitionTo;
    /** Get current circuit state (for metrics/monitoring) */
    getState(): CircuitState;
    /** Get current failure count */
    getFailureCount(): number;
}
export {};
//# sourceMappingURL=circuit-breaker.d.ts.map