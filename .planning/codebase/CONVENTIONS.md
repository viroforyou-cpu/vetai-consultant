# Coding Conventions

**Analysis Date:** 2025-02-06

## Naming Patterns

**Files:**
- **TypeScript/React:** `PascalCase.tsx` for components, `camelCase.ts` for services/utilities
  - Examples: `UploadView.tsx`, `GraphView.tsx`, `SearchView.tsx` (components in `/src/components/`)
  - Examples: `geminiService.ts`, `backendService.ts`, `qdrantService.ts` (services in `/src/services/`)
  - Examples: `aiService.ts`, `graphService.ts`, `glmService.ts`
- **Python:** `snake_case.py` for all modules
  - Examples: `main.py`, `graph_service.py`, `test_graph.py` (in `/backend/`)
- **Type definition files:** `PascalCase.ts` or `types.ts`
  - Root-level: `/types.ts`
  - In src: `/src/types.ts`

**Functions:**
- **TypeScript:** `camelCase` for all functions
  - Examples: `getEmbedding`, `transcribeAndSummarize`, `extractClinicalData`
  - Examples: `saveConsultationToDisk`, `loadConsultationsFromDisk`, `upsertConsultation`
  - Examples: `searchLocalVectors`, `isQdrantAvailable`, `getPatientKnowledgeGraph`
  - Async functions use same convention with `async` keyword: `async function fetchData()`
- **Python:** `snake_case` for all functions
  - Examples: `get_graph_connection`, `add_consultation_to_graph`, `search_knowledge_graph`
  - Examples: `ask_graph_question`, `get_patient_knowledge_graph`, `get_graph_statistics`
  - Async functions: `async def fetch_data()`

**Variables:**
- **TypeScript:** `camelCase`
  - Examples: `patientName`, `graphData`, `isAnswering`, `selectedPatientKey`
  - Examples: `isSearching`, `isAnswering`, `visibleNodeTypes`, `patientSearchQuery`
  - Booleans prefixed with `is`: `isLoading`, `isProcessing`, `darkMode`
- **Python:** `snake_case`
  - Examples: `patient_name`, `graph_data`, `falkordb_host`, `graph_connection`
  - Booleans also prefixed with `is`: `FALKORDB_AVAILABLE`, `GRAPH_SERVICE_AVAILABLE`

**Types/Interfaces:**
- **TypeScript:** `PascalCase` for all types and interfaces
  - Examples: `Consultation`, `KnowledgeGraphData`, `ExtractedInfo`, `Attachment`
  - Examples: `AdminData`, `ClinicalData`, `GraphNode`, `GraphLink`
  - Examples: `GraphViewProps`, `UploadViewProps`, `SearchView props` (type: `any` commonly used)
  - Enums: `PascalCase` with `UPPER_CASE` values
  - Example: `enum Species { DOG = 'Dog', CAT = 'Cat', BIRD = 'Bird', HORSE = 'Horse', OTHER = 'Other', UNKNOWN = 'Unknown' }`

**Constants:**
- **TypeScript:** `UPPER_SNAKE_CASE` for global constants
  - Examples: `COLLECTION_NAME`, `QDRANT_URL`, `AI_MODEL`
- **Python:** `UPPER_SNAKE_CASE` for module-level constants
  - Examples: `CONSULTATION_DIR`, `FALKORDB_HOST`, `FALKORDB_PORT`, `GRAPH_SERVICE_AVAILABLE`

## Code Style

**Formatting:**
- **Tool:** Tailwind CSS classes for styling (no separate CSS-in-JS or styled-components)
- **Indentation:** 2 spaces for TypeScript/JavaScript, 4 spaces for Python
- **Line length:** No strict limit enforced, but generally kept under 100-120 characters
- **Semicolons:** Used in TypeScript/JavaScript (consistently present)
- **Quotes:** Single quotes for strings in both TypeScript and Python

**Linting:**
- No explicit ESLint configuration found in project root (no `.eslintrc*` files)
- No explicit Prettier configuration
- TypeScript strict mode enabled in `tsconfig.json` (`target: ES2022`)

**CSS/Styling:**
- **Framework:** Tailwind CSS via CDN (configured in `index.html`)
- **Custom styles:** Minimal, in `src/index.css` for animations and scrollbar customization
- **Dark mode:** Class-based strategy using `dark:` prefix for all conditional dark mode styles
  - Toggle adds/removes 'dark' class on `<html>` element (see `/src/App.tsx` lines 185-188)
- **Transitions:** Global transition styles in `index.css` for smooth color/bg/border transitions

## Import Organization

**Order:**
1. React and framework imports
2. Third-party library imports (d3, lucide-react)
3. Type imports
4. Service imports
5. Relative component imports

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`: `"@/*": ["./*"]`)
- Default usage is relative imports: `import X from './components/X'` or `import Y from '../services/Y'`

**Example from `/src/App.tsx`:**
```typescript
import React, { useState, useEffect } from 'react';
import { Consultation, ViewState, Language } from './types';
import UploadView from './components/UploadView';
import GraphView from './components/GraphView';
import SearchView from './components/SearchView';
import { initQdrant, upsertConsultation } from './services/qdrantService';
import { saveConsultationToDisk, loadConsultationsFromDisk } from './services/backendService';
import { getEmbedding } from './services/geminiService';
```

**Example from `/src/components/UploadView.tsx`:**
```typescript
import React, { useState } from 'react';
import { transcribeAndSummarize, extractClinicalData } from '../services/aiService';
import { Consultation, Language } from '../types';
```

**Example from `/src/services/graphService.ts`:**
```typescript
import { backendUrl } from './backendService';
```

## Error Handling

**Patterns:**

**Frontend (TypeScript) - Try-catch with logging:**
```typescript
// From src/App.tsx handleSave
try {
    vector = await getEmbedding(contentToEmbed);
} catch (e) {
    console.warn("Embedding generation failed, continuing without vector", e);
}
```

**Frontend - User-facing alerts for critical errors:**
```typescript
catch (e) {
    console.error("Critical Save Error:", e);
    alert("Error processing record.");
}
```

**Frontend - Silent returns for non-critical failures:**
```typescript
// From src/services/backendService.ts
export const saveConsultationToDisk = async (consultation: Consultation): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_URL}/save_consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultation),
    });
    if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
    }
  } catch (error) {
    console.error("Save Consultation Error:", error);
    // Don't throw, just log. We don't want to break the UI flow if just the local backup fails
  }
};
```

**Backend (Python) - Logging with structured messages:**
```python
# From backend/main.py
try:
    for file_path in CONSULTATION_DIR.glob("*.json"):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            consultations.append(data)
except Exception as e:
    logger.error(f"Error loading consultations: {e}")
    return consultations
```

**Backend - HTTPException for API endpoints:**
```python
# From backend/main.py
try:
    result = await ask_graph_question(request.question, context_limit=request.context_limit)
    return result
except Exception as e:
    logger.error(f"Graph ask error: {e}")
    raise HTTPException(status_code=500, detail=str(e))
```

**Graceful Degradation Strategy:**
- **Qdrant unavailable** → falls back to local browser-based vector search (`searchLocalVectors`)
- **Backend unavailable** → returns empty arrays/objects instead of crashing
- **Graph service unavailable** → generates mock data from consultation records
- **AI model unavailable** → tries fallback models (GLM service tries multiple model versions)

## Logging

**Framework:** Console methods in frontend, Python `logging` module in backend

**Patterns:**
- **Frontend:** `console.warn()` for non-critical issues, `console.error()` for failures
  - Example: `console.warn("Embedding generation failed, continuing without vector", e);`
  - Example: `console.error("Failed to save to Qdrant:", error);`
  - Example: `console.error("Local vector search error", e);`
- **Backend:** `logger.info()`, `logger.warning()`, `logger.error()` with structured messages
  - Example: `logger.info(f"Connected to FalkorDB at {FALKORDB_HOST}:{FALKORDB_PORT}")`
  - Example: `logger.error(f"Error loading consultations: {e}")`
  - Example: `logger.warning("Qdrant init error:", error)`
- **Service calls:** Log before and after expensive operations
- **AI model selection:** Log current model on startup and during selection

**Example from vite.config.ts:**
```typescript
console.log(`[Vite] Proxying /api to: ${backendUrl}`);
console.log(`[Vite] AI Model: ${aiModel}`);
```

**Example from src/services/glmService.ts:**
```typescript
console.log(`[GLM API] Trying model: ${model}`);
console.log(`[GLM API] Model ${model} - Response status:`, response.status);
console.log(`[GLM API] Model ${model} - SUCCESS!`);
```

**Structured logging prefixes:**
- `[Vite]` - Build configuration
- `[GLM API]` - GLM API calls
- `[GLM Embedding]` - Embedding generation
- `[GraphView]` - Graph view operations

## Comments

**When to Comment:**
- Above complex algorithms (vector similarity calculations in `qdrantService.ts`)
- For deprecation notices: `@deprecated Use getPatientKnowledgeGraph instead`
- For section dividers in larger files
- To explain fallback behavior
- For JSDoc on service functions (in `graphService.ts`)

**JSDoc/TSDoc:**
- Used selectively in `src/services/graphService.ts`
- Not consistently used across other services
- Function parameters typically inferred from TypeScript types

**Example from src/services/graphService.ts:**
```typescript
/**
 * Check health of the graph knowledge service
 */
export async function getGraphHealth(): Promise<GraphHealth> {
  ...
}

/**
 * Search the knowledge graph using semantic search
 */
export async function searchKnowledgeGraph(
  query: string,
  limit: number = 10
): Promise<GraphSearchResults> {
  ...
}

/**
 * Legacy function for backward compatibility.
 * Use getPatientKnowledgeGraph instead.
 * @deprecated Use getPatientKnowledgeGraph instead
 */
export async function getPatientGraph(patientName: string): Promise<KnowledgeGraphData> {
  return getPatientKnowledgeGraph(patientName);
}
```

**Inline comments for complex logic:**
```typescript
// From src/services/qdrantService.ts
/**
 * Fallback: Search using Cosine Similarity locally in the browser.
 * This ensures "Database Search" works even if Qdrant (Docker) is offline.
 */
export const searchLocalVectors = (queryVector: number[], consultations: Consultation[]): string[] => {
    try {
        // Helper: Dot Product
        const dot = (a: number[], b: number[]) => a.reduce((acc, val, i) => acc + val * b[i], 0);
        // Helper: Magnitude
        const mag = (v: number[]) => Math.sqrt(v.reduce((acc, val) => acc + val * val, 0));
        ...
```

## Function Design

**Size:**
- Service functions: Generally 20-60 lines
- Component functions: View components 100-250 lines (e.g., `GraphView.tsx` is ~505 lines)
- React event handlers: Typically 10-30 lines
- Python backend functions: 20-80 lines

**Parameters:**
- Prefer named parameters in objects for complex functions
- Individual parameters for simple functions (2-3 params max)
- Destructuring used consistently for props
- Optional parameters with default values at the end

```typescript
// Good: Destructured props for components
const UploadView: React.FC<UploadViewProps> = ({ onSave, language, setIsProcessing }) => {
```

```typescript
// Good: Individual parameters for simple functions
export const getEmbedding = async (text: string): Promise<number[]> => {
```

```typescript
// Good: Object parameter for complex data
export const transcribeAndSummarize = async (
  audioBase64: string,
  mimeType: string,
  language: Language
): Promise<{ transcription: string; summary: string }> => {
```

```typescript
// Optional parameters with defaults
export async function searchKnowledgeGraph(
  query: string,
  limit: number = 10
): Promise<GraphSearchResults> {
```

**Return Values:**
- Async functions always return Promises with proper typing
- Error states often return empty arrays/objects rather than throwing
- Success/Failure indicated via return value, not exceptions

```typescript
// Pattern from backendService.ts - always return array
export const loadConsultationsFromDisk = async (): Promise<Consultation[]> => {
    try {
        const res = await fetch(`${BACKEND_URL}/consultations`);
        if(res.ok) return await res.json();
        return [];  // Empty fallback, not throw
    } catch(e) {
        console.error("Failed to load from disk", e);
        return [];  // Always return array
    }
};
```

```typescript
// Pattern from qdrantService.ts - fallback to empty array
export const searchQdrant = async (vector: number[]): Promise<string[]> => {
    if (!await isQdrantAvailable()) return [];
    try {
        ...
        if (!response.ok) return [];
        ...
    } catch (error) {
        console.error("Qdrant search failed:", error);
        return [];
    }
};
```

## Module Design

**Exports:**
- **TypeScript:** Named exports for services, default exports for React components
- **Python:** Explicit named imports from modules

**Service Module Pattern:**
```typescript
// All functions exported by name (src/services/geminiService.ts)
export const getEmbedding = async (text: string): Promise<number[]> => { ... }
export const transcribeAndSummarize = async (...) => { ... }
export const extractClinicalData = async (...) => { ... }
export const semanticSearch = async (...) => { ... }
export const generateAnswerFromContext = async (...) => { ... }
export const askGraphQuestion = async (...) => { ... }
export const searchPubMed = async (...) => { ... }
export const generatePatientExecutiveSummary = async (...) => { ... }
```

**Component Module Pattern:**
```typescript
// Default export for components
const UploadView: React.FC<UploadViewProps> = (...) => { ... }
export default UploadView;

// OR named export (SearchView.tsx, AnalyticsView.tsx)
export default function SearchView({ consultations, language }: any) { ... }
```

**Barrel Files:**
- Not currently used in this codebase
- Each service file imports directly from specific service modules
- No `index.ts` files for grouping exports

**Python Module Pattern:**
```python
# backend/main.py - FastAPI app with endpoints
from graph_service import (
    add_consultation_to_graph,
    search_knowledge_graph,
    ask_graph_question,
    get_patient_knowledge_graph,
    get_graph_statistics,
    health_check as graph_health_check
)
```

## State Management Patterns

**React State:**
- `useState` for local component state
- `useEffect` for side effects and initialization
- `useRef` for DOM references (e.g., `svgRef` in GraphView)
- `useMemo` for expensive computations (e.g., `allUniquePatients`, `filteredPatientOptions`)
- Props drilling used (no global state library like Redux/Zustand)

**Optimistic UI Pattern:**
```typescript
// From App.tsx handleSave - instant UI update, background save
setConsultations(prev => [toSave, ...prev]);  // Immediate update

// Background saves don't block UI
Promise.all([
    saveConsultationToDisk(toSave),
    vector.length > 0 ? upsertConsultation(toSave, vector) : Promise.resolve()
]).catch(err => console.error("Background save error:", err));
```

**Parallel Processing Pattern:**
```typescript
// From SearchView.tsx - fast phase then slow phase
// 1. Fast Phase: Vector Search & Retrieval (instant UI update)
const vec = await getEmbedding(query);
const ids = searchLocalVectors(vec, consultations);
foundRecords = ids.map(id => consultations.find((c:any) => c.id === id)).filter(Boolean);
setResults(foundRecords);
setIsSearching(false);

// 2. Slow Phase: RAG AI Answer (separate loading state)
if(foundRecords.length > 0) {
    setIsAnswering(true);
    const ans = await generateAnswerFromContext(query, foundRecords, language);
    setAnswer(ans);
    setIsAnswering(false);
}
```

## API Integration Patterns

**Fetch-based API calls:**
- Consistent error handling with try-catch
- Check `response.ok` before parsing JSON
- Return typed objects with sensible defaults

```typescript
// From src/services/graphService.ts
export async function searchKnowledgeGraph(
  query: string,
  limit: number = 10
): Promise<GraphSearchResults> {
  try {
    const response = await fetch(`${backendUrl}/graph/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit })
    });

    if (!response.ok) {
      return { results: [], count: 0, error: `HTTP ${response.status}` };
    }

    return await response.json();
  } catch (error) {
    console.error('Graph search error:', error);
    return { results: [], count: 0, error: String(error) };
  }
}
```

**Endpoint URL construction:**
```typescript
// Backend URL configuration (src/services/backendService.ts)
const BACKEND_URL = '/api';  // Vite proxies to backend

// Path encoding for safety
const url = `${BACKEND_URL}/graph/patient/${encodeURIComponent(patientName)}`;
```

**Request patterns:**
- GET requests for data retrieval
- POST requests with JSON body for mutations
- Proper Content-Type headers
- URL encoding for path parameters

## Environment Configuration

**Required Variables:**
- `GEMINI_API_KEY` or `GLM_API_KEY`: AI model authentication (no default)

**Optional Variables:**
- `AI_MODEL`: 'gemini' or 'glm' (defaults to 'gemini')
- `VITE_BACKEND_URL`: Backend URL (defaults to 'http://127.0.0.1:8000')
- `QDRANT_URL`: Vector database URL (defaults to 'http://localhost:6333')
- `FALKORDB_HOST`: Graph database host (defaults to 'localhost')
- `FALKORDB_PORT`: Graph database port (defaults to '6379')

**Access Pattern:**
```typescript
// Frontend - via process.env injected by Vite
const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const backendUrl = process.env.VITE_BACKEND_URL || env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
const aiModel = process.env.AI_MODEL || env.AI_MODEL || 'gemini';
```

```python
# Backend - via os.getenv()
FALKORDB_HOST = os.getenv("FALKORDB_HOST", "localhost")
FALKORDB_PORT = int(os.getenv("FALKORDB_PORT", "6379"))
```

**Environment detection:**
```typescript
// From vite.config.ts
const env = loadEnv(mode, (process as any).cwd(), '');
```

---

*Convention analysis: 2025-02-06*
