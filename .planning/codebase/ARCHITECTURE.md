# Architecture

**Analysis Date:** 2026-02-19

## Pattern Overview

**Overall:** Client-Centric SPA with Graceful Degradation

**Key Characteristics:**
- Frontend-focused React application with optional Python backend
- Optimistic UI updates with background persistence
- Graceful degradation when external services are unavailable
- Multiple AI provider abstraction (Gemini/GLM) with runtime switching
- Dual storage strategy: local disk (backend) + optional Supabase cloud

## Layers

**Presentation Layer (React Components):**
- Purpose: User interface and interaction handling
- Location: `/home/bono/Desktop/vetai-consultant-latest/src/components/`
- Contains: View components (UploadView, SearchView, GraphView, AnalyticsView, HistoryView, AppointmentView, AIModelSelector)
- Depends on: Services layer (`/src/services/`), Types (`/src/types.ts`), Translations (`/src/translations.ts`)
- Used by: App.tsx (main container)

**Service Abstraction Layer:**
- Purpose: External API communication and business logic
- Location: `/home/bono/Desktop/vetai-consultant-latest/src/services/`
- Contains:
  - `aiService.ts` - AI provider selector/abstraction (routes to geminiService or glmService)
  - `geminiService.ts` - Google Gemini AI SDK integration
  - `glmService.ts` - GLM AI provider integration
  - `backendService.ts` - Python backend communication (file I/O, graph operations)
  - `qdrantService.ts` - Vector database operations with local fallback
  - `supabaseService.ts` - Supabase database operations (PostgreSQL + pgvector)
  - `graphService.ts` - Graphiti/FalkorDB knowledge graph operations
- Depends on: External APIs (Google, GLM, Supabase), Backend FastAPI server
- Used by: All view components

**Data Layer (Multiple Backends):**
- Purpose: Data persistence and retrieval
- Location: `/home/bono/Desktop/vetai-consultant-latest/backend/` (Python), Supabase (cloud), Qdrant (vector)
- Contains:
  - `backend/main.py` - FastAPI server for file I/O and graph indexing
  - `backend/consultation_data/` - JSON file storage
  - Supabase PostgreSQL with pgvector extension
  - Qdrant vector database (optional, Docker)
- Depends on: FalkorDB (optional), Graphiti (optional)
- Used by: Services layer via HTTP/REST

**Type System Layer:**
- Purpose: TypeScript type definitions and interfaces
- Location: `/home/bono/Desktop/vetai-consultant-latest/src/types.ts`
- Contains: Consultation, ExtractedInfo, AdminData, ClinicalData, Appointment, KnowledgeGraphData, ViewState, Species, Language, AIModel
- Depends on: Nothing (pure types)
- Used by: All components and services

**Localization Layer:**
- Purpose: Bilingual UI support (English/Spanish)
- Location: `/home/bono/Desktop/vetai-consultant-latest/src/translations.ts`
- Contains: Translation dictionaries for en/es
- Depends on: Nothing
- Used by: All view components via `useTranslations()` hook

## Data Flow

**Consultation Upload Flow:**

1. User fills form (vet, owner, patient names) and uploads audio file in UploadView
2. Audio file read as base64 in browser
3. Audio transcription via AI service (geminiService or glmService)
4. Clinical data extraction from transcription (structured JSON)
5. Optimistic UI update (instant feedback to user)
6. Parallel background processing:
   - Embedding generation for semantic search
   - Disk save via backend API (`/api/save_consultation`)
   - Qdrant vector upsert (if available)
7. State update with final results

**Search Flow:**

1. User enters search query in SearchView
2. Query text → embedding via AI service
3. Vector search:
   - Primary: Qdrant HTTP API (`searchQdrant`)
   - Fallback: Browser-based cosine similarity (`searchLocalVectors`)
4. Top results passed to AI for answer generation
5. Results displayed with citations

**Graph Visualization Flow:**

1. User selects patient in GraphView
2. Frontend requests graph data via `graphService.getPatientKnowledgeGraph()`
3. Backend queries Graphiti/FalkorDB for patient's knowledge graph
4. Returns nodes/links for D3.js visualization
5. GraphView component renders interactive force-directed graph

**State Management:**
- `consultations` array in App.tsx is the single source of truth
- LocalStorage acts as backup/offline cache
- Embeddings stored inline in consultation objects for local search fallback
- No global state management library (useState + useEffect pattern)

## Key Abstractions

**AI Provider Abstraction:**
- Purpose: Allow runtime switching between AI providers (Gemini/GLM)
- Examples: `/home/bono/Desktop/vetai-consultant-latest/src/services/aiService.ts`
- Pattern: Facade pattern - `aiService.ts` routes calls to provider-specific implementations based on `AI_MODEL` env var

**Service Layer Abstraction:**
- Purpose: Isolate external API communication from UI components
- Examples: `/home/bono/Desktop/vetai-consultant-latest/src/services/*.ts`
- Pattern: Repository pattern - Each service handles one external concern (AI, vector DB, backend, graph)

**Backend URL Detection:**
- Purpose: Auto-detect correct API endpoint based on environment
- Examples: `/home/bono/Desktop/vetai-consultant-latest/src/services/backendService.ts`
- Pattern: Uses `/api` relative path (proxied by Vite in dev, same-origin in prod)

**Graceful Degradation:**
- Purpose: App continues working even when optional services are down
- Examples: Qdrant unavailable → local browser search; Backend unavailable → localStorage only
- Pattern: Availability checks with fallback implementations

## Entry Points

**Frontend Entry Point:**
- Location: `/home/bono/Desktop/vetai-consultant-latest/src/index.tsx`
- Triggers: Browser loads `index.html`
- Responsibilities: Mount React app to DOM root element, apply React.StrictMode

**Main Application Component:**
- Location: `/home/bono/Desktop/vetai-consultant-latest/src/App.tsx`
- Triggers: Invoked by index.tsx
- Responsibilities:
  - View state management (upload, search, graph, analytics, history, appointment)
  - Consultations state (single source of truth)
  - Language/dark mode state
  - Load consultations from disk on mount
  - Initialize Qdrant on mount
  - Handle save operations with optimistic updates

**Backend Entry Point:**
- Location: `/home/bono/Desktop/vetai-consultant-latest/backend/main.py`
- Triggers: `python main.py` or Docker container start
- Responsibilities:
  - FastAPI server initialization
  - CORS middleware setup
  - Consultation CRUD endpoints
  - Knowledge graph indexing (FalkorDB + Graphiti)
  - Duplicate detection and compaction
  - Health check endpoints

**Vite Dev Server:**
- Location: `/home/bono/Desktop/vetai-consultant-latest/vite.config.ts`
- Triggers: `npm run dev`
- Responsibilities:
  - Proxy `/api` requests to Python backend (port 8000)
  - React hot module replacement
  - Production build to `dist/`

## Error Handling

**Strategy:** Service-specific error handling with graceful fallbacks

**Patterns:**
- **Qdrant failures**: Silent fallback to browser-based vector search, console warning
- **Gemini/GLM failures**: User-visible error alerts via `alert()` or status messages
- **Backend failures**: User-visible alerts with helpful messages (e.g., "Is the Python backend running?")
- **Supabase failures**: Custom `SupabaseError` class with operation context, logged but doesn't block UI
- **Network failures**: Fail-fast approach, no retry logic implemented

**Error Boundaries:**
- No React error boundaries implemented
- Try-catch blocks in async service functions
- Console.error logging for debugging

## Cross-Cutting Concerns

**Logging:** Console-based logging (console.log, console.warn, console.error). No centralized logging service.

**Validation:** Manual validation in components (check required fields before enabling actions). No schema validation library.

**Authentication:** None implemented. App assumes single-user, local deployment.

**Bilingual Support:** Centralized translation dictionary in `translations.ts`, accessed via `useTranslations(language)` hook. All UI text must use translation keys.

**Dark Mode:** Implemented via Tailwind's `dark:` prefix and class-based toggle. App adds/removes 'dark' class on `<html>` element.

**CORS:** Backend uses FastAPI CORSMiddleware with `allow_origins=["*"]` for development.

**Rate Limiting:** Backend implements in-memory rate limiting for destructive operations (compact_duplicates endpoint) - 3 requests per minute per client.

---

*Architecture analysis: 2026-02-19*
