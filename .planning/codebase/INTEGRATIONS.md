# External Integrations

**Analysis Date:** 2025-02-19

## APIs & External Services

**AI/ML Models:**
- **Google Gemini AI** - Transcription, embeddings, semantic search, clinical data extraction
  - SDK/Client: `@google/genai` (frontend), `google-generativeai` (backend)
  - Models: `gemini-2.5-flash` (primary), `text-embedding-004` (embeddings)
  - Auth: `GEMINI_API_KEY` environment variable
  - Location: `/src/services/geminiService.ts`

- **GLM (ZhipuAI/Z.ai)** - Alternative AI model for same features
  - API Endpoint: `https://api.z.ai/api/anthropic`
  - Models: `glm-4.7`, `glm-4.6`, `glm-4.5` (with fallback chain)
  - Auth: `GLM_API_KEY` environment variable
  - Embedding endpoint: `GLM_EMBEDDING_URL` (default: `https://api.z.ai/api/v1/embeddings`)
  - Location: `/src/services/glmService.ts`
  - Note: Uses Anthropic-compatible API format

- **AI Service Abstraction** - Model selection layer
  - Location: `/src/services/aiService.ts`
  - Runtime switching via `AI_MODEL` environment variable
  - Availability checking for both Gemini and GLM

- **Google Search (Gemini only)** - PubMed/veterinary literature search
  - Implementation: `googleSearch` tool in `searchPubMed()` function
  - Not available when using GLM model

## Data Storage

**Databases:**
- **Supabase (PostgreSQL with pgvector)** - Primary database
  - Connection: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js`
  - Schema: `/supabase/migrations/20260213000000_initial_schema.sql`
  - Tables: `consultations`, `attachments`
  - Vector search: HNSW index on 1536-dim embeddings using pgvector
  - RPC functions: `match_consultations` for vector similarity search
  - Location: `/src/services/supabaseService.ts`

- **Qdrant** (Optional - vector database with graceful degradation)
  - Connection: `QDRANT_URL` (default: http://localhost:6333)
  - Collection: `vet_consultations` with 768-dim cosine vectors
  - REST API via direct fetch calls
  - Fallback: Browser-based local vector search when unavailable
  - Location: `/src/services/qdrantService.ts`

- **FalkorDB** (Optional - graph database)
  - Connection: `FALKORDB_HOST`, `FALKORDB_PORT` (default: localhost:6379)
  - Client: `falkordb` Python package
  - Purpose: Temporal knowledge graphs via Graphiti
  - Location: `/backend/graph_service.py`, `/backend/main.py`

**File Storage:**
- Local filesystem for consultation data: `./consultation_data/`
- Supabase Storage (planned - Phase 4)
- Attachments metadata stored in `attachments` table

**Caching:**
- Browser localStorage as offline cache
- Embeddings stored inline in consultation objects for local search fallback

## Authentication & Identity

**Auth Provider:**
- None (application is currently single-user, no authentication)
- Supabase Auth is configured but not yet implemented
- Future: `VITE_SUPABASE_URL` and anon key could support Supabase Auth

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry or similar service integrated)

**Logs:**
- Console logging in browser (`console.log`, `console.warn`, `console.error`)
- Python logging in backend (`logging` module, INFO level)
- Structured logging in AI services for debugging model calls

## CI/CD & Deployment

**Hosting:**
- **Docker Compose** - Primary deployment method
  - Services: frontend (nginx), backend (FastAPI), qdrant, falkordb
  - Network: `vetai-network` (bridge)
  - Volumes: `consultation_data`, `qdrant_data`, `falkordb_data`
  - Location: `/docker-compose.yml`

- **Vercel** (Planned/partially configured)
  - Config file: `/vercel.json` (currently empty)
  - Suitable for frontend-only deployment

**CI Pipeline:**
- None detected (no GitHub Actions, GitLab CI, or similar)

## Environment Configuration

**Required env vars:**
- `AI_MODEL` - Model selection: 'gemini' or 'glm'
- `GEMINI_API_KEY` OR `GLM_API_KEY` - At least one AI model key required
- `API_KEY` - Legacy fallback (maps to GLM_API_KEY)

**Optional env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL (default: http://localhost:54321)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `QDRANT_URL` - Qdrant vector database URL (default: http://localhost:6333)
- `VITE_BACKEND_URL` - Backend API URL (default: http://127.0.0.1:8000)
- `GLM_API_URL` - Custom GLM API endpoint
- `GLM_MODEL` - GLM model name (default: glm-4.7)
- `GLM_EMBEDDING_URL` - GLM embedding endpoint
- `GLM_EMBEDDING_MODEL` - GLM embedding model
- `FALKORDB_HOST` - FalkorDB host (default: localhost)
- `FALKORDB_PORT` - FalkorDB port (default: 6379)

**Secrets location:**
- `.env` file (not committed to git, in .gitignore)
- `.env.docker.example` - Template for configuration
- Environment passed via Docker Compose for containerized deployment

## Webhooks & Callbacks

**Incoming:**
- None (no webhook endpoints configured)

**Outgoing:**
- None (no webhook sending implemented)

**API Endpoints (Internal - Backend):**
- `GET /` - Backend health check
- `POST /save_consultation` - Save consultation data
- `POST /graph/consultation` - Add consultation to knowledge graph
- `POST /graph/search` - Search knowledge graph
- `POST /graph/question` - Ask question about graph
- `GET /graph/patient/{patient_name}` - Get patient knowledge graph
- `GET /graph/stats` - Graph statistics
- `GET /graph/health` - Graph service health check

**Frontend API Proxy:**
- Vite dev server proxies `/api/*` to backend (dev mode)
- nginx proxies `/api/*` to backend (production/Docker mode)

---

*Integration audit: 2025-02-19*
