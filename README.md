# Enterprise Workforce Intelligence

A production-grade, multi-tenant B2B SaaS backend system for enterprise workforce intelligence, skill diagnosis, and promotion readiness analysis powered by RAG-grounded AI.

## System Overview

This platform provides closed-loop workforce intelligence through:

1. **Multi-Tenant Architecture** - Complete data isolation and role-based access control
2. **RAG-Grounded Intelligence** - Company-specific knowledge integration with LLM
3. **Skill Assessment Engine** - Scenario-based assessments with AI-assisted evaluation
4. **Skill Intelligence Engine** - Algorithmic skill gap analysis and risk scoring
5. **Executive Analytics** - Real-time team readiness, risk clusters, and promotion pipeline insights
6. **Security & Compliance** - Built-in audit logging, permission checks, and row-level security

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer Endpoints                     │
│  /api/assessments  /api/skills  /api/analytics  /api/rag    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│            Middleware Layer                                 │
│  • Tenant Resolution & Isolation                            │
│  • Authentication (JWT)                                     │
│  • Role-Based Access Control (RBAC)                         │
│  • Row-Level Security Enforcement                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│            Service Layer (Business Logic)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Assessment Engine Service                              │ │
│  │ • Assessment initialization                            │ │
│  │ • Answer submission & scoring                          │ │
│  │ • Objective/Rubric/AI-assisted evaluation              │ │
│  │ • AI feedback generation                               │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Skill Intelligence Service (Core)                      │ │
│  │ • Skill gap calculation                                │ │
│  │ • Promotion readiness analysis                         │ │
│  │ • Risk score computation                               │ │
│  │ • Skill profile aggregation                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Analytics Engine Service                               │ │
│  │ • Team readiness scoring                               │ │
│  │ • Department risk clustering                           │ │
│  │ • Promotion pipeline metrics                           │ │
│  │ • Executive recommendations generation                 │ │
│  │ • Analytics snapshot caching                           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Knowledge Ingestion Service                            │ │
│  │ • PDF/DOCX/Markdown extraction                         │ │
│  │ • Semantic chunking                                    │ │
│  │ • Embedding generation                                 │ │
│  │ • Vector store indexing                                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Audit Service                                          │ │
│  │ • Action logging                                       │ │
│  │ • Audit history retrieval                              │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│           Integration Layer (Abstractions)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ RAG Orchestration Service                              │ │
│  │ • Query -> Embedding conversion                        │ │
│  │ • Vector similarity search with filtering              │ │
│  │ • Context ranking & selection                          │ │
│  │ • Prompt engineering & LLM invocation                  │ │
│  │ • Confidence scoring                                   │ │
│  │ • Hallucination mitigation                             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ LLM Provider (Pluggable)                               │ │
│  │ • OpenAI (GPT-4, embeddings)                           │ │
│  │ • Anthropic Claude                                     │ │
│  │ • Azure OpenAI                                         │ │
│  │ • Structured output support                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Vector Store (Pluggable)                               │ │
│  │ • Pinecone (cloud)                                     │ │
│  │ • Weaviate (self-hosted)                               │ │
│  │ • Milvus (self-hosted)                                 │ │
│  │ • Metadata filtering                                   │ │
│  │ • Tenant-aware isolation                               │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│           Repository Layer (Data Access)                    │
│  • TenantRepository                                         │
│  • EmployeeRepository                                       │
│  • AssessmentResultRepository                               │
│  • KnowledgeDocumentRepository                              │
│  • All queries enforce tenant isolation                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│            Data Layer (PostgreSQL)                          │
│  • Relational data with JSONB for complex structures        │
│  • Comprehensive audit logging                              │
│  • Analytics snapshot caching                               │
│  • Row-level security ready                                 │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
enterprise-workforce-intelligence/
├── src/
│   ├── app.ts                           # Express app entry point
│   ├── config/
│   │   ├── index.ts                     # Configuration management
│   │   ├── logger.ts                    # Structured logging
│   │   └── database.ts                  # Database connection pool
│   ├── domain/
│   │   └── index.ts                     # All TypeScript interfaces & types
│   ├── repositories/
│   │   ├── tenant.repository.ts         # Tenant data access
│   │   ├── employee.repository.ts       # Employee data access
│   │   ├── assessment-result.repository.ts
│   │   └── knowledge-document.repository.ts
│   ├── services/
│   │   ├── assessment-engine.service.ts # Assessment execution & scoring
│   │   ├── skill-intelligence.service.ts # Core skill scoring logic
│   │   ├── analytics-engine.service.ts  # Analytics aggregation
│   │   ├── knowledge-ingestion.service.ts # Document processing
│   │   └── audit.service.ts             # Audit logging
│   ├── integration/
│   │   ├── vector-store.ts              # Vector store abstraction
│   │   ├── llm-provider.ts              # LLM provider abstraction
│   │   └── rag-orchestration.ts         # RAG coordination
│   ├── api/
│   │   ├── assessment.routes.ts         # Assessment endpoints
│   │   ├── skills.routes.ts             # Skill endpoints
│   │   ├── analytics.routes.ts          # Analytics endpoints
│   │   └── rag.routes.ts                # RAG endpoints
│   ├── middleware/
│   │   └── auth.middleware.ts           # Auth, tenant, RBAC middleware
│   └── tests/
│       ├── skill-intelligence.service.test.ts
│       ├── assessment-engine.service.test.ts
│       └── rag-orchestration.test.ts
├── database/
│   ├── schema/
│   │   └── 001_initial_schema.sql       # Complete database schema
│   └── migrations/                       # Future migrations
├── docker/
│   ├── Dockerfile                        # Production Docker image
│   ├── docker-compose.yml                # Multi-container setup
│   └── .dockerignore
├── .env.example                          # Configuration template
├── package.json
├── tsconfig.json
└── README.md
```

## Core Domains

### 1. Multi-Tenancy

- **Complete Data Isolation**: Every query is tenant-filtered
- **Tenant Middleware**: Automatic tenant extraction from JWT
- **Row-Level Security**: All database queries enforce tenant boundaries
- **Secure Document Segregation**: Knowledge documents tagged with tenant_id

### 2. Knowledge Ingestion Pipeline

Accepts PDF, DOCX, and Markdown documents with:

```typescript
DocumentMetadata {
  company_id: string;
  department?: string;
  role_level?: RoleLevel;
  document_type: DocumentType;
  version: number;
  tags?: string[];
  relevant_skill_ids?: string[];
}
```

**Processing Steps:**
1. Extract content from source file (PDF/DOCX/MD)
2. Semantic chunking (512 token chunks with 50 token overlap)
3. Generate embeddings for each chunk (OpenAI text-embedding-3-large)
4. Store in vector database with metadata filtering
5. Support document versioning and re-indexing

### 3. RAG Orchestration

Grounded intelligence through:

- **Hybrid Retrieval**: Semantic search with BM25 fallback
- **Metadata Filtering**: Filter by department, role level, document type
- **Confidence Scoring**: 0-1 score based on relevance and coverage
- **Hallucination Mitigation**: Require source grounding, acknowledge gaps
- **Context Types**:
  - `promotion_analysis`: Role requirements and development paths
  - `incident_simulation`: Procedures and best practices
  - `skill_explanation`: Competency frameworks
  - `general_knowledge`: Company knowledge

### 4. Assessment Engine

**Scoring Methods:**
- **Objective**: Multiple choice with correct answers
- **Rubric-Based**: Human/AI evaluation against criteria
- **AI-Assisted**: LLM-powered open-ended answer evaluation

**Tracking:**
- Completion time
- Retry attempts
- Error types
- Solution efficiency
- AI-generated feedback

### 5. Skill Intelligence Engine (Core Business Logic)

**Inputs:**
- Employee skill assessments
- Role competency requirements
- Experience level
- Assessment recency

**Outputs:**
```typescript
SkillDelta {
  skillId: string;
  currentProficiencyLevel: 1-5;
  requiredProficiencyLevel: 1-5;
  gapDays: number;          // Estimated closure time
  assessmentEvidenceCount: number;
  lastAssessmentDate: Date;
}

PromotionReadinessAnalysis {
  readinessScore: 0-100;
  readinessCategory: 'not-ready' | 'developing' | 'ready' | 'ready-plus';
  skillGaps: SkillDelta[];
  strengths: SkillStrength[];
  developmentAreas: DevelopmentArea[];
  timelineToReadiness: number;  // Days
  recommendations: string[];
}

SkillRisk {
  riskScore: 0-100;
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  atRiskSkills: AtRiskSkill[];  // No assessment in 12+ months
  concentrationRisk: 0-1;       // Skill distribution
}
```

**Scoring Algorithm:**
- Weighted combination of:
  - Assessment score (40%)
  - Years of experience (20%)
  - Assessment recency (25%)
  - Assessment frequency (10%)
  - Role relevance (5%)

### 6. Executive Analytics Engine

**Aggregations:**
```typescript
TeamReadinessScore {
  departmentId, departmentName, teamSize
  averageReadinessScore: 0-100
  readyCount, developingCount, notReadyCount
  readinessPercentage: 0-100
  trend: 'improving' | 'stable' | 'declining'
}

DepartmentRiskCluster {
  departmentId, departmentName
  criticalRiskEmployeeCount, highRiskEmployeeCount
  clusterScore: 0-100
  topAtriskSkills: SkillRiskSummary[]
  concernFlag: boolean  // Highlights for executives
}

PromotionPipelineMetrics {
  totalEmployees, readyForPromotion, developingForPromotion
  promotionVelocity: number  // Promotions/month
  averageTimeToReadiness: number  // Days
  bottleneckSkills: SkillBottleneck[]
  forecastedReadyNextQuarter: number
}

AnalyticsSnapshot {
  aggregateReadinessScore: 0-100
  aggregateRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  executiveRecommendations: string[]
  // All cached with TTL for performance
}
```

### 7. Security & Compliance

**Authentication:**
- JWT tokens with configurable expiry
- Token payload includes tenant_id, role, permissions

**Authorization:**
- RBAC with granular permissions
- Department-scoped access for managers
- Role-based endpoint access

**Permissions:**
```typescript
'read:employees'       // View employee data
'write:employees'      // Modify employee data
'read:skills'          // View skill definitions
'write:skills'         // Create/modify skills
'read:assessments'     // View assessment results
'write:assessments'    // Create assessments
'read:analytics'       // View analytics
'write:documents'      // Upload documents
'read:documents'       // View documents
'execute:rag-queries'  // Run RAG queries
'manage:roles'         // Manage permissions
```

**Audit Logging:**
- All critical actions logged (ingestion, scoring, analytics, RAG queries)
- retention configurable (default 365 days)
- Log stored IP, user agent, execution time, status

## API Endpoints

### Assessment Endpoints

```bash
POST   /api/assessments/:assessmentId/start
       Start a new assessment for employee

POST   /api/assessments/:resultId/submit
       Submit answers and get scoring

GET    /api/employees/:employeeId/assessments
       List all assessment results for employee

GET    /api/assessments/:resultId
       Get assessment detail and feedback
```

### Skill Endpoints

```bash
GET    /api/employees/:employeeId/promotion-readiness/:roleLevel
       Analyze promotion readiness for target role

GET    /api/employees/:employeeId/skill-risk
       Calculate skill risk score

GET    /api/employees/:employeeId/skills
       Get employee skill profile
```

### Analytics Endpoints

```bash
GET    /api/analytics/snapshot
       Complete analytics snapshot (cached)

GET    /api/analytics/team-readiness
       Team readiness scores by department

GET    /api/analytics/department-risks
       Department risk clusters

GET    /api/analytics/promotion-pipeline
       Promotion pipeline metrics
```

### RAG Endpoints

```bash
POST   /api/rag/query
       Execute RAG query with custom context
       Body: { employeeId, query, contextType, filters? }

POST   /api/rag/promotion-analysis/:employeeId
       Generate promotion analysis grounded in company docs

POST   /api/rag/incident-simulation/:skillId
       Generate incident guidance grounded in procedures
```

## Setup & Deployment

### Local Development

```bash
# 1. Clone and install
git clone <repo>
cd enterprise-workforce-intelligence
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start PostgreSQL (Docker)
docker run -d \
  --name postgres \
  -e POSTGRES_DB=workforce_intelligence \
  -e POSTGRES_USER=workforce \
  -e POSTGRES_PASSWORD=securepassword \
  -p 5432:5432 \
  postgres:15-alpine

# 4. Initialize database
psql -h localhost -U workforce -d workforce_intelligence < database/schema/001_initial_schema.sql

# 5. Build and run
npm run build
npm run dev
```

### Docker Deployment

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with production settings

# 2. Build and start stack
docker-compose -f docker/docker-compose.yml up -d

# 3. Check health
curl http://localhost:3000/health

# 4. View logs
docker-compose -f docker/docker-compose.yml logs -f app
```

### Production Considerations

1. **SSL/TLS**: Add reverse proxy (nginx/CloudFlare)
2. **Rate Limiting**: Implement per-tenant throttling
3. **Monitoring**: Set up Prometheus + Grafana
4. **Backups**: Regular PostgreSQL snapshots
5. **Scaling**: Horizontal scaling via load balancer
6. **LLM Cost Control**: Monitor API usage and set quotas

## Configuration

Key environment variables (see `.env.example` for complete list):

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db
DATABASE_POOL_MAX=10

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# LLM
LLM_PROVIDER=openai               # openai | anthropic | azure
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_EMBEDDING_MODEL=text-embedding-3-large

# Vector Store
VECTOR_STORE_PROVIDER=pinecone    # pinecone | weaviate | milvus
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=workforce-intelligence

# RAG
RAG_CHUNK_SIZE=512
RAG_TOP_K_RESULTS=5
RAG_CONFIDENCE_THRESHOLD=0.7

# Analytics
ENABLE_ANALYTICS_CACHE=true
ANALYTICS_CACHE_TTL_SECONDS=3600

# Compliance
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_RETENTION_DAYS=365
```

## Testing (Stubs Provided)

```bash
# Run test suite
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

Test files included for:
- Skill Intelligence Service
- Assessment Engine Service
- RAG Orchestration Service
- (Additional mocking patterns can be implemented)

## Extensibility

### Adding a New LLM Provider

```typescript
// src/integration/llm-provider.ts
class CustomProvider implements LLMProvider {
  name = 'custom';
  async generateEmbedding(text: string): Promise<number[]> { ... }
  async chat(messages: ChatMessage[]): Promise<string> { ... }
  async structuredOutput(prompt: string, schema: any): Promise<Record<string, any>> { ... }
}

// Update factory
LLMFactory.create('custom')
```

### Adding a New Vector Store

```typescript
// src/integration/vector-store.ts
class CustomVectorStore implements VectorStoreProvider {
  name = 'custom';
  async initialize(): Promise<void> { ... }
  async upsertEmbeddings(request: UpsertEmbeddingsRequest): Promise<void> { ... }
  async query(request: QueryRequest): Promise<QueryResult[]> { ... }
  // ... other methods
}

// Update factory
VectorStoreFactory.create('custom')
```

### Adding a New Assessment Scoring Method

```typescript
// src/services/assessment-engine.service.ts
private async scoreCustomMethod(answers, assessment, maxScore) {
  // Implement scoring logic
}

// Add case in scoreAnswers() switch
```

## Monitoring & Observability

- **Structured logging** with Winston (JSON format)
- **Health endpoint** at `/health` for load balancers
- **Audit logs** stored for compliance
- **Slow query warnings** logged automatically
- **Request/response timing** tracked per endpoint

## Data Retention

- Assessment results: Indefinite
- Audit logs:365 days (configurable)
- Analytics snapshots: 30 days (older replaced)
- Knowledge documents: Indefinite

## Performance Considerations

- **Vector search**: ~100ms for top-5 results
- **Assessment scoring**: <500ms for AI-assisted
- **Promotion analysis**: <1s including RAG
- **Analytics snapshot generation**: <2s first run, <100ms cached
- **Database query timeouts**: 30 seconds
- **LLM call timeouts**: 30 seconds

## License

Proprietary - Enterprise Workforce Intelligence Platform

## Support & Documentation

For detailed API documentation, see individual route files.
For domain model documentation, see `src/domain/index.ts`.
For configuration options, see `.env.example`.

---

**Built for Enterprise. Audited for Compliance. Scaled for Growth.**
=======
# 🚀 Enterprise Workflow Intelligence

Enterprise Workflow Intelligence is a modern skill evaluation and workforce analysis platform designed to assess capabilities, identify gaps, and guide users through structured learning paths.

The system enables intelligent evaluation of users across different roles and domains, providing actionable insights and continuous improvement workflows.

---

## ✨ Key Features

- 🔍 **Dynamic Skill Evaluation**
  - Role-based assessments
  - Multiple question formats (MCQ, scenario-based, problem-solving)

- 📊 **Skill Gap Analysis**
  - Detailed breakdown of strengths and weaknesses
  - Skill-level insights across domains

- 🧭 **Personalized Learning Paths**
  - Structured roadmap based on weak areas
  - Learning resources and practical tasks

- 🧠 **Deep Evaluation System**
  - Real-world scenario questions
  - Analytical and reasoning-based assessment

- 🛡 **Integrity Monitoring**
  - Behavior-based detection (copy/paste, response patterns)
  - Ensures fair evaluation process

- 🗂 **User & Progress Tracking**
  - Stores user profiles and assessment history
  - Tracks improvement over time

---

## 🏗 Tech Stack

- **Frontend:** React.js  
- **Backend:** Node.js / Express  
- **Database:** PostgreSQL  
- **Intelligence Layer:** Gemini API  

---

## 🔄 System Workflow

```text
User Profile
→ Skill Baseline
→ Deep Evaluation
→ Gap Analysis
→ Learning Path Generation
→ Mastery Stage
→ Final Report
