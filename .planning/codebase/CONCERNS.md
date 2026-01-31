# Codebase Concerns

**Analysis Date:** 2026-01-31

## Tech Debt

**Legacy Component Duplication:**
- Issue: Two component directories exist with similar functionality - `/src/components/` and `/components/`
- Files: `/src/components/` (current), `/components/` (legacy)
- Impact: Confusion about which components to use, maintenance burden
- Fix approach: Clean up `/components/` directory and ensure all imports use `/src/components/`

**Entry Point Duplication:**
- Issue: Two App.tsx files and two index.tsx files at different locations
- Files: `/App.tsx` (23KB), `/src/App.tsx` (281KB), `/index.tsx`, `/src/index.tsx`
- Impact: Uncertainty about which entry points are active, potential conflicts
- Fix approach: Consolidate to single entry point structure (prefer `/src/` directory)

**Service Layer Duplication:**
- Issue: Multiple service files with similar names and functionality scattered across directories
- Files: `/services/geminiService.ts` (369 lines), `/src/services/geminiService.ts` (297 lines), similar patterns for other services
- Impact: Code duplication, inconsistent behavior, maintenance difficulty
- Fix approach: Consolidate services into `/src/services/` directory, remove redundant files

**Missing Service Import:**
- Issue: App.tsx imports from non-existent `./src/services/aiService`
- Files: `/App.tsx` line 10, actual service at `/src/services/geminiService.ts`
- Impact: Runtime error during startup
- Fix approach: Update import path or rename file appropriately

## Known Bugs

**AI Service Import Error:**
- Symptoms: App fails to start due to missing import
- Files: `/App.tsx` line 10 imports `./src/services/aiService`
- Trigger: Application startup
- Workaround: Change import to `./src/services/geminiService`

**Backend API Endpoint Mismatch:**
- Symptoms: Backend service fails when endpoint doesn't match
- Files: `/services/backendService.ts` line 4-6 uses port detection logic
- Trigger: Running in production vs development environment
- Workaround: Ensure backend URL is correctly configured in environment

**Missing Backend API Implementation:**
- Symptoms: Save operations fail
- Files: `/backend/main.py` has basic implementation but `/save_consultation` endpoint exists
- Trigger: Attempting to save consultations
- Workaround: Use localStorage as fallback

## Security Considerations

**Hardcoded API Keys:**
- Risk: API keys exposed in environment variables stored in plaintext
- Files: `.env` file contains `API_KEY`
- Current mitigation: Uses `.env` file with example
- Recommendations: Add `secrets.env` to `.gitignore`, implement proper secret management

**CORS Configuration:**
- Risk: Overly permissive CORS settings allow any origin
- Files: `/backend/main.py` lines 49-53
- Current mitigation: `allow_origins=["*"]`
- Recommendations: Implement whitelist of allowed origins

**File Upload Security:**
- Risk: No validation of uploaded audio files
- Files: UploadView component processes any audio file
- Recommendations: Add file type validation, size limits, virus scanning

## Performance Bottlenecks

**Embedding Generation Rate Limits:**
- Problem: Sequential embedding generation can cause delays
- Files: `/App.tsx` lines 254-283 in `fixMissingEmbeddings`
- Cause: Sequential API calls with 500ms delays
- Improvement path: Implement parallel embedding generation with retry logic

**Large File Downloads:**
- Problem: Mock data is large (504 lines in App.tsx)
- Files: `/App.tsx` lines 84-243
- Cause: In-memory storage of all consultation data
- Improvement path: Implement pagination, lazy loading, or virtual scrolling

**Qdrant Fallback Performance:**
- Problem: Local vector search is slow for large datasets
- Files: `/services/qdrantService.ts` lines 94-117
- Cause: Browser-side cosine similarity calculation
- Improvement path: Consider using WebAssembly for faster calculations

## Fragile Areas

**Environment Detection Logic:**
- Files: `/services/backendService.ts` lines 4-6
- Why fragile: Relies on port detection which can break in different deployment scenarios
- Safe modification: Add environment variable override
- Test coverage: Limited testing of production vs dev environments

**Graph View Component:**
- Files: `/src/components/GraphView.tsx` (504 lines)
- Why fragile: Large monolithic component with complex D3.js logic
- Safe modification: Break into smaller subcomponents
- Test coverage: Limited testing of graph visualization

**Service Initialization:**
- Files: `/App.tsx` lines 38-52
- Why fragile: Multiple service checks with complex dependency chain
- Safe modification: Add error boundaries for each service
- Test coverage: No unit tests for service initialization

## Scaling Limits

**LocalStorage Data Size:**
- Current capacity: ~5MB (browser limitation)
- Limit: Will fail with large datasets
- Scaling path: Implement IndexedDB or service worker caching

**Qdrant Connection Limits:**
- Current capacity: Limited by local Docker setup
- Limit: Memory and CPU constraints
- Scaling path: Deploy managed Qdrant service

**Gemini API Rate Limits:**
- Current capacity: Free tier with limitations
- Limit: Will block during high usage
- Scaling path: Implement request queuing and exponential backoff

## Dependencies at Risk

**React 18.3.1:**
- Risk: Critical security patches may be missing
- Impact: Potential XSS or other vulnerabilities
- Migration plan: Monitor for updates, plan upgrade to React 19 when stable

**@google/genai 0.2.0:**
- Risk: Early version with potential breaking changes
- Impact: API changes could break functionality
- Migration plan: Monitor Google SDK updates, test compatibility

**D3.js 7.9.0:**
- Risk: Large library with many unused features
- Impact: Increased bundle size
- Migration plan: Consider lighter alternatives or tree-shaking

## Missing Critical Features

**No Authentication System:**
- Problem: No user authentication or session management
- Blocks: Multi-user environment, role-based access control
- Recommendation: Implement auth with OAuth2 or JWT

**No Data Validation:**
- Problem: User inputs not validated before processing
- Blocks: Data integrity, preventing invalid consultations
- Recommendation: Add frontend validation with Zod or similar

**No Audit Logging:**
- Problem: No track of who made changes to data
- Blocks: Regulatory compliance, debugging
- Recommendation: Implement audit trails for all data operations

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: Service layer logic, component rendering, data processing
- Files: All service files, most components
- Risk: Regression issues when adding new features
- Priority: High

**No Integration Tests:**
- What's not tested: API endpoints, service interactions, data flow
- Files: Backend endpoints, frontend-backend communication
- Risk: Integration failures not caught
- Priority: Medium

**No Performance Tests:**
- What's not tested: Embedding generation speed, search performance
- Files: Service methods, large dataset handling
- Risk: Performance degradation unnoticed
- Priority: Medium

---

*Concerns audit: 2026-01-31*
