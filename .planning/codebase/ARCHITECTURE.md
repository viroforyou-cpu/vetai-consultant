# Architecture

**Analysis Date:** 2024-12-12

## Pattern Overview

**Overall:** Frontend-React-first with optional Python backend

**Key Characteristics:**
- Frontend-centric architecture with optional backend for persistence
- Service-oriented separation of concerns
- Graceful degradation when backend services are unavailable
- Single source of truth in React state with localStorage fallback

## Layers

**Presentation Layer (React Components):**
- Purpose: UI rendering and user interaction
- Location: `src/components/`
- Contains: View components (UploadView, SearchView, GraphView, AnalyticsView, HistoryView)
- Depends on: TypeScript types and service layer
- Used by: App.tsx routing system

**Application Layer (App.tsx):**
- Purpose: Application state management and routing
- Location: `src/App.tsx`
- Contains: Main app logic, state management, view routing
- Depends on: React hooks, TypeScript types, services
- Used by: React DOM

**Service Layer:**
- Purpose: External API integration and business logic
- Location: `src/services/`
- Contains: AI services (gemini), vector DB (qdrant), backend communication
- Depends on: External SDKs (`@google/genai`, Qdrant API)
- Used by: Presentation and Application layers

**Data Layer:**
- Purpose: Data persistence and storage
- Location: `backend/` (minimal) + `consultation_data/` directory
- Contains: File-based persistence stub
- Depends on: File system
- Used by: Service layer

## Data Flow

**Consultation Upload Pipeline**:

1. User fills form + uploads audio in `UploadView`
2. `App.tsx` handles save via `handleSave()` function
3. Parallel async processing:
   - Generate embedding via `geminiService.getEmbedding()`
   - Optimistic UI update - consultation added to state immediately
   - Background operations run without blocking:
     - `saveConsultationToDisk()` via backend API
     - `upsertConsultation()` to Qdrant vector DB
4. Graceful handling of failures - non-blocking UI

**Search Pipeline**:

1. User enters search query in `SearchView`
2. Query converted to embedding via `geminiService.getEmbedding()`
3. Vector search via `qdrantService.searchQdrant()` with fallback to `searchLocalVectors()`
4. AI-generated answer via `geminiService.generateAnswerFromContext()`
5. Results displayed with citations

**State Management**:
- Single source of truth: `consultations` array in `App.tsx`
- LocalStorage backup for offline capability
- Embeddings stored inline for local search fallback

## Key Abstractions

**Consultation:**
- Purpose: Core data model for veterinary consultations
- Location: `src/types.ts`
- Pattern: Rich object with metadata, AI-generated fields, and embeddings

**Service Abstraction:**
- Purpose: Decouple business logic from UI
- Location: `src/services/`
- Pattern: Plain TypeScript modules with async functions
- Examples: `geminiService.ts`, `qdrantService.ts`, `backendService.ts`

**Graceful Degradation:**
- Purpose: Ensure functionality when services unavailable
- Location: Primarily `qdrantService.ts`
- Pattern: Service availability checks with fallback implementations
- Examples: Qdrant unavailable → local browser-based vector search

## Entry Points

**Frontend Entry:**
- Location: `src/index.tsx` → `src/App.tsx`
- Triggers: React DOM rendering
- Responsibilities: App initialization, view routing

**Backend Entry (Optional):**
- Location: `backend/main.py` (currently minimal stub)
- Triggers: FastAPI server startup
- Responsibilities: File I/O operations, graph operations (minimal)

**Development:**
- Location: Root directory
- Command: `npm run dev` (starts Vite dev server on :3000)

## Error Handling Strategy

**Qdrant Failures:**
- Silent fallback to local browser-based vector search
- Logged warnings in console

**Gemini Failures:**
- User-visible error alerts
- Critical operations may fail

**Backend Failures:**
- Helpful error messages with guidance (e.g., "Is the Python backend running?")
- Non-blocking UI for primary operations

**Network Failures:**
- Fails fast without retry logic
- Graceful degradation where possible

## Cross-Cutting Concerns

**Dark Mode:**
- Implementation: Tailwind CSS `darkMode: 'class'` strategy
- Location: `App.tsx` toggles 'dark' class on `<html>` element
- Pattern: Requires `dark:` prefix in all component styles

**Environment Detection:**
- Implementation: Auto-detects prod vs dev mode
- Location: `backendService.ts`
- Logic: `window.location.port === '8000'` determines backend URL

**Internationalization:**
- Implementation: Dual language support (English/Spanish)
- Location: `Language` type and service layer
- Pattern: Language passed down to all views and services

---

*Architecture analysis: 2024-12-12*