"use strict";
/**
 * @auralux/logger
 * Centralized structured logging with Winston.
 * Outputs JSON in production for log aggregation (ELK/Datadog/CloudWatch).
 * Pretty prints in development for readability.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
/**
 * Creates a structured Winston logger instance configured for the service.
 * Each microservice creates its own logger with its service name for easy
 * filtering in centralized log systems.
 */
function createLogger(options) {
    const { serviceName, level = process.env.LOG_LEVEL || 'info', enableConsole = true, enableFile = process.env.NODE_ENV === 'production', logDir = 'logs', } = options;
    /** Custom format: inject service name + timestamp into every log entry */
    const baseFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format((info) => {
        info.service = serviceName;
        return info;
    })());
    const transports = [];
    if (enableConsole) {
        const isProduction = process.env.NODE_ENV === 'production';
        transports.push(new winston_1.default.transports.Console({
            format: isProduction
                ? winston_1.default.format.combine(baseFormat, winston_1.default.format.json())
                : winston_1.default.format.combine(baseFormat, winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, service, ...meta }) => {
                    const metaStr = Object.keys(meta).length
                        ? `\n${JSON.stringify(meta, null, 2)}`
                        : '';
                    return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
                })),
        }));
    }
    if (enableFile) {
        /** Application logs — rotated daily, 14-day retention */
        transports.push(new winston_daily_rotate_file_1.default({
            dirname: logDir,
            filename: `${serviceName}-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: '50m',
            maxFiles: '14d',
            format: winston_1.default.format.combine(baseFormat, winston_1.default.format.json()),
        }));
        /** Error logs — separate file for quick triage */
        transports.push(new winston_daily_rotate_file_1.default({
            dirname: logDir,
            filename: `${serviceName}-error-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '50m',
            maxFiles: '30d',
            format: winston_1.default.format.combine(baseFormat, winston_1.default.format.json()),
        }));
    }
    return winston_1.default.createLogger({
        level,
        transports,
        /** Don't crash the process on logging errors */
        exitOnError: false,
    });
}
exports.default = createLogger;
//# sourceMappingURL=index.js.map