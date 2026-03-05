/**
 * @auralux/logger
 * Centralized structured logging with Winston.
 * Outputs JSON in production for log aggregation (ELK/Datadog/CloudWatch).
 * Pretty prints in development for readability.
 */
import winston from 'winston';
export interface LoggerOptions {
    serviceName: string;
    level?: string;
    enableConsole?: boolean;
    enableFile?: boolean;
    logDir?: string;
}
/**
 * Creates a structured Winston logger instance configured for the service.
 * Each microservice creates its own logger with its service name for easy
 * filtering in centralized log systems.
 */
export declare function createLogger(options: LoggerOptions): winston.Logger;
export default createLogger;
//# sourceMappingURL=index.d.ts.map