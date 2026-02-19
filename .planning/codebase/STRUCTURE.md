# Codebase Structure

**Analysis Date:** 2026-02-19

## Directory Layout

```
vetai-consultant-latest/
├── backend/               # Optional Python FastAPI backend
│   ├── consultation_data/ # Persistent JSON storage
│   ├── __pycache__/       # Python bytecode
│   ├── main.py            # FastAPI server entry point
│   └── requirements.txt   # Python dependencies
├── components/            # Legacy components (deprecated - use src/components/)
├── dist/                  # Vite build output
├── env/                   # Python virtual environment
├── node_modules/          # npm dependencies
├── public/                # Static assets
├── services/              # Legacy services (deprecated - use src/services/)
├── src/                   # Main application source (USE THIS)
│   ├── components/        # React view components
│   ├── services/          # TypeScript service layer
│   ├── App.tsx            # Main application component
│   ├── index.css          # Custom styles
│   ├── index.tsx          # React entry point
│   ├── translations.ts    # Bilingual support (en/es)
│   └── types.ts           # TypeScript type definitions
├── supabase/              # Supabase configuration
│   └── migrations/        # Database migration scripts
├── .planning/             # Project planning documents
│   └── codebase/          # This analysis
├── vetai-groq/            # Related project directory
├── vet-groq/              # Related project directory
├── veterinary-consultation/ # Related project directory
├── .git/                  # Git repository metadata
├── .gitignore             # Git ignore rules
├── docker-compose.yml     # Docker orchestration
├── index.html             # HTML shell with Tailwind CDN
├── index.tsx              # Root React entry (legacy)
├── package.json           # npm dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── types.ts               # Legacy types (use src/types.ts)
├── vite.config.ts         # Vite build configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── vercel.json            # Vercel deployment configuration
```

## Directory Purposes

**`/src/`:**
- Purpose: Main application source code - primary development location
- Contains: React components, services, types, translations, styling
- Key files: `App.tsx` (main component), `types.ts` (type definitions), `translations.ts` (i18n), `index.tsx` (React bootstrap)

**`/src/components/`:**
- Purpose: React view components for each feature
- Contains: `UploadView.tsx`, `SearchView.tsx`, `GraphView.tsx`, `AnalyticsView.tsx`, `HistoryView.tsx`, `AppointmentView.tsx`, `AIModelSelector.tsx`
- Key files: All view components (100-500+ lines each)

**`/src/services/`:**
- Purpose: Business logic and external API integration
- Contains: AI providers, vector search, backend communication, graph operations, Supabase client
- Key files: `aiService.ts` (AI router), `geminiService.ts`, `glmService.ts`, `qdrantService.ts`, `backendService.ts`, `graphService.ts`, `supabaseService.ts`

**`/backend/`:**
- Purpose: Optional Python FastAPI server for file I/O and graph operations
- Contains: FastAPI endpoints, Graphiti integration, FalkorDB client, consultation storage
- Key files: `main.py` (FastAPI app), `requirements.txt`, `consultation_data/` (JSON files)

**`/components/`:**
- Purpose: Legacy component directory - deprecated, do not use for new development
- Contains: Older versions of view components
- Key files: `UploadView.tsx`, `SearchView.tsx`, `GraphView.tsx`, `AnalyticsView.tsx`

**`/services/`:**
- Purpose: Legacy service directory - deprecated, do not use for new development
- Contains: Older versions of services

**`/backend/consultation_data/`:**
- Purpose: Persistent JSON file storage for consultations
- Contains: Individual JSON files per consultation (named by consultation ID)
- Generated: Yes, by backend `/save_consultation` endpoint
- Committed: No

**`/supabase/`:**
- Purpose: Supabase database configuration and migrations
- Contains: Migration SQL scripts for database schema
- Generated: Yes, by Supabase CLI
- Committed: Yes

**`/.planning/`:**
- Purpose: Project planning and documentation
- Contains: Roadmap, research, phase plans, codebase analysis (this directory)
- Generated: Yes, by `/gsd:*` commands
- Committed: Yes

**`/dist/`:**
- Purpose: Vite production build output
- Generated: Yes, by `npm run build`
- Committed: Yes (though typically gitignored in most projects)

## Key File Locations

**Entry Points:**
- `/src/index.tsx`: Current React entry point (mounts App.tsx from src/)
- `/index.tsx`: Legacy React entry point (mounts root App.tsx from root directory)
- `/index.html`: HTML shell with Tailwind CSS CDN import
- `/src/App.tsx`: Main application component with state management
- `/backend/main.py`: FastAPI server entry point (optional)

**Configuration:**
- `/.env`: Environment variables (API keys, backend URLs) - not committed
- `/secrets.env.example`: API key template
- `/vite.config.ts`: Vite build configuration with API proxy
- `/tsconfig.json`: TypeScript compiler configuration
- `/tailwind.config.js`: Tailwind CSS configuration
- `/postcss.config.js`: PostCSS configuration for Tailwind
- `/package.json`: npm dependencies and scripts
- `/docker-compose.yml`: Docker orchestration for backend and FalkorDB
- `/backend/requirements.txt`: Python dependencies
- `/vercel.json`: Vercel deployment configuration

**Core Logic:**
- `/src/types.ts`: Centralized TypeScript type definitions
- `/src/translations.ts`: Bilingual translation dictionaries (en/es)
- `/src/services/aiService.ts`: AI provider router (Gemini/GLM selection)
- `/src/services/geminiService.ts`: Google Gemini AI integration
- `/src/services/glmService.ts`: GLM AI integration
- `/src/services/qdrantService.ts`: Vector database with local fallback
- `/src/services/backendService.ts`: Backend API communication
- `/src/services/graphService.ts`: Graphiti knowledge graph client
- `/src/services/supabaseService.ts`: Supabase database client

**Testing:**
- No test framework currently configured for frontend
- Backend tests would go in `/backend/test_*.py` (not currently present)

## Naming Conventions

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `UploadView.tsx`, `SearchView.tsx`, `AppointmentView.tsx`)
- Services: camelCase with `.ts` extension (e.g., `geminiService.ts`, `qdrantService.ts`, `supabaseService.ts`)
- Types: PascalCase filename with `.ts` extension (e.g., `types.ts`)
- Python modules: snake_case with `.py` extension (e.g., `main.py`)
- Config: kebab-case or dot notation (e.g., `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`)

**Directories:**
- All lowercase with underscores for multi-word names (e.g., `/consultation_data/`, `/supabase/`, `/node_modules/`)
- Exception: `/src/` (standard convention)

**Functions/Variables (TypeScript):**
- camelCase (e.g., `getEmbedding`, `saveConsultationToDisk`, `patientName`, `isQdrantAvailable`)

**Functions/Variables (Python):**
- snake_case (e.g., `add_consultation_to_graph`, `get_graph_connection`, `check_rate_limit`)

**Types/Interfaces (TypeScript):**
- PascalCase (e.g., `Consultation`, `ExtractedInfo`, `KnowledgeGraphData`, `SupabaseError`)

**Constants:**
- SCREAMING_SNAKE_CASE for environment variables and config (e.g., `QDRANT_URL`, `AI_MODEL`, `COLLECTION_NAME`)

**React Components:**
- PascalCase for component names (e.g., `UploadView`, `SearchView`, `AIModelSelector`)

## Where to Add New Code

**New Feature (with UI):**
- Primary code: `/src/components/[FeatureName]View.tsx`
- Add view type to `/src/types.ts`: `export type ViewState = 'upload' | 'search' | ... | '[featurename]'`
- Add navigation button in `/src/App.tsx` NavButton section
- Add translations to `/src/translations.ts` for both en and es
- Tests: No test framework currently configured

**New Feature (service only):**
- Implementation: `/src/services/[featureName]Service.ts`
- Export functions and import in components that use them

**New AI Provider:**
- Implementation: `/src/services/[providerName]Service.ts`
- Add router logic to `/src/services/aiService.ts` (follow existing pattern)
- Add model type to `/src/types.ts`: `export type AIModel = 'gemini' | 'glm' | '[providerName]'`

**New Backend Endpoint:**
- Implementation: `/backend/main.py` (add new route handler with Pydantic model)
- Frontend client: Add function to `/src/services/backendService.ts`
- TypeScript types: Add to `/src/types.ts` if needed

**New Database Table (Supabase):**
- Migration script: `/supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- TypeScript types: Add to `/src/types.ts`
- Service functions: Add to `/src/services/supabaseService.ts`

**New Types:**
- Implementation: `/src/types.ts` (centralized type definitions)
- Export and import in components/services as needed

**Utilities:**
- Shared helpers: `/src/services/utils.ts` (if creating new utility file)
- Currently no separate utilities directory - services serve this purpose

**New Translations:**
- Implementation: `/src/translations.ts`
- Add keys to both `translations.en` and `translations.es` objects
- Use in components via `useTranslations(language)` hook

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

**`/public/`:**
- Purpose: Static assets served directly
- Generated: No
- Committed: Yes

**Legacy Directories (DO NOT USE FOR NEW CODE):**
- `/components/` - Use `/src/components/` instead
- `/services/` - Use `/src/services/` instead

---

*Structure analysis: 2026-02-19*
