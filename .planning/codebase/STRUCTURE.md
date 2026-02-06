# Codebase Structure

**Analysis Date:** 2025-02-06

## Directory Layout

```
vetai-consultant-latest/
├── backend/               # Optional Python FastAPI backend
│   ├── consultation_data/ # Persistent JSON storage
│   ├── __pycache__/       # Python bytecode
│   ├── graph_service.py   # Graphiti knowledge graph integration
│   ├── main.py            # FastAPI server entry point
│   ├── requirements.txt   # Python dependencies
│   └── test_graph.py      # Graph service tests
├── components/            # Legacy components (deprecated)
├── dist/                  # Vite build output
├── env/                   # Python virtual environment
├── node_modules/          # npm dependencies
├── services/              # Legacy services (deprecated)
├── src/                   # Main application source (use this)
│   ├── components/        # React view components
│   ├── services/          # TypeScript service layer
│   ├── App.tsx            # Main application component
│   ├── index.css          # Custom styles
│   ├── index.tsx          # React entry point
│   └── types.ts           # TypeScript type definitions
├── .planning/             # Project planning documents
├── vet-groq/              # Related project directory
├── vetai-groq/            # Related project directory
├── veterinary-consultation/ # Related project directory
├── .env                   # Environment variables (not committed)
├── .gitignore             # Git ignore rules
├── docker-compose.yml     # Docker orchestration
├── index.html             # HTML shell with import maps
├── index.tsx              # Root React entry (legacy)
├── metadata.json          # Project metadata
├── package.json           # npm dependencies
├── run_app.py             # Python backend wrapper
├── secrets.env            # API keys (not committed)
├── secrets.env.example    # API key template
├── tsconfig.json          # TypeScript configuration
├── types.ts               # Legacy types (use src/types.ts)
└── vite.config.ts         # Vite build configuration
```

## Directory Purposes

**`/src/`:**
- Purpose: Main application source code - use this for development
- Contains: React components, services, types, styling
- Key files: `App.tsx` (main component), `types.ts` (type definitions), `index.tsx` (React bootstrap)

**`/src/components/`:**
- Purpose: React view components for each feature
- Contains: `UploadView.tsx`, `SearchView.tsx`, `GraphView.tsx`, `AnalyticsView.tsx`, `HistoryView.tsx`, `AIModelSelector.tsx`
- Key files: All view components (100-500+ lines each)

**`/src/services/`:**
- Purpose: Business logic and external API integration
- Contains: AI providers, vector search, backend communication, graph operations
- Key files: `aiService.ts` (AI router), `geminiService.ts`, `glmService.ts`, `qdrantService.ts`, `backendService.ts`, `graphService.ts`

**`/backend/`:**
- Purpose: Optional Python FastAPI server for file I/O and graph operations
- Contains: FastAPI endpoints, Graphiti integration, FalkorDB client
- Key files: `main.py` (FastAPI app), `graph_service.py` (knowledge graph), `requirements.txt`

**`/components/`:**
- Purpose: Legacy component directory - deprecated, do not use
- Contains: Older versions of view components
- Key files: `UploadView.tsx`, `SearchView.tsx`, `GraphView.tsx`, `AnalyticsView.tsx`

**`/services/`:**
- Purpose: Legacy service directory - deprecated, do not use
- Contains: Older versions of services
- Key files: `geminiService.ts`, `backendService.ts`, `qdrantService.ts`

**`/backend/consultation_data/`:**
- Purpose: Persistent JSON file storage for consultations
- Contains: Individual JSON files per consultation
- Generated: Yes, by backend `/save_consultation` endpoint
- Committed: No

**`/.planning/`:**
- Purpose: Project planning and documentation
- Contains: Roadmap, research, phase plans, codebase analysis
- Generated: Yes, by `/gsd:*` commands
- Committed: Yes

## Key File Locations

**Entry Points:**
- `/src/index.tsx`: Current React entry point (mounts App.tsx from src/)
- `/index.tsx`: Legacy React entry point (mounts root App.tsx from root directory)
- `/index.html`: HTML shell with CDN imports and Tailwind CSS
- `/src/App.tsx`: Main application component with state management
- `/backend/main.py`: FastAPI server entry point (optional)

**Configuration:**
- `/.env`: Environment variables (API keys, backend URLs) - not committed
- `/secrets.env`: API keys - not committed
- `/vite.config.ts`: Vite build configuration with API proxy
- `/tsconfig.json`: TypeScript compiler configuration
- `/package.json`: npm dependencies and scripts
- `/docker-compose.yml`: Docker orchestration for backend and FalkorDB
- `/backend/requirements.txt`: Python dependencies

**Core Logic:**
- `/src/types.ts`: Centralized TypeScript type definitions
- `/src/services/aiService.ts`: AI provider router (Gemini/GLM selection)
- `/src/services/geminiService.ts`: Google Gemini AI integration
- `/src/services/glmService.ts`: GLM AI integration
- `/src/services/qdrantService.ts`: Vector database with local fallback
- `/src/services/backendService.ts`: Backend API communication
- `/src/services/graphService.ts`: Graphiti knowledge graph client

**Testing:**
- `/backend/test_graph.py`: Graph service unit tests

## Naming Conventions

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `UploadView.tsx`, `SearchView.tsx`)
- Services: camelCase with `.ts` extension (e.g., `geminiService.ts`, `qdrantService.ts`)
- Types/Types: PascalCase with `.ts` extension (e.g., `types.ts`)
- Python modules: snake_case with `.py` extension (e.g., `graph_service.py`, `main.py`)

**Directories:**
- All lowercase with underscores for multi-word names (e.g., `/consultation_data/`)
- Exception: `/src/` (standard convention)

**Functions/Variables:**
- TypeScript/JavaScript: camelCase (e.g., `getEmbedding`, `saveConsultationToDisk`, `patientName`)
- Python: snake_case (e.g., `add_consultation_to_graph`, `get_graph_connection`)

**Types/Interfaces:**
- PascalCase (e.g., `Consultation`, `ExtractedInfo`, `KnowledgeGraphData`)

**Constants:**
- SCREAMING_SNAKE_CASE for environment variables and config (e.g., `QDRANT_URL`, `AI_MODEL`)

## Where to Add New Code

**New Feature (with UI):**
- Primary code: `/src/components/[FeatureName]View.tsx`
- Add view type to `/src/types.ts`: `export type ViewState = 'upload' | 'search' | ... | 'featurename'`
- Add navigation button in `/src/App.tsx` NavButton section
- Tests: No test framework currently configured

**New Feature (service only):**
- Implementation: `/src/services/[featureName]Service.ts`
- Export from service and import in components that use it

**New AI Provider:**
- Implementation: `/src/services/[providerName]Service.ts`
- Add router logic to `/src/services/aiService.ts`
- Add model type to `/src/types.ts`: `export type AIModel = 'gemini' | 'glm' | '[providerName]'`

**New Backend Endpoint:**
- Implementation: `/backend/main.py` (add new route handler)
- Frontend client: Add function to `/src/services/backendService.ts`
- TypeScript types: Add to `/src/types.ts` if needed

**New Types:**
- Implementation: `/src/types.ts` (centralized type definitions)
- Export and import in components/services as needed

**Utilities:**
- Shared helpers: `/src/services/` (e.g., `utils.ts` if created)
- Currently no separate utilities directory

## Special Directories

**`/dist/`:**
- Purpose: Vite production build output
- Generated: Yes, by `npm run build`
- Committed: Yes (though typically `.gitignore`d in most projects)

**`/node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes, by `npm install`
- Committed: No (in `.gitignore`)

**`/env/`:**
- Purpose: Python virtual environment
- Generated: Yes, by Python venv
- Committed: No (in `.gitignore`)

**`/__pycache__/`:**
- Purpose: Python bytecode cache
- Generated: Yes, by Python interpreter
- Committed: No (in `.gitignore`)

**`/.git/`:**
- Purpose: Git repository metadata
- Generated: Yes, by git init
- Committed: N/A (repository itself)

---

*Structure analysis: 2025-02-06*
