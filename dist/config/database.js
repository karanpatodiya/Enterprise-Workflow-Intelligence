"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
const index_1 = require("./index");
const logger_1 = require("./logger");
class PostgresDatabase {
    constructor() {
        this.pool = new pg_1.Pool({
            connectionString: index_1.config.database.url,
            min: index_1.config.database.poolMin,
            max: index_1.config.database.poolMax,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        this.pool.on('error', (err) => {
            logger_1.logger.error('Unexpected error on idle client', err);
        });
    }
    async query(text, params) {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            if (duration > 1000) {
                logger_1.logger.warn('Slow query detected', { query: text.substring(0, 100), duration });
            }
            return result;
        }
        catch (err) {
            logger_1.logger.error('Database query failed', err);
            throw err;
        }
    }
    async getClient() {
        return this.pool.connect();
    }
    async close() {
        await this.pool.end();
        logger_1.logger.info('Database connection pool closed');
    }
    async healthCheck() {
        try {
            await this.pool.query('SELECT NOW()');
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.db = new PostgresDatabase();
//# sourceMappingURL=database.js.map