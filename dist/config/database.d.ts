import { PoolClient } from 'pg';
export interface Database {
    query: (text: string, params?: any[]) => Promise<any>;
    getClient: () => Promise<PoolClient>;
    close: () => Promise<void>;
}
declare class PostgresDatabase implements Database {
    private pool;
    constructor();
    query(text: string, params?: any[]): Promise<any>;
    getClient(): Promise<PoolClient>;
    close(): Promise<void>;
    healthCheck(): Promise<boolean>;
}
export declare const db: PostgresDatabase;
export {};
//# sourceMappingURL=database.d.ts.map