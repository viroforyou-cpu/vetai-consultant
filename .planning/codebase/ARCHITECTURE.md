# Architecture

**Analysis Date:** 2026-01-31

## Architectural Pattern

**Pattern**: Service-Oriented Frontend with AI Integration

The application follows a service-oriented architecture where React components consume service modules that handle external API interactions (Gemini AI, Qdrant vector DB, optional backend).

## Layers

### 1. Presentation Layer (React Components)

**Location**: `src/components/`

**Responsibilities**:
- UI rendering and user interaction
- Form handling and validation
- State management (local useState)
- Optimistic UI updates

**Components**:
- `UploadView.tsx` - Consultation upload form
- `SearchView.tsx` - Semantic search interface
- `GraphView.tsx` - D3.js knowledge graph visualization
- `AnalyticsView.tsx` - Analytics dashboard
- `HistoryView.tsx` - Consultation history list
- `AIModelSelector.tsx` - AI model selection UI

**Pattern**: Function components with hooks, no global state management

### 2. Service Layer (TypeScript Modules)

**Location**: `src/services/`

**Services**:
- `aiService.ts` - AI service selector (Gemini/GLM routing)
- `geminiService.ts` - Google Gemini AI operations
- `glmService.ts` - GLM AI operations
- `qdrantService.ts` - Vector database operations
- `backendService.ts` - Backend API communication
- `graphService.ts` - Graph data processing

**Pattern**: Plain TypeScript modules with named exports, Promise-based async functions

### 3. Data Layer (Types + Persistence)

**Location**: `types.ts`, `App.tsx` state management

**Storage**:
- LocalStorage for offline cache
- Optional backend for file I/O
- Qdrant for vector search

## Data Flow

### Consultation Upload Flow

```
User Input (UploadView)
    ↓
Optimistic UI Update (instant)
    ↓
Parallel Async Processing:
    ├→ Audio Transcription (Gemini AI)
    ├→ Data Extraction (Gemini AI)
    └→ Embedding Generation (Gemini AI)
    ↓
Background Saves:
    ├→ LocalStorage
    ├→ Backend API (optional)
    └→ Qdrant Vector DB
    ↓
Update State with Final Results
```

### Semantic Search Flow

```
User Query (SearchView)
    ↓
Query Embedding (Gemini AI)
    ↓
Vector Search:
    ├→ Qdrant (primary)
    └→ Local Fallback (if Qdrant unavailable)
    ↓
AI-Generated Answer (Gemini AI)
    ↓
Display Results with Citations
```

## Key Abstractions

### AI Service Selector Pattern

**Location**: `src/services/aiService.ts`

**Purpose**: Route AI requests to appropriate provider (Gemini or GLM)

**Pattern**:
```typescript
export const getEmbedding = async (text: string): Promise<number[]> => {
  const model = getCurrentAIModel();
  if (model === 'glm') {
    return glmService.getGLMEmbedding(text);
  }
  return geminiService.getEmbedding(text);
};
```

### Vector Search with Fallback

**Location**: `src/services/qdrantService.ts`

**Pattern**: Try Qdrant first, fall back to local browser search

```typescript
export const searchQdrant = async (vector: number[]): Promise<string[]> => {
  if (!await isQdrantAvailable()) return [];
  // ... Qdrant search
};

export const searchLocalVectors = (queryVector: number[], consultations: Consultation[]): string[] => {
  // Browser-based cosine similarity
};
```

### Service Detection

**Location**: `src/services/backendService.ts`

**Pattern**: Auto-detect environment (dev vs prod)

```typescript
const BASE_URL = window.location.port === '8000'
  ? ''
  : process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
```

## Entry Points

### Primary Entry Point

**File**: `index.html` → `src/index.tsx` → `src/App.tsx`

**Flow**:
1. HTML loads with Tailwind CDN and import maps
2. `src/index.tsx` mounts React to `#root`
3. `src/App.tsx` initializes services and manages application state

### Service Initialization

**Location**: `src/App.tsx` (useEffect)

**Order**:
1. Load consultations from LocalStorage
2. Initialize Qdrant connection
3. Check for missing embeddings
4. Register service worker (if available)

## State Management

**Pattern**: Local component state with prop drilling

**Main State** (`src/App.tsx`):
- `consultations` - Array of all consultations (single source of truth)
- `currentView` - Current active view
- `language` - Selected language (en/es)
- `darkMode` - Dark mode toggle
- `aiModel` - Selected AI model

**No Global State Management**: No Redux, Zustand, or Context API used

## Module Boundaries

**Services**: Pure TypeScript modules, no React dependencies
**Components**: React components, consume services via imports
**Types**: Centralized in `types.ts`

**Import Pattern**: Relative imports only (`../`, `./`)

---

*Architecture analysis: 2026-01-31*
