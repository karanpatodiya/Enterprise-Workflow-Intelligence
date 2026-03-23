export interface LogContext {
    tenantId?: string;
    userId?: string;
    requestId?: string;
    [key: string]: any;
}
declare class Logger {
    private logger;
    private context;
    constructor();
    setContext(context: LogContext): void;
    clearContext(): void;
    debug(message: string, meta?: Record<string, any>): void;
    info(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    error(message: string, error?: Error | Record<string, any>): void;
    auditLog(action: string, resource: string, changes: Record<string, any>): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map