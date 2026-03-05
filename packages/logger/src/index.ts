/**
 * @auralux/logger
 * Centralized structured logging with Winston.
 * Outputs JSON in production for log aggregation (ELK/Datadog/CloudWatch).
 * Pretty prints in development for readability.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export interface LoggerOptions {
  serviceName?: string;
  service?: string;
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
export function createLogger(options: LoggerOptions): winston.Logger {
  const {
    serviceName = options.service,
    level = process.env.LOG_LEVEL || 'info',
    enableConsole = true,
    enableFile = process.env.NODE_ENV === 'production',
    logDir = 'logs',
  } = options;

  /** Custom format: inject service name + timestamp into every log entry */
  const baseFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format((info) => {
      info.service = serviceName;
      return info;
    })()
  );

  const transports: winston.transport[] = [];

  if (enableConsole) {
    const isProduction = process.env.NODE_ENV === 'production';
    transports.push(
      new winston.transports.Console({
        format: isProduction
          ? winston.format.combine(baseFormat, winston.format.json())
          : winston.format.combine(
              baseFormat,
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                const metaStr = Object.keys(meta).length
                  ? `\n${JSON.stringify(meta, null, 2)}`
                  : '';
                return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
              })
            ),
      })
    );
  }

  if (enableFile) {
    /** Application logs — rotated daily, 14-day retention */
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: `${serviceName}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m',
        maxFiles: '14d',
        format: winston.format.combine(baseFormat, winston.format.json()),
      })
    );

    /** Error logs — separate file for quick triage */
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: `${serviceName}-error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '50m',
        maxFiles: '30d',
        format: winston.format.combine(baseFormat, winston.format.json()),
      })
    );
  }

  return winston.createLogger({
    level,
    transports,
    /** Don't crash the process on logging errors */
    exitOnError: false,
  });
}

export default createLogger;
