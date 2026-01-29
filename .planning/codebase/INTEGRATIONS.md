# External Integrations

**Analysis Date:** 2026-01-29

## APIs & External Services

**AI/ML Services:**
- Google Gemini AI - Primary AI provider
  - Models: gemini-2.5-flash, text-embedding-004
  - Uses @google/genai SDK
  - Functions: Transcription, embeddings, semantic search, data extraction, knowledge graph generation
  - Auth: API_KEY environment variable

**Vector Database:**
- Qdrant - Vector search for semantic similarity
  - Collection: vet_consultations
  - Vectors: 768-dimension cosine similarity
  - URL: http://localhost:6333 (configurable via QDRANT_URL)
  - Fallback: Browser-based local vector search implementation

## Data Storage

**Databases:**
- Local file system - Primary persistence
  - Location: ./consultation_data/ (relative to backend cwd)
  - Format: JSON files
  - Services: backendService.ts

**Graph Database:**
- FalkorDB - Referenced in Docker compose
  - Purpose: Graph operations for knowledge graphs
  - Connection: falkordb:6379 (Docker)
  - Note: Implementation appears minimal in current codebase

**File Storage:**
- Local filesystem only - Audio files, attachments stored locally

**Caching:**
- No dedicated caching detected
- LocalStorage used for client-side caching of consultations

## Authentication & Identity

**Auth Provider:**
- Custom authentication
  - Implementation: No auth system detected
  - Security: API_KEY for AI services only

## Monitoring & Observability

**Error Tracking:**
- Console logging
  - Implementation: try/catch blocks with console.error/warn
  - Coverage: Network errors, AI service failures, database issues

**Logs:**
- Browser console
  - Framework: native console API
  - Patterns: Error messages, warnings, debug info

## CI/CD & Deployment

**Hosting:**
- Static file hosting (no specific platform detected)
- Docker support via docker-compose.yml

**CI Pipeline:**
- No CI/CD configuration detected
- Manual deployment via npm run build

## Environment Configuration

**Required env vars:**
- API_KEY - Google Gemini AI API key
- VITE_BACKEND_URL - Backend API endpoint (defaults to http://127.0.0.1:8000)
- QDRANT_URL - Vector database endpoint (defaults to http://localhost:6333)
- AI_MODEL - AI model selection (defaults to 'gemini')

**Secrets location:**
- .env file in project root
- Not committed to git (secrets.env.example exists)

## Webhooks & Callbacks

**Incoming:**
- No webhook endpoints detected

**Outgoing:**
- Google Search API via Gemini for PubMed searches
  - Usage: searchPubMed() function uses googleSearch tool

---

*Integration audit: 2026-01-29*
```