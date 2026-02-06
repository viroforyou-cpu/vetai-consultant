# Architecture

**Analysis Date:** 2025-02-06

## Pattern Overview

**Overall:** Client-Centric SPA with Optional Backend Services

**Key Characteristics:**
- Frontend-focused React application that can run standalone
- Progressive enhancement: core features work without backend
- Optimistic UI updates with background persistence
- Service layer abstraction for multiple AI providers
- Graceful degradation when external services are unavailable

## Layers

**Presentation Layer (React Components):**
- Purpose: User interface and interaction
- Location: `/src/components/`
- Contains: View components for each feature (Upload, Search, Graph, Analytics, History)
- Depends on: Service layer for business logic, types for data structures
- Used by: App.tsx main component

**State Management Layer:**
- Purpose: Application state and data orchestration
- Location: `/src/App.tsx` (single source of truth)
- Contains: `consultations` array, view state, language preference, dark mode
- Depends on: Service layer for persistence and AI operations
- Used by: All view components via props

**Service Layer:**
- Purpose: External API integration and business logic
- Location: `/src/services/`
- Contains: AI services, vector database, backend communication
- Depends on: External APIs (Google Gemini, Qdrant), backend server
- Used by: Presentation layer for all non-UI operations

**Backend Layer (Optional Python FastAPI):**
- Purpose: File I/O, graph database operations, persistent storage
- Location: `/backend/`
- Contains: FastAPI endpoints, Graphiti integration, FalkorDB client
- Depends on: FalkorDB for graph storage, file system for JSON persistence
- Used by: Frontend via `/api` proxy routes

## Data Flow

**Consultation Upload Pipeline:**

1. User fills form and uploads audio file in UploadView component
2. File read as base64 and sent to AI service for transcription
3. Transcription returned via `transcribeAndSummarize()` from aiService
4. Clinical data extraction via `extractClinicalData()` from aiService
5. Optimistic UI update: consultation added to state immediately
6. Background parallel operations:
   - Embedding generation via `getEmbedding()`
   - Disk persistence via `saveConsultationToDisk()`
   - Vector upsert to Qdrant via `upsertConsultation()`

**Search Pipeline:**

1. User enters query in SearchView component
2. Query text → embedding via `getEmbedding()` from aiService
3. Vector search via `searchLocalVectors()` (Qdrant or browser fallback)
4. Results filtered from consultations array
5. AI-generated answer via `generateAnswerFromContext()` from aiService
6. Results displayed with citations

**Graph Pipeline:**

1. User selects patient from dropdown in GraphView component
2. Graph data fetched via `getPatientKnowledgeGraph()` from graphService
3. If unavailable, mock graph generated locally from consultations
4. D3.js force-directed graph rendered
5. User questions routed via `askGraphQuestion()` to backend

**State Management:**
- `consultations` array in App.tsx is single source of truth
- LocalStorage acts as backup/offline cache
- No global state management library (useState + useEffect pattern)
- Embeddings stored inline in consultation objects for local search fallback

## Key Abstractions

**AI Provider Abstraction:**
- Purpose: Switch between Gemini and GLM models without component changes
- Examples: `/src/services/aiService.ts`, `/src/services/geminiService.ts`, `/src/services/glmService.ts`
- Pattern: Strategy pattern - `getCurrentAIModel()` determines which service to call

**Vector Search Abstraction:**
- Purpose: Semantic search with graceful degradation
- Examples: `/src/services/qdrantService.ts`
- Pattern: Fallback pattern - try Qdrant first, fall back to local cosine similarity

**Consultation Data Model:**
- Purpose: Unified representation of veterinary consultation records
- Examples: `/src/types.ts` - `Consultation`, `ExtractedInfo`, `AdminData`, `ClinicalData`
- Pattern: Rich domain model with optional AI-generated fields

**Knowledge Graph Model:**
- Purpose: Patient relationship visualization
- Examples: `/src/types.ts` - `GraphNode`, `GraphLink`, `KnowledgeGraphData`
- Pattern: D3.js-compatible force-directed graph structure

## Entry Points

**Frontend Entry Point:**
- Location: `/src/index.tsx`
- Triggers: Application bootstrap on page load
- Responsibilities: Mount React app to DOM, load styles

**Application Root:**
- Location: `/src/App.tsx`
- Triggers: Called by index.tsx on render
- Responsibilities: State management, routing, service initialization, mock data loading

**Backend Entry Point (Optional):**
- Location: `/backend/main.py`
- Triggers: FastAPI server startup (port 8000)
- Responsibilities: File I/O endpoints, graph service health, consultation CRUD

**Build Entry Point:**
- Location: `/vite.config.ts`
- Triggers: `npm run dev` or `npm run build`
- Responsibilities: Vite configuration, dev server setup, API proxy to backend

## Error Handling

**Strategy:** Graceful degradation with user feedback

**Patterns:**
- Qdrant failures: Silent fallback to browser-based vector search with console warning
- AI service failures: User-visible alerts via `alert()` and status messages
- Backend failures: User-visible alerts with helpful messages
- Embedding generation failures: Logged but doesn't block save operations
- Network failures: Fail-fast (no retry logic implemented)

**Service Availability Checks:**
- `isQdrantAvailable()` in qdrantService.ts checks Qdrant health before operations
- `checkModelAvailability()` in aiService.ts validates API keys
- `getGraphHealth()` in graphService.ts checks Graphiti/FalkorDB availability

## Cross-Cutting Concerns

**Logging:** Console-based logging with `console.log()`, `console.warn()`, `console.error()`. No structured logging framework.

**Validation:** Manual validation in components (e.g., checking `!query.trim()` before search). No centralized validation layer.

**Authentication:** Not implemented. Application is single-user, no user accounts or authentication.

**Internationalization:** Binary language toggle ('en' | 'es'). All AI prompts include language context. No i18n framework.

**Dark Mode:** Class-based strategy using `dark` class on `<html>` element. All components use `dark:` Tailwind prefix for dark mode styles.

**API Key Management:** Environment variables only (`GEMINI_API_KEY`, `GLM_API_KEY`). No secrets management.

---

*Architecture analysis: 2025-02-06*
