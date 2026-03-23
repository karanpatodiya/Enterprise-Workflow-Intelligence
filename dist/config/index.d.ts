export interface Config {
    port: number;
    nodeEnv: 'development' | 'production' | 'test';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    database: {
        url: string;
        poolMin: number;
        poolMax: number;
    };
    auth: {
        jwtSecret: string;
        jwtExpiry: string;
        bcryptRounds: number;
    };
    llm: {
        provider: 'openai' | 'anthropic' | 'azure' | 'gemini';
        openai?: {
            apiKey: string;
            model: string;
            embeddingModel: string;
        };
    };
    vectorStore: {
        provider: 'pinecone' | 'weaviate' | 'milvus';
        pinecone?: {
            apiKey: string;
            indexName: string;
            environment: string;
        };
    };
    rag: {
        chunkSize: number;
        chunkOverlap: number;
        topKResults: number;
        confidenceThreshold: number;
    };
    skillScoring: {
        version: string;
        promotionReadinessWeights: Record<string, number>;
    };
    documents: {
        maxFileSize: number;
        supportedFileTypes: string[];
    };
    compliance: {
        enableAuditLogging: boolean;
        auditLogRetentionDays: number;
    };
    features: {
        enableIncidentSimulations: boolean;
        enableAnalyticsCache: boolean;
        analyticsCacheTTL: number;
    };
}
export declare const config: Config;
export default config;
//# sourceMappingURL=index.d.ts.map