# External Integrations

**Analysis Date:** 2026-01-31

## AI Services

### Google Gemini AI

**Service**: Text embeddings, transcription, data extraction, semantic search

**Endpoints Used**:
- `models.embedContent` - Text to vector embeddings (text-embedding-004)
- `models.generateContent` - General AI operations
- Audio transcription via `generateContent` with audio input

**API Key**: `GEMINI_API_KEY` (from environment)

**Usage Location**:
- `src/services/geminiService.ts`

**Configuration**:
```typescript
const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

**Graceful Degradation**: None (required for core functionality)

**Rate Limits**: Free tier limitations

### GLM (Alternative AI)

**Service**: Alternative AI model for multi-language support

**Usage Location**:
- `src/services/glmService.ts`

**API Key**: `GLM_API_KEY` (from environment)

**Graceful Degradation**: Falls back to Gemini for some operations

## Data Storage

### Qdrant Vector Database

**Purpose**: Semantic search vector storage

**Connection**:
- URL: `http://localhost:6333` (default)
- Configurable via `QDRANT_URL` env var
- Docker container or hosted service

**Collection**: `vet_consultations`
- Vector size: 768 dimensions
- Distance: Cosine

**Operations**:
- Initialize collection: `PUT /collections/{name}`
- Upsert points: `PUT /collections/{name}/points`
- Search: `POST /collections/{name}/points/search`

**Usage Location**:
- `src/services/qdrantService.ts`

**Graceful Degradation**:
- Falls back to local browser-based vector search
- `searchLocalVectors()` uses cosine similarity in browser
- User warned via console: "Qdrant is not reachable. App will run in 'Local Only' mode."

### LocalStorage (Browser)

**Purpose**: Client-side data persistence

**Storage Keys**:
- `vetai_consultations` - Main consultation data
- Session data for ongoing work

**Usage Location**:
- `src/App.tsx` (save/load functions)
- `src/services/backendService.ts`

**Limitations**:
- ~5MB storage limit
- Will fail with large datasets

## Optional Backend

### FastAPI Backend

**Purpose**: File I/O operations, data persistence

**Endpoints**:
- `POST /save_consultation` - Save consultation to disk

**Connection**:
- Dev: `http://127.0.0.1:8000` (auto-detected)
- Prod: Same origin (relative path)
- Configurable via `VITE_BACKEND_URL` env var

**Usage Location**:
- `src/services/backendService.ts`

**Graceful Degradation**:
- Falls back to LocalStorage
- User alerted: "Is the Python backend running?"

## CDNs

### esm.sh

**Purpose**: Module delivery for dependencies

**Modules Served**:
- `d3` - Data visualization
- `@google/genai` - Google AI SDK
- `react` / `react-dom` - React framework
- `vite` - Build tool

**Usage**: Import maps in `index.html`

### Tailwind CSS CDN

**Purpose**: CSS framework delivery

**URL**: `https://cdn.tailwindcss.com`

**Configuration**: Dark mode via class strategy

### Google Fonts

**Purpose**: Font delivery

**Font**: Inter family
- Weights: 300, 400, 500, 600, 700

## External APIs (Referenced)

### PubMed (Biomedical Literature)

**Purpose**: Scientific literature search

**Status**: Mentioned but not fully implemented

**Usage Location**:
- `src/services/geminiService.ts` - `searchPubMed()` function

**Implementation**: Uses Gemini AI to query PubMed via web search capabilities

---

*Integrations analysis: 2026-01-31*
