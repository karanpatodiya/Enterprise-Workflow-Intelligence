"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const index_1 = require("./index");
class Logger {
    constructor() {
        this.context = {};
        this.logger = winston_1.default.createLogger({
            level: index_1.config.logLevel,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json()),
            defaultMeta: { service: 'workforce-intelligence' },
            transports: [
                new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
            ],
        });
        if (index_1.config.nodeEnv !== 'production') {
            this.logger.add(new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf((info) => {
                    const meta = this.context;
                    return `${info.timestamp} [${info.level}] ${info.message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                })),
            }));
        }
    }
    setContext(context) {
        this.context = context;
    }
    clearContext() {
        this.context = {};
    }
    debug(message, meta) {
        this.logger.debug(message, { ...this.context, ...meta });
    }
    info(message, meta) {
        this.logger.info(message, { ...this.context, ...meta });
    }
    warn(message, meta) {
        this.logger.warn(message, { ...this.context, ...meta });
    }
    error(message, error) {
        const meta = error instanceof Error ? { error: error.message, stack: error.stack } : error || {};
        this.logger.error(message, { ...this.context, ...meta });
    }
    auditLog(action, resource, changes) {
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
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map