# Codebase Concerns

**Analysis Date:** 2026-02-19

## Tech Debt

**Large Files (Maintainability Risk):**
- Issue: Several source files exceed 400 lines, indicating poor separation of concerns
- Files: `src/services/glmService.ts` (528 lines), `src/components/GraphView.tsx` (510 lines), `src/services/supabaseService.ts` (490 lines), `src/components/AppointmentView.tsx` (421 lines), `src/translations.ts` (370 lines)
- Impact: Difficult to navigate, test, and modify. Changes risk introducing bugs in unrelated functionality.
- Fix approach: Split into smaller modules. For `glmService.ts`, separate embedding logic, transcription, and data extraction into dedicated modules. For `GraphView.tsx`, extract D3 visualization logic into custom hooks or separate components.

**TypeScript `any` Type Overuse:**
- Issue: 50+ occurrences of `any` type throughout codebase, reducing type safety
- Files: `src/components/GraphView.tsx` (D3 callbacks), `src/components/SearchView.tsx`, `src/components/HistoryView.tsx`, `src/services/glmService.ts`
- Impact: Loses TypeScript benefits, potential runtime errors, harder refactoring
- Fix approach: Define proper interfaces for D3 event types, API response types, and component props

**Non-Standard Import Maps:**
- Issue: App uses esm.sh CDN imports in `index.html` instead of npm dependencies
- Files: `index.html` (importmap configuration)
- Impact: Non-standard build process, potential version drift, harder dependency management
- Fix approach: Migrate to standard npm dependencies with proper bundling via Vite

**Mock Data in Production Code:**
- Issue: Mock consultation data embedded directly in `App.tsx`
- Files: `src/App.tsx` (lines 28-187)
- Impact: Increases bundle size, test data in production build
- Fix approach: Move to separate test fixtures file or environment-specific loading

**Dual Component Directory System:**
- Issue: Two component directories exist: `/src/components/` (current) and `/components/` (legacy)
- Files: See `CLAUDE.md` documentation
- Impact: Developer confusion, unclear which directory to use for new components
- Fix approach: Deprecate and remove `/components/` directory after migrating any unique functionality

## Known Bugs

**Qdrant Connection Failures Silent:**
- Symptoms: Vector search silently falls back to local browser search when Qdrant is unavailable
- Files: `src/services/qdrantService.ts` (lines 7-14, 37-38, 65-66)
- Trigger: Qdrant Docker container not running or network issues
- Workaround: Local fallback works but provides degraded experience
- Impact: Users may not realize they're using degraded search functionality

**Graph View Mock Data Fallback:**
- Symptoms: GraphView generates mock data when graph service fails
- Files: `src/components/GraphView.tsx` (lines 86-116)
- Trigger: Graphiti or FalkorDB service unavailable
- Workaround: Mock data allows testing but is not real patient data
- Impact: May confuse users about whether they're viewing actual patient knowledge graph

**Backend Save Failures Not Reported:**
- Symptoms: Backend save errors logged but not shown to user
- Files: `src/App.tsx` (lines 214-217), `src/services/backendService.ts` (lines 20-23)
- Trigger: Backend API unavailable or returns errors
- Workaround: Data remains in UI state but may be lost on refresh
- Impact: Users may think data is saved when it only exists in memory

**AI Model Switching Requires Reload:**
- Symptoms: Switching AI models triggers full page reload via `window.location.reload()`
- Files: `src/components/AIModelSelector.tsx` (lines 21-38)
- Trigger: User clicks model switch button
- Workaround: Reload completes within 1-2 seconds
- Impact: Poor user experience, loses any unsaved state

**Duplicate Backend Endpoint:**
- Symptoms: Two endpoints define `/graph/patient/{patient_name}` - one for FalkorDB, one for Graphiti
- Files: `backend/main.py` (lines 565 and 730)
- Trigger: Accessing patient graph endpoint
- Workaround: FastAPI uses last defined route (Graphiti version)
- Impact: FalkorDB graph endpoint is inaccessible

## Security Considerations

**Unprotected API Endpoints:**
- Risk: Backend has no authentication middleware; CORS allows all origins
- Files: `backend/main.py` (lines 51-57)
- Current mitigation: None documented. Production deployment assumes trusted network.
- Recommendations: Add API key authentication, implement proper CORS configuration for production domains, add rate limiting

**API Keys Exposed to Client:**
- Risk: API keys loaded via `process.env` in browser environment, bundled into client JavaScript
- Files: `src/services/geminiService.ts` (line 4), `src/services/glmService.ts` (lines 4, 7)
- Current mitigation: None - keys are visible in browser dev tools
- Recommendations: Proxy all AI API calls through backend to hide keys

**Secrets in Git:**
- Risk: `.env` file exists and may contain API keys
- Files: `.env`, `secrets.env` (in .gitignore but existence confirmed)
- Current mitigation: Files are in `.gitignore` but committed `.env.docker.example` may contain sensitive config templates
- Recommendations: Ensure no actual keys in example files, use secret management service for production

**Path Traversal in Backup Directory:**
- Risk: User-controlled backup directory path could lead to arbitrary file writes
- Files: `backend/main.py` (lines 359-391)
- Current mitigation: `_validate_backup_directory()` function restricts to allowed base directories
- Recommendations: Validation is good but could be strengthened with additional checks

**SQL Injection via User Input:**
- Risk: Patient names used directly in Cypher queries without proper escaping
- Files: `backend/main.py` (lines 258-296)
- Current mitigation: Basic single quote escaping for diagnosis/treatment fields only
- Recommendations: Use parameterized queries or proper Cypher escaping libraries

**No Audit Logging:**
- Risk: No tracking of who created/modified consultations
- Files: All data modification endpoints
- Current mitigation: None
- Recommendations: Add user authentication, audit log table, consultation versioning for HIPAA compliance

## Performance Bottlenecks

**Embedding Generation Blocks Save:**
- Problem: Embedding generation awaited before UI update (1+ second delay)
- Files: `src/App.tsx` (lines 199-204)
- Cause: `getEmbedding()` is awaited before optimistic UI update
- Improvement path: Make embedding truly async, update UI immediately, show loading indicator for vector index status

**Large Translation File:**
- Problem: All translations loaded into memory at once
- Files: `src/translations.ts` (370 lines)
- Cause: Single file with all translations for both languages
- Improvement path: Split into language-specific files, lazy load based on selected language

**No Pagination for Large Datasets:**
- Problem: `getAllConsultations()` loads all records at once
- Files: `src/services/supabaseService.ts` (lines 245-272)
- Cause: Hard-coded limit of 100 with no cursor-based pagination
- Improvement path: Implement infinite scroll or cursor-based pagination for large datasets

**Unoptimized D3 Force Simulation:**
- Problem: Force simulation recalculates on every node filter change
- Files: `src/components/GraphView.tsx` (lines 260-338)
- Cause: Entire simulation restarts when `visibleNodeTypes` changes
- Improvement path: Use D3's transition API or pre-compute positions for common filter states

**No Embedding Search Caching:**
- Problem: Every semantic search generates a new embedding for the query
- Files: Search views, AI service calls
- Cause: Query embeddings are not cached, repeated searches waste API calls
- Improvement path: Add LRU cache for query embeddings with TTL

## Fragile Areas

**AI Model Switching:**
- Files: `src/components/AIModelSelector.tsx` (lines 21-38)
- Why fragile: Requires page refresh via `window.location.reload()` to apply model change
- Safe modification: Consider runtime model switching without refresh, or make state management more robust
- Test coverage: Minimal - switching logic not tested

**Graph Service Dependencies:**
- Files: `backend/graph_service.py`, `backend/main.py` (lines 21-41)
- Why fragile: Multiple optional dependencies (Graphiti, FalkorDB) with graceful degradation
- Safe modification: Use feature flags for clear service availability, add health check endpoints
- Test coverage: Service availability checks not unit tested

**Supabase Vector Search RPC:**
- Files: `src/services/supabaseService.ts` (lines 311-353)
- Why fragile: Requires database function `match_consultations` to exist; fallback behavior assumes basic search
- Safe modification: Validate RPC existence at startup, provide clearer error messages
- Test coverage: Database function existence not verified

**State Synchronization:**
- Files: `src/App.tsx`, `src/components/UploadView.tsx`
- Why fragile: Manual state updates between parent/child components, potential for desync
- Safe modification: Use state management library (Zustand, Jotai) or Context API for complex state
- Test coverage: No integration tests for state sync scenarios

**Qdrant Availability Detection:**
- Files: `src/services/qdrantService.ts` (lines 7-14)
- Why fragile: Simple HTTP check may falsely report success if Qdrant returns errors but is technically reachable
- Safe modification: Add actual query test to verify Qdrant is functional, not just responsive
- Test coverage: None - relies on runtime graceful degradation

## Scaling Limits

**LocalStorage Appointment Storage:**
- Current capacity: ~5-10MB localStorage limit per domain
- Limit: ~100-500 appointments before hitting quota
- Files: `src/components/AppointmentView.tsx` (lines 29-43)
- Scaling path: Implement server-side appointment storage with Supabase or backend API

**Browser-Based Vector Search Fallback:**
- Current capacity: Cosine similarity in main thread blocks UI
- Limit: ~1000 consultations before noticeable lag during search
- Files: `src/services/qdrantService.ts` (lines 93-116)
- Scaling path: Use Web Workers for vector calculations, or ensure Qdrant is always available

**In-Memory Consultation State:**
- Current capacity: All consultations loaded into React state
- Limit: Memory usage grows linearly; ~10MB per 1000 consultations
- Files: `src/App.tsx` (line 16)
- Scaling path: Implement virtualized lists (react-window), pagination, or server-side filtering

**D3 Force Graph Performance:**
- Current capacity: ~100-200 nodes before force simulation slows
- Limit: O(n²) complexity in force calculations
- Files: `src/components/GraphView.tsx`
- Scaling path: Use spatial indexing, limit graph to recent consultations, or implement subgraph views

**Qdrant Vector Collection Size:**
- Current capacity: Unclear - no monitoring of collection size
- Limit: Qdrant performance degrades with millions of vectors without proper sharding
- Files: `src/services/qdrantService.ts`
- Scaling path: Add collection monitoring, implement Qdrant clustering/sharding for large datasets

## Dependencies at Risk

**graphiti-core:**
- Risk: Import handling with try/except suggests unstable or optional dependency
- Files: `backend/graph_service.py` (lines 17-29)
- Impact: Knowledge graph features fail gracefully but lose temporal reasoning
- Migration plan: Document required version, pin in requirements.txt, consider abstraction layer

**falkordb:**
- Risk: Optional import with None fallback throughout codebase
- Files: `backend/main.py` (lines 21-26)
- Impact: Legacy graph features unavailable if package not installed
- Migration plan: Make FalkorDB truly optional with feature flags, or remove if replaced by Graphiti

**@google/genai:**
- Risk: Version 0.2.0 - pre-1.0 release may have breaking changes
- Files: `package.json` (line 12)
- Impact: AI features may break with minor version updates
- Migration plan: Pin to specific version, monitor changelog, test before upgrading

**d3 (v7.9.0):**
- Risk: D3 v8 has breaking changes from v7
- Files: `package.json` (line 14)
- Impact: Graph visualization may break if upgraded
- Migration plan: Stay on v7 until ready for migration, then update all d3 imports and syntax

**@supabase/supabase-js:**
- Risk: Version 2.95.3 - rapid version releases
- Files: `package.json` (line 13)
- Impact: Database operations may break with major version changes
- Migration plan: Pin to minor version range, review changelog for breaking changes

## Missing Critical Features

**No Audit Logging:**
- Problem: No tracking of who created/modified consultations
- Blocks: Compliance requirements (HIPAA), forensic analysis of data issues
- Recommendations: Add user authentication, audit log table, consultation versioning

**No Data Validation:**
- Problem: AI-extracted data not validated before saving
- Blocks: Clinical safety, data quality assurance
- Recommendations: Implement schema validation with Zod, add review step before auto-save

**No Offline Mode:**
- Problem: Application requires backend connection for full functionality
- Blocks: Usage in areas with poor connectivity
- Recommendations: Service worker for offline caching, sync when reconnected

**No Export/Import:**
- Problem: No way to export consultation data for backup or migration
- Blocks: Data portability, backup/restore workflows
- Recommendations: Add CSV/JSON export, bulk import functionality

**No User Authentication:**
- Problem: Cannot distinguish between different veterinarians or practices
- Blocks: Multi-tenant support, audit trails, per-user data isolation
- Recommendations: Implement authentication (Supabase Auth or custom JWT), user management UI

**No Search History:**
- Problem: Cannot see previous semantic searches or save important queries
- Blocks: Workflow continuity, research reproducibility
- Recommendations: Add search history table, save/search for saved queries

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: All service layer functions (AI calls, vector search, data transformation)
- Files: `src/services/*.ts`, `src/components/*.tsx`
- Risk: Refactoring breaks existing functionality, regressions introduced
- Priority: High - core business logic untested

**No Integration Tests:**
- What's not tested: API interactions between frontend and backend, database operations
- Files: Full request/response cycles
- Risk: Backend changes break frontend silently
- Priority: High - data flow critical

**No E2E Tests:**
- What's not tested: User workflows (upload consultation, search, view graph)
- Files: Complete user journeys
- Risk: UI changes break user experience
- Priority: Medium - critical workflows should be tested

**No Type Safety Tests:**
- What's not tested: TypeScript `any` types throughout codebase (50+ occurrences)
- Files: `src/components/*`, `src/services/*`
- Risk: Runtime type errors, undefined behavior
- Priority: Medium - improve type coverage gradually

**No Error Boundary Tests:**
- What's not tested: Application behavior when services fail (Qdrant offline, Gemini API errors)
- Risk: Poor user experience during partial failures
- Priority: Low - test graceful degradation paths already implemented

---

*Concerns audit: 2026-02-19*
