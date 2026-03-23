import winston from 'winston';
import { config } from './index';

export interface LogContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private logger: winston.Logger;
  private context: LogContext = {};

  constructor() {
    this.logger = winston.createLogger({
      level: config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: { service: 'workforce-intelligence' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });

    if (config.nodeEnv !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf((info) => {
              const meta = this.context;
              return `${info.timestamp} [${info.level}] ${info.message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ''
              }`;
            })
          ),
        })
      );
    }
  }

  setContext(context: LogContext): void {
    this.context = context;
  }

  clearContext(): void {
    this.context = {};
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, { ...this.context, ...meta });
  }

  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, { ...this.context, ...meta });
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, { ...this.context, ...meta });
  }

  error(message: string, error?: Error | Record<string, any>): void {
    const meta = error instanceof Error ? { error: error.message, stack: error.stack } : error || {};
    this.logger.error(message, { ...this.context, ...meta });
  }

  auditLog(action: string, resource: string, changes: Record<string, any>): void {
    this.logger.info(`AUDIT: ${action} on ${resource}`, {
      ...this.context,
      audit: true,
      action,
      resource,
      changes,
      timestamp: new Date().toISOString(),
    });
  }
}

export const logger = new Logger();
