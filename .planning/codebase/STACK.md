# Technology Stack

**Analysis Date:** 2026-01-31

## Languages

- **TypeScript**: Primary language for frontend
  - Version: 5.5.3
  - Strict mode enabled
  - Target: ES2020
  - Used for: All React components, services, utilities

- **JavaScript**: Used via React/TypeScript compilation
  - ES2020 features available
  - JSX for React components

- **Python**: Backend (optional)
  - Used for FastAPI server in `/backend/`
  - Minimal implementation

## Runtime

- **Node.js**: JavaScript runtime
  - Required for development server (Vite)
  - Required for build process

- **Browser**: Runtime environment
  - Modern browser with ES2020 support
  - LocalStorage for data persistence
  - Canvas API for graph visualization

## Frameworks

### Frontend

- **React 18.3.1**: UI framework
  - Function components with hooks
  - Strict mode enabled
  - No class components used

- **Vite 5.3.3**: Build tool and dev server
  - Fast HMR (Hot Module Replacement)
  - ESBuild for compilation
  - Import maps for CDN dependencies

- **Tailwind CSS 3.4.4**: Styling framework
  - Loaded via CDN (not npm)
  - Dark mode: 'class' strategy
  - Inter font family

### Backend (Optional)

- **FastAPI**: Python web framework
  - Minimal implementation
  - CORS middleware enabled
  - File upload handling

## Key Dependencies

### UI Components

- **D3.js 7.9.0**: Data visualization
  - Graph rendering (force-directed graphs)
  - SVG manipulation

- **Lucide React 0.400.0**: Icon library
  - Modern icon components
  - Tree-shakeable

### AI/ML

- **@google/genai 0.2.0**: Google Gemini AI SDK
  - Audio transcription
  - Text embeddings (text-embedding-004)
  - Structured data extraction
  - Semantic search

- **GLM Support**: Alternative AI model
  - GLMService.ts for Chinese/other language support
  - Service selector pattern in aiService.ts

### Data/Storage

- **Qdrant**: Vector database (via Docker)
  - Local: http://localhost:6333
  - Collection: vet_consultations
  - Vector size: 768 (Cosine distance)
  - Graceful fallback to local browser search

### Development Tools

- **TypeScript 5.5.3**: Type checking
  - Strict mode enabled
  - No emit (Vite handles this)

- **@vitejs/plugin-react 4.3.1**: Vite React plugin
  - JSX/TSX transformation
  - Fast refresh

- **PostCSS 8.4.38 + Autoprefixer 10.4.19**: CSS processing
  - Tailwind CSS integration

## Configuration

### Environment Variables

```
API_KEY=<gemini-api-key>           # Required: Google Gemini API key
AI_MODEL=gemini|glm                 # Optional: AI model selector
QDRANT_URL=http://localhost:6333   # Optional: Qdrant endpoint
VITE_BACKEND_URL=http://127.0.0.1:8000  # Optional: Backend URL
```

### TypeScript Config

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "moduleResolution": "node"
  }
}
```

### Vite Config

**File**: `vite.config.ts`

- React plugin enabled
- Dev server proxy: `/api` → backend

### Import Maps

**File**: `index.html`

Non-standard: Uses esm.sh CDN imports
- `d3`: https://esm.sh/d3@^7.9.0
- `@google/genai`: https://esm.sh/@google/genai@^1.33.0
- `react`: https://esm.sh/react@^19.2.1

## Development Scripts

```bash
npm run dev     # Start dev server (port 5173, proxies API to :8000)
npm run build   # TypeScript check + Vite build
npm run preview # Preview production build
```

## Build Artifacts

- **Output**: `dist/` directory
- **Entry**: `index.html` → `src/index.tsx` → `src/App.tsx`
- **Bundle**: Vite handles bundling with esm.sh imports

---

*Stack analysis: 2026-01-31*
