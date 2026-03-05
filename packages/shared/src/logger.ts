import winston from 'winston';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = printf(({ level, message, timestamp, service, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n  ${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${service || 'auralux'}] ${level}: ${message}${metaStr}`;
});

export function createLogger(service: string) {
  const isDev = process.env.NODE_ENV !== 'production';

  return winston.createLogger({
    level: isDev ? 'debug' : 'info',
    defaultMeta: { service },
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      errors({ stack: true }),
      json()
    ),
    transports: [
      new winston.transports.Console({
        format: isDev
          ? combine(colorize(), timestamp({ format: 'HH:mm:ss.SSS' }), devFormat)
          : combine(json()),
      }),
    ],
  });
}

export type Logger = ReturnType<typeof createLogger>;
