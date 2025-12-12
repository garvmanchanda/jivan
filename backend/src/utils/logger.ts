import winston from 'winston';
import { createHash } from 'crypto';

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

// Create logger format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  logFormat === 'json'
    ? winston.format.json()
    : winston.format.printf(
        ({ timestamp, level, message, ...meta }) =>
          `${timestamp} [${level.toUpperCase()}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`
      )
);

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: {
    service: 'jivan-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'development'
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          : customFormat,
    }),
  ],
});

// In production, add file transports
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * Hash PII for logging (one-way hash for correlation)
 */
export const hashPII = (data: string): string => {
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
};

/**
 * Create child logger with additional context
 */
export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

/**
 * Log with correlation ID
 */
export const logWithCorrelation = (
  correlationId: string,
  level: string,
  message: string,
  meta?: Record<string, any>
) => {
  logger.log(level, message, {
    correlationId,
    ...meta,
  });
};

export default logger;

