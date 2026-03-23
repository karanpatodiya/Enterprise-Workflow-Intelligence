# Quick Start Guide

## 5-Minute Local Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL client (psql) - optional

### Steps

#### 1. Clone & Install

```bash
cd enterprise-workforce-intelligence
npm install
```

#### 2. Start PostgreSQL

```bash
docker run -d \
  --name wfm-postgres \
  -e POSTGRES_DB=workforce_intelligence \
  -e POSTGRES_USER=workforce \
  -e POSTGRES_PASSWORD=securepassword \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 3. Initialize Database

```bash
npm install -g postgre  # if needed
psql -h localhost -U workforce -d workforce_intelligence \
  -f database/schema/001_initial_schema.sql
```

#### 4. Create .env File

```bash
cp .env.example .env
# Edit .env with:
# - OPENAI_API_KEY=sk-...
# - PINECONE_API_KEY=... (or leave empty for local development)
```

#### 5. Run Single-Port App (Recommended)

```bash
npm run setup:local
npm run start:single-port
```

UI + API run together at http://localhost:3000 (same port).

#### 6. Optional: Split Frontend/Backend Dev Mode

```bash
# terminal 1
npm run dev

# terminal 2
cd frontend
npm run dev
```

### Health Check

```bash
curl http://localhost:3000/health

# Response:
# {
#   "status": "healthy",
#   "timestamp": "2024-03-01T...",
#   "service": "workforce-intelligence"
# }
```

---

## Docker Compose (Recommended)

```bash
# Start everything with one command
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f app

# Stop everything
docker-compose -f docker/docker-compose.yml down
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/app.ts` | Express server entry point |
| `src/domain/index.ts` | All TypeScript types & interfaces |
| `src/services/*` | Business logic (read these first!) |
| `src/integration/*` | LLM & vector store abstractions |
| `src/api/*` | HTTP endpoints |
| `database/schema/001_initial_schema.sql` | Database schema |
| `.env.example` | Configuration template |
| `README.md` | Full documentation |

---

## Common Commands

```bash
# Development
npm run dev              # Watch mode

# Production
npm run build           # Compile TypeScript
npm start               # Run compiled app
npm run start:single-port  # Build frontend+backend and serve on :3000

# Testing
npm test                # Run tests
npm test -- --watch    # Watch mode

# Database
psql -h localhost -U workforce
```

---

## First Request Example

### 1. Get Auth Token

```bash
# Register or get JWT from your auth system
# For testing, create token with:
# {
#   userId: "user-123",
#   tenantId: "tenant-123",
#   email: "user@company.com",
#   role: "tenant-admin",
#   permissions: ["read:analytics", "execute:rag-queries"]
# }
```

### 2. Execute RAG Query

```bash
curl -X POST http://localhost:3000/api/rag/query \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp-123",
    "query": "What are the key competencies for a manager role?",
    "contextType": "promotion_analysis"
  }'
```

### 3. Get Analytics

```bash
curl http://localhost:3000/api/analytics/snapshot \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Environment Variables

See `.env.example` for all options. Key ones:

```bash
LLM_PROVIDER=openai              # Change to anthropic or azure
VECTOR_STORE_PROVIDER=pinecone   # Change to weaviate or milvus
RAG_CHUNK_SIZE=512               # Chunk size for document processing
RAG_TOP_K_RESULTS=5              # Number of documents to retrieve
LOG_LEVEL=debug                  # debug | info | warn | error
```

---

## Architecture Overview

```
Frontend
  ↓
Auth Middleware (JWT verification)
  ↓
Tenant Isolation (extract tenant_id)
  ↓
RBAC Middleware (check permissions)
  ↓
Business Logic Services
  ├─ Assessment Engine
  ├─ Skill Intelligence Engine
  ├─ RAG Orchestration
  ├─ Analytics Engine
  └─ ...
  ↓
Repositories (data access)
  ↓
PostgreSQL
Vector Store (Pinecone/Weaviate)
LLM API (OpenAI/Anthropic)
```

---

## Typical Workflow

### 1. Ingest Company Knowledge

```
Admin uploads: company_procedures.pdf
  ↓ Knowledge Ingestion Service
  - Extract text
  - Chunk semantically (512 tokens)
  - Generate embeddings
  - Store in vector DB
```

### 2. Employee Takes Assessment

```
Employee starts assessment
  ↓ Assessment Engine Service
  - Record start time
  - Present questions
  - Employee submits answers
  - Score answers (objective/rubric/AI)
  - Generate AI feedback
  - Save to database
```

### 3. Analyze Promotion Readiness

```
GET /api/skills/employees/:id/promotion-readiness/manager
  ↓ Skill Intelligence Service
  - Fetch employee skills
  - Fetch role requirements
  - Calculate gaps
  - Estimate timeline
  - Returns readiness_score, recommendations
```

### 4. Query Company Knowledge with RAG

```
POST /api/rag/query
{
  employeeId: "emp-123",
  query: "What's the procedure for handling customer disputes?",
  contextType: "incident_simulation"
}
  ↓ RAG Orchestration
  - Convert query → embedding
  - Search vector store
  - Filter by document type
  - Generate grounded answer from LLM
  - Return with citation
```

### 5. View Executive Dashboard

```
GET /api/analytics/snapshot
  ↓ Analytics Engine
  - Calculate team readiness (by department)
  - Identify risk clusters
  - Forecast promotion pipeline
  - Cache results
  - Return aggregated metrics
```

---

## Testing Integration Services

### Mock LLM (for development)

```typescript
// In your tests:
const mockLLM: LLMProvider = {
  name: 'mock',
  generateEmbedding: async (text) => new Array(1536).fill(0),
  chat: async (messages) => "Mock response",
  structuredOutput: async (prompt, schema) => ({})
};
```

### Mock Vector Store

```typescript
const mockVectorStore: VectorStoreProvider = {
  name: 'mock',
  initialize: async () => {},
  upsertEmbeddings: async (request) => {},
  query: async (request) => [],
  delete: async (ids) => {},
  deleteByFilter: async (filter) => {},
  healthCheck: async () => true
};
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | Ensure PostgreSQL is running: `docker ps` |
| "Invalid JWT" | Token may be expired or invalid secret |
| "Tenant isolation error" | Check tenantId matches user's tenantId in JWT |
| "LLM API error" | Check OPENAI_API_KEY is set and valid |
| "Vector store connection failed" | Check PINECONE_API_KEY or Weaviate URL |

---

## Next Steps

1. **Read**: `README.md` for complete documentation
2. **Explore**: `src/domain/index.ts` for data models
3. **Understand**: `src/services/` for business logic
4. **Build**: Add your custom handlers in `src/api/`
5. **Deploy**: Use `docker-compose.yml` for production

---

**Happy Building! 🚀**
