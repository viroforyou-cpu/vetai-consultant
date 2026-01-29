# Codebase Concerns

**Analysis Date:** 2026-01-29

## Tech Debt

### Corrupted Backend Files
- **Issue**: Python backend files are corrupted/unreadable (`main.py`, `graph_agent.py`)
- Files: `[backend/main.py]`, `[backend/graph_agent.py]`
- Impact: Backend functionality completely broken, Docker compose will fail to build
- Fix approach: Rewrite backend from scratch or delete broken files if not needed

### Duplicate AI Service Abstraction
- **Issue**: Unnecessary service layer abstraction creating maintenance burden
- Files: `[src/services/aiService.ts]`, `[src/services/geminiService.ts]`, `[src/services/glmService.ts]`
- Impact: Double maintenance, duplicate code paths, potential model switching bugs
- Fix approach: Use factory pattern directly in each service or remove abstraction layer entirely

### Service Import Inconsistency
- **Issue**: UploadView imports from aiService while App imports directly from geminiService
- Files: `[src/components/UploadView.tsx]` (line 2), `[src/App.tsx]` (line 9)
- Impact: Confusing code paths, potential model mismatches
- Fix approach: Standardize all imports to use aiService layer

## Known Bugs

### Audio Format Mismatch
- **Symptoms**: GLM transcription may fail with audio files
- Files: `[src/services/glmService.ts]` (lines 73-76)
- Trigger: Audio file transmission using `image_url` format instead of audio format
- Workaround: Force Gemini usage for audio processing

### Hardcoded API Keys in Code
- **Symptoms**: Key detection false positives
- Files: `[src/services/aiService.ts]` (lines 88-89)
- Trigger: Production API keys might match detection patterns
- Workaround: Use separate validation for proper API keys

### Promise.all Silent Failure
- **Symptoms**: Background saves can fail without user notification
- Files: `[src/App.tsx]` (lines 48-51)
- Trigger: Backend or Qdrant failures during parallel saves
- Workaround: Add error collection and summary display

## Security Considerations

### API Key Exposure Risk
- **Risk**: API keys in environment variables only
- Files: `[secrets.env]` (gitignored), `[src/services/geminiService.ts]` (line 4), `[src/services/glmService.ts]` (line 7)
- Current mitigation: Git ignores secrets file
- Recommendations: Implement runtime key validation, add key rotation logs

### No Input Validation
- **Risk**: Direct user input to AI models without sanitization
- Files: `[src/services/glmService.ts]` (line 108), `[src/services/geminiService.ts]` (prompt templates)
- Current mitigation: None detected
- Recommendations: Add input sanitization, prompt injection protection

### Cross-Site Scripting
- **Risk**: Dynamic content from AI responses could contain scripts
- Files: `[src/components/SearchView.tsx]`, `[src/components/GraphView.tsx]`
- Current mitigation: None detected
- Recommendations: HTML escape all AI responses before display

## Performance Bottlenecks

### Sequential AI Processing
- **Problem**: Audio transcription and data extraction run sequentially
- Files: `[src/components/UploadView.tsx]` (lines 48+)
- Cause: UI pattern requires complete transcription before extraction
- Improvement path: Parallel processing with intermediate state updates

### Large Embedding Arrays
- **Problem**: 768-dim vectors stored inline in each consultation
- Files: `[src/types.ts]`, `[src/services/geminiService.ts]` (embedding response)
- Cause: No separate vector storage architecture
- Improvement path: Store vectors in database or blob storage, references in objects

## Fragile Areas

### Qdrant Dependency Chain
- **Files**: `[src/services/qdrantService.ts]`, `[src/App.tsx]` (lines 34-36)
- Why fragile: Multiple nested try-catch blocks with silent failures
- Safe modification: Add configuration thresholds for fallback times
- Test coverage: Limited - only checks 200ms threshold

### Environment Detection Logic
- **Files**: `[src/services/backendService.ts]` (line 4)
- Why fragile: Port-based detection assumes specific deployment patterns
- Safe modification: Add explicit configuration options
- Test coverage: Missing for non-standard deployments

### GLM Service Placeholder Implementation
- **Files**: `[src/services/glmService.ts]` (multiple functions)
- Why fragile: Fallback patterns not thoroughly tested
- Safe modification: Add GLM-specific error handling
- Test coverage: Minimal for GLM integration paths

## Scaling Limits

### Client-Side Vector Search
- **Current capacity**: ~100 consultations before performance degradation
- **Limit**: Browser memory and computation constraints
- **Scaling path**: Implement pagination, result caching, or server-assisted search

### LocalStorage Backup
- **Current capacity**: ~5MB (browser limit)
- **Limit**: ~1000 consultations with full data
- **Scaling path**: IndexedDB implementation or cloud backup integration

## Dependencies at Risk

### GLM Service Dependencies
- **Risk**: Z.AI API could change format without notice
- Impact: All GLM functionality breaks
- Migration plan: Implement fallback to Gemini, add API version pinning

### D3.js Visualization
- **Risk**: Major version changes could break D3.js patterns
- Impact: Graph visualization fails
- Migration plan: Implement wrapper component with version-specific code

## Missing Critical Features

### Data Validation Layer
- **Problem**: No validation on consultation data structure
- Blocks: Reliability of AI processing, data integrity
- Recommendation: Implement schema validation for all consultations

### Error Recovery System
- **Problem**: No mechanism to retry failed AI operations
- Blocks: Reliability in poor network conditions
- Recommendation: Exponential backoff for transient failures

### Audit Logging
- **Problem**: No audit trail for AI decisions and data changes
- Blocks: Compliance, debugging, liability
- Recommendation: Add comprehensive logging for all operations

## Test Coverage Gaps

### AI Service Testing
- **What's not tested**: Actual API calls, error responses, rate limiting
- Files: `[src/services/]` directory
- **Risk**: Production failures not caught, API limits exceeded
- Priority: High - need mock AI service for testing

### Component Integration Testing
- **What's not tested**: User workflows across components
- Files: All components in `[src/components/]`
- **Risk**: UI state management issues between views
- Priority: Medium - need E2E tests

### Backend API Testing
- **What's not tested**: Actual file I/O, graph operations
- Files: `[backend/]` (currently broken)
- **Risk**: Silent failures in data persistence
- Priority: High - backend needs complete rewrite and tests

---

*Concerns audit: 2026-01-29*