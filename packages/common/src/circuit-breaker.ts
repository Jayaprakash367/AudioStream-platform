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

import { ServiceUnavailableError } from './errors';

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

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      onStateChange: () => {},
      ...options,
    };
  }

  /**
   * Execute a function through the circuit breaker.
   * If the circuit is OPEN, the call is immediately rejected.
   * Failures and successes are tracked to transition between states.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if reset timeout has elapsed → transition to HALF_OPEN
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new ServiceUnavailableError(this.options.name);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
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

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN immediately reopens
      this.transitionTo('OPEN');
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  private transitionTo(newState: CircuitState): void {
    const prevState = this.state;
    this.state = newState;

    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0;
    }

    this.options.onStateChange(this.options.name, prevState, newState);
  }

  /** Get current circuit state (for metrics/monitoring) */
  getState(): CircuitState {
    return this.state;
  }

  /** Get current failure count */
  getFailureCount(): number {
    return this.failureCount;
  }
}
