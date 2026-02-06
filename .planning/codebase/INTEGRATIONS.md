# External Integrations

**Analysis Date:** 2026-02-06

## APIs & External Services

**AI/ML:**
- Google Gemini AI - Text embeddings, transcription, data extraction, semantic search, knowledge graph generation
  - SDK/Client: `@google/genai` (npm), `google-genai` (pip)
  - Auth: `GEMINI_API_KEY` env var (optional fallback)
  - Models: `gemini-2.5-flash`, `text-embedding-004`
  - Service file: `/src/services/geminiService.ts`, `/backend/graph_service.py`

- Z.ai GLM API - Alternative AI model for multi-language support
  - Auth: `GLM_API_KEY` env var (primary AI model)
  - Model: `glm-4.7`
  - Service file: `/src/services/glmService.ts` (if exists)

- PubMed/Biomedical Literature - Scientific literature search
  - Implementation: Uses Gemini AI with Google Search tool (`googleSearch`)
  - Service file: `/src/services/geminiService.ts` - `searchPubMed()` function

## Data Storage

**Vector Databases:**
- Qdrant - Vector database for semantic search
  - Connection: `QDRANT_URL` env var (defaults to http://localhost:6333)
  - Client: REST API via fetch
  - Collection: `vet_consultations`
  - Vector size: 768 dimensions, Cosine distance
  - Service file: `/src/services/qdrantService.ts`
  - Graceful degradation: Falls back to browser-based local vector search

**Graph Databases:**
- FalkorDB - Graph database for knowledge graphs
  - Connection: `FALKORDB_HOST` (localhost), `FALKORDB_PORT` (6379)
  - Client: Python `falkordb` package
  - Graph name: `vetai_graph`
  - Service file: `/backend/main.py`, `/backend/graph_service.py`
  - Optional: Gracefully handles unavailability

- Graphiti - Temporal knowledge graph library
  - Connection: Uses FalkorDB as backend
  - Client: Python `graphiti-core` package
  - Service file: `/backend/graph_service.py`
  - Optional: Gracefully handles unavailability

**File Storage:**
- Local filesystem - Consultation data persistence
  - Location: `/backend/consultation_data/` directory
  - Format: JSON files per consultation
  - Service file: `/backend/main.py`

- LocalStorage (Browser) - Client-side data persistence and offline cache
  - Storage keys: `vetai_consultations`
  - Limitations: ~5MB storage limit
  - Service file: `/src/App.tsx`

**Caching:**
- Browser LocalStorage - Consultation data cache
- Inline embeddings in consultation objects for local search fallback

## Authentication & Identity

**Auth Provider:**
- Custom - No external authentication provider
  - Implementation: API keys stored in `.env` file
  - No user authentication system
  - Direct API key usage for AI services

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Browser console logging (console.warn, console.error, console.log)
- Python logging module (backend)

## CI/CD & Deployment

**Hosting:**
- Static file hosting (Vite build output)
- Optional: Docker containers via `docker-compose.yml`

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- `GLM_API_KEY` - Z.ai API key (primary AI model)
- `GEMINI_API_KEY` - Google Gemini API key (optional fallback)

**Optional env vars:**
- `AI_MODEL` - Model selector ('glm' or 'gemini', defaults to 'glm')
- `QDRANT_URL` - Qdrant endpoint (defaults to http://localhost:6333)
- `VITE_BACKEND_URL` - Backend URL for proxy (defaults to /api)
- `FALKORDB_HOST` - FalkorDB host (defaults to localhost)
- `FALKORDB_PORT` - FalkorDB port (defaults to 6379)

**Secrets location:**
- `.env` file in project root
- `.env.example` and `secrets.env.example` for reference

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## CDNs and External Resources

**Module CDNs:**
- esm.sh - Dynamic module loading for `d3`, `@google/genai`, `react`, `react-dom`
  - Configured in `/index.html` import maps

**CSS CDNs:**
- Tailwind CSS CDN - `https://cdn.tailwindcss.com`

**Font CDNs:**
- Google Fonts - Inter family (300, 400, 500, 600, 700 weights)

---

*Integration audit: 2026-02-06*
