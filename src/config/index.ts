import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  // Server
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  // Database
  database: {
    url: string;
    poolMin: number;
    poolMax: number;
  };

  // Authentication & Multi-tenancy
  auth: {
    jwtSecret: string;
    jwtExpiry: string;
    bcryptRounds: number;
  };

  // LLM Provider
  llm: {
    provider: 'openai' | 'anthropic' | 'azure' | 'gemini';
    openai?: {
      apiKey: string;
      model: string;
      embeddingModel: string;
    };
  };

  // Vector Store
  vectorStore: {
    provider: 'pinecone' | 'weaviate' | 'milvus';
    pinecone?: {
      apiKey: string;
      indexName: string;
      environment: string;
    };
  };

  // RAG Configuration
  rag: {
    chunkSize: number;
    chunkOverlap: number;
    topKResults: number;
    confidenceThreshold: number;
  };

  // Skill Scoring
  skillScoring: {
    version: string;
    promotionReadinessWeights: Record<string, number>;
  };

  // Document Processing
  documents: {
    maxFileSize: number;
    supportedFileTypes: string[];
  };

  // Compliance
  compliance: {
    enableAuditLogging: boolean;
    auditLogRetentionDays: number;
  };

  // Feature Flags
  features: {
    enableIncidentSimulations: boolean;
    enableAnalyticsCache: boolean;
    analyticsCacheTTL: number;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: (process.env.NODE_ENV as any) || 'development',
  logLevel: (process.env.LOG_LEVEL as any) || 'debug',

  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://workforce:securepassword@localhost:5432/workforce_intelligence',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },

  llm: {
    provider: (process.env.LLM_PROVIDER as any) || 'gemini',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      embeddingModel:
        process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
    },
  },

  vectorStore: {
    provider: (process.env.VECTOR_STORE_PROVIDER as any) || 'pinecone',
    pinecone: {
      apiKey: process.env.PINECONE_API_KEY || '',
      indexName:
        process.env.PINECONE_INDEX_NAME || 'workforce-intelligence',
      environment:
        process.env.PINECONE_ENVIRONMENT || 'production',
    },
  },

  rag: {
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '512', 10),
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '50', 10),
    topKResults: parseInt(process.env.RAG_TOP_K_RESULTS || '5', 10),
    confidenceThreshold: parseFloat(
      process.env.RAG_CONFIDENCE_THRESHOLD || '0.7'
    ),
  },

  skillScoring: {
    version: process.env.SKILL_SCORING_VERSION || '1.0',
    promotionReadinessWeights: process.env.PROMOTION_READINESS_WEIGHTS
      ? JSON.parse(process.env.PROMOTION_READINESS_WEIGHTS)
      : {
          technical: 0.4,
          leadership: 0.3,
          communication: 0.2,
          strategic: 0.1,
        },
  },

  documents: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
    supportedFileTypes: (
      process.env.SUPPORTED_FILE_TYPES || 'pdf,docx,md'
    ).split(','),
  },

  compliance: {
    enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false',
    auditLogRetentionDays: parseInt(
      process.env.AUDIT_LOG_RETENTION_DAYS || '365',
      10
    ),
  },

  features: {
    enableIncidentSimulations:
      process.env.ENABLE_INCIDENT_SIMULATIONS !== 'false',
    enableAnalyticsCache:
      process.env.ENABLE_ANALYTICS_CACHE !== 'false',
    analyticsCacheTTL: parseInt(
      process.env.ANALYTICS_CACHE_TTL_SECONDS || '3600',
      10
    ),
  },
};

export default config;
