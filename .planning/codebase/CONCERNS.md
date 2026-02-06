# Codebase Concerns

**Analysis Date:** 2026-02-06

## Tech Debt

**Duplicate Component Directories:**
- Issue: The codebase has TWO component directories with similar files: `/src/components/` (current, maintained) and `/components/` (legacy, deprecated)
- Files: `/src/components/UploadView.tsx`, `/components/UploadView.tsx`, `/src/components/AnalyticsView.tsx`, `/components/AnalyticsView.tsx`, etc.
- Impact: Creates confusion about which directory to use for development. Developers may accidentally modify the legacy code.
- Fix approach: Remove `/components/` directory after confirming all functionality has been migrated to `/src/components/`

**Duplicate Service Files:**
- Issue: Service files exist at both root `/services/` and `/src/services/` with different implementations
- Files: `/services/geminiService.ts`, `/src/services/geminiService.ts`, `/services/qdrantService.ts`, `/src/services/qdrantService.ts`
- Impact: The root `App.tsx` imports from `/src/services/` while `/src/App.tsx` imports from `./services/`. This creates import path confusion and potential runtime inconsistencies.
- Fix approach: Consolidate all services into `/src/services/` and remove root `/services/` directory. Update all import statements.

**Duplicate App Root Components:**
- Issue: Two `App.tsx` files exist at root and `/src/` with different implementations
- Files: `/App.tsx`, `/src/App.tsx`
- Impact: Unclear which is the actual entry point. The root `App.tsx` imports from `/src/`, while `/src/App.tsx` is a simpler implementation.
- Fix approach: Keep only `/src/App.tsx` as the canonical source. Remove root `App.tsx` after migrating any unique functionality.

**Orphaned Project Subdirectories:**
- Issue: Multiple complete project subdirectories that appear to be abandoned variants
- Files: `/vetai-groq/`, `/vet-groq/`, `/veterinary-consultation/`
- Impact: Code bloat, confusion about which is the active project. These directories have their own `package.json`, `src/`, and components - essentially separate projects.
- Fix approach: Move these to separate git repositories or archive them. If they're experimental variants, document their purpose or remove if obsolete.

**Inconsistent API Key Environment Variables:**
- Issue: Multiple env var names used for the same Google Gemini API key
- Files: `/services/geminiService.ts` uses `process.env.API_KEY`, `/src/services/aiService.ts` uses `process.env.GEMINI_API_KEY`
- Impact: Configuration inconsistency. Developers must set multiple env vars for the same service to work.
- Fix approach: Standardize on one name (`GEMINI_API_KEY`) and update all references.

## Known Bugs

**Missing `logger` Variable in Backend:**
- Symptoms: Python backend may crash on startup if `GRAPH_SERVICE_AVAILABLE` is false
- Files: `/backend/main.py:37`
- Trigger: When `graph_service.py` import fails, the code references `logger.warning()` but `logger` is defined later at line 40
- Workaround: The `try/except` block swallows the error, but the logger call fails silently

**Duplicate Endpoint Definition in Backend:**
- Symptoms: Potential FastAPI route conflict
- Files: `/backend/main.py:254` and `/backend/main.py:419` both define `@app.get("/graph/patient/{patient_name}")`
- Trigger: Accessing `/graph/patient/{name}` endpoint
- Workaround: FastAPI uses the last defined route, so the Graphiti version (line 419) overrides the FalkorDB version
- Fix approach: Rename one endpoint or combine them into a single endpoint with optional parameter

**AbortSignal.timeout Not Supported in All Browsers:**
- Symptoms: Status check may fail in older browsers
- Files: `/App.tsx:63`, `/App.tsx:74`
- Trigger: Checking Qdrant or Backend status
- Workaround: The timeout feature degrades gracefully if `AbortSignal.timeout` is not available

**Import Path Inconsistency for AI Services:**
- Symptoms: Components may import from wrong service path
- Files: `/src/components/UploadView.tsx:2` imports from `../services/aiService`, but root `App.tsx` may import differently
- Trigger: Using AI functionality from different entry points
- Workaround: Current working directory affects which services are loaded

## Security Considerations

**API Keys in Environment Variables:**
- Risk: API keys stored in `.env` files can be accidentally committed to git
- Files: `.gitignore` does block `.env`, but `secrets.env.example` contains placeholder values that may be confused with actual secrets
- Current mitigation: `.gitignore` prevents committing `.env` files
- Recommendations:
  - Add pre-commit hook to check for actual API keys in code
  - Use a secrets management service for production deployments
  - Rename `secrets.env.example` to `env.example` with clear placeholders

**CORS Wide Open in Backend:**
- Risk: FastAPI backend allows all origins with `allow_origins=["*"]`
- Files: `/backend/main.py:47-53`
- Current mitigation: None - this is a security vulnerability in production
- Recommendations:
  - Restrict CORS to specific frontend origins
  - Add authentication middleware for API endpoints
  - Implement rate limiting on public endpoints

**No Authentication/Authorization:**
- Risk: Anyone who can access the backend can create/read/delete consultations
- Files: All FastAPI endpoints in `/backend/main.py`
- Current mitigation: None
- Recommendations:
  - Add API key or JWT authentication
  - Implement user sessions and permissions
  - Add audit logging for sensitive operations

**Unvalidated File Uploads:**
- Risk: Malicious files could be uploaded via the consultation upload flow
- Files: Frontend accepts any file type, backend saves without validation
- Current mitigation: File I/O is limited to JSON consultation data
- Recommendations:
  - Validate file types and sizes on both frontend and backend
  - Scan uploaded files for malware
  - Sanitize filenames to prevent path traversal attacks

## Performance Bottlenecks

**No Retry Logic for AI API Calls:**
- Problem: AI service calls fail immediately on network issues
- Files: `/src/services/geminiService.ts`, `/src/services/glmService.ts`
- Cause: No exponential backoff or retry mechanism implemented
- Improvement path: Add retry wrapper with exponential backoff for all AI API calls

**Fire-and-Forget Saves Without Confirmation:**
- Problem: Consultation saves to Qdrant and backend are "fire-and-forget" - no confirmation of success
- Files: `/App.tsx:210-213` - `Promise.all([...]).catch()` doesn't await or report failures
- Cause: Optimistic UI update prioritizes perceived performance over data integrity
- Improvement path: Add save queue with status tracking, show success/error toasts

**Unbounded LocalStorage Growth:**
- Problem: Consultations stored in localStorage without size limits or cleanup
- Files: `/App.tsx:39-46`, `/src/App.tsx:39-43`
- Cause: No quota management - localStorage has 5-10MB limit across all domains
- Improvement path: Implement pagination, archive old records, add storage monitoring

**Embedding Generation Without Rate Limiting:**
- Problem: Rapid embedding requests could hit API rate limits
- Files: `/App.tsx:245-283` - `fixMissingEmbeddings` loops through records with only 500ms delay
- Cause: Fixed delay doesn't adapt to actual rate limit responses
- Improvement path: Implement token bucket or sliding window rate limiting

**No Caching for Embedding Search:**
- Problem: Every semantic search generates a new embedding for the query
- Files: `/src/services/qdrantService.ts:66-88`
- Cause: Query embeddings are not cached, repeated searches waste API calls
- Improvement path: Add LRU cache for query embeddings with TTL

## Fragile Areas

**Dual App Components with Different Features:**
- Files: `/App.tsx` (522 lines), `/src/App.tsx` (282 lines)
- Why fragile: Root `App.tsx` has features not found in `/src/App.tsx` (status checking, AI model selector, system health display)
- Safe modification: Always test both App.tsx files when modifying shared components
- Test coverage: No automated tests verify feature parity between the two implementations

**Graph Generation Heavily Dependent on AI Prompts:**
- Files: `/src/services/geminiService.ts:251-275`
- Why fragile: Graph visualization breaks if AI returns malformed JSON or unexpected node/link structure
- Safe modification: Add robust JSON parsing with schema validation, fallback for invalid responses
- Test coverage: Manual testing only - no unit tests for graph generation edge cases

**Qdrant Availability Detection:**
- Files: `/src/services/qdrantService.ts:8-15`
- Why fragile: Simple HTTP check may falsely report success if Qdrant returns errors but is technically reachable
- Safe modification: Add actual query test to verify Qdrant is functional, not just responsive
- Test coverage: None - relies on runtime graceful degradation

**AI Model Switching:**
- Files: `/src/services/aiService.ts:6-9`, `/src/components/AIModelSelector.tsx`
- Why fragile: Model selection relies on `process.env.AI_MODEL` which requires app restart to change
- Safe modification: Implement dynamic model switching without restart, add model availability API
- Test coverage: No tests verify that switching models doesn't break existing consultations

**Docker Compose References Nonexistent Dockerfile:**
- Files: `/docker-compose.yml`
- Why fragile: References Dockerfile that may not exist, breaking containerized deployment
- Safe modification: Create proper Dockerfile or remove docker-compose if containerization isn't used
- Test coverage: No automated testing of Docker build process

## Scaling Limits

**LocalStorage Storage Ceiling:**
- Current capacity: ~5-10MB total across all domains
- Limit: Browser localStorage quota - cannot be increased
- Scaling path: Implement server-side storage with pagination, move to IndexedDB for larger capacity

**Qdrant Vector Collection Size:**
- Current capacity: Unclear - no monitoring of collection size
- Limit: Qdrant performance degrades with millions of vectors without proper sharding
- Scaling path: Add collection monitoring, implement Qdrant clustering/sharding for large datasets

**FalkorDB/Graphiti Connection Pooling:**
- Current capacity: Single global connection per process
- Limit: Python backend runs single uvicorn worker by default
- Scaling path: Implement proper connection pooling, run multiple uvicorn workers with load balancer

**Audio File Transcription:**
- Current capacity: No file size limits enforced
- Limit: Gemini API has file size limits (currently ~25MB for audio)
- Scaling path: Add client-side file size validation, implement chunked upload for large files

## Dependencies at Risk

**@google/genai SDK Version:**
- Risk: Version `^0.2.0` is relatively new and may have breaking changes in future versions
- Impact: Transcription, embedding, and all AI features depend on this package
- Migration plan: Pin to exact version, watch for releases, test upgrades in staging environment

**graphiti-core:**
- Risk: Package may be unstable or deprecated - imports wrapped in try/except
- Files: `/backend/graph_service.py:14-22`
- Impact: Temporal knowledge graph features become unavailable if package fails
- Migration plan: Monitor Graphiti project status, implement fallback to pure FalkorDB if needed

**d3 (v7.9.0):**
- Risk: Large library used only for graph visualization
- Impact: Bundle size, potential alternative with smaller footprint
- Migration plan: Consider React-specific graph libraries (react-force-graph, vis-network) for better tree-shaking

**falkordb:**
- Risk: Less mainstream than Redis, uncertain long-term maintenance
- Files: `/backend/main.py:18-22`
- Impact: Graph database functionality
- Migration plan: Consider RedisGraph or pure Neo4j as alternatives

## Missing Critical Features

**No User Authentication:**
- Problem: Cannot distinguish between different veterinarians or practices
- Blocks: Multi-tenant support, audit trails, per-user data isolation

**No Export/Backup Functionality:**
- Problem: Cannot bulk export consultation data for backup or migration
- Blocks: Data portability, compliance with data retention policies

**No Data Validation Schema:**
- Problem: Consultation data structure can drift without enforcement
- Blocks: Data integrity guarantees, automated migrations
- Impact: Risk of corrupted data making it into localStorage or backend storage

**No Offline Mode Queue:**
- Problem: Cannot create consultations when network is unavailable
- Blocks: Usage in environments with intermittent connectivity

**No Search History:**
- Problem: Cannot see previous semantic searches or save important queries
- Blocks: Workflow continuity, research reproducibility

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: All service functions (`geminiService.ts`, `glmService.ts`, `qdrantService.ts`, `backendService.ts`)
- Files: All files in `/src/services/` and `/services/`
- Risk: AI service integrations could break without detection
- Priority: High - test core business logic around consultation saving and searching

**No Component Tests:**
- What's not tested: All React components (`UploadView`, `SearchView`, `AnalyticsView`, `GraphView`)
- Files: All files in `/src/components/` and `/components/`
- Risk: UI regressions could go undetected
- Priority: High - test user workflows for consultation creation and search

**No Integration Tests:**
- What's not tested: Full user journeys (upload -> transcribe -> extract -> save -> search)
- Risk: End-to-end functionality breaks when services interact
- Priority: Medium - test critical paths through the application

**No Backend API Tests:**
- What's not tested: FastAPI endpoints (`/save_consultation`, `/graph/*`, `/consultations`)
- Files: `/backend/main.py`, `/backend/graph_service.py`
- Risk: API contract changes could break frontend
- Priority: Medium - test request/response formats, error handling

**No Error Boundary Tests:**
- What's not tested: Application behavior when services fail (Qdrant offline, Gemini API errors)
- Risk: Poor user experience during partial failures
- Priority: Low - test graceful degradation paths already implemented

**No Performance Tests:**
- What's not tested: Large dataset performance (1000+ consultations)
- Risk: Application becomes slow as data grows
- Priority: Low - test with realistic data volumes

---

*Concerns audit: 2026-02-06*
