# Codebase Structure

**Analysis Date:** 2024-12-12

## Directory Layout

```
vetai-consultant-latest/
├── src/                    # Main source code
│   ├── components/        # React view components (current)
│   │   ├── UploadView.tsx
│   │   ├── SearchView.tsx
│   │   ├── GraphView.tsx
│   │   ├── AnalyticsView.tsx
│   │   ├── HistoryView.tsx
│   │   └── AIModelSelector.tsx
│   ├── services/          # Service layer
│   │   ├── geminiService.ts
│   │   ├── qdrantService.ts
│   │   └── backendService.ts
│   ├── App.tsx           # Main application component
│   ├── index.tsx         # React entry point
│   ├── index.css         # Global styles
│   └── types.ts          # TypeScript type definitions
├── components/            # Legacy components (deprecated)
├── backend/              # Optional Python backend (minimal)
├── services/             # Legacy services (deprecated)
├── env/                  # Python virtual environment
├── dist/                 # Vite build output
├── consultation_data/    # Runtime data storage
└── node_modules/         # npm dependencies
```

## Directory Purposes

**src/components/:**
- Purpose: Current React view components and UI components
- Contains: Main application views (Upload, Search, Graph, Analytics, History)
- Key files: `UploadView.tsx`, `SearchView.tsx`, `GraphView.tsx`, `AnalyticsView.tsx`
- Note: Legacy `/components/` directory exists but should not be used

**src/services/:**
- Purpose: Business logic and external API integrations
- Contains: AI services, vector DB service, backend communication
- Key files: `geminiService.ts`, `qdrantService.ts`, `backendService.ts`
- Pattern: Plain TypeScript modules returning Promises

**src/App.tsx:**
- Purpose: Application router and state management
- Contains: View routing, consultation state, navigation logic
- Key responsibilities: Single source of truth for consultations

**src/types.ts:**
- Purpose: Centralized type definitions
- Contains: Consultation, ExtractedInfo, ViewState, and other core types
- Usage: Shared across all components and services

**backend/:**
- Purpose: Optional Python backend for file I/O
- Contains: Minimal FastAPI server stub
- Note: Currently minimal, most functionality handled by frontend

## Key File Locations

**Entry Points:**
- `src/index.tsx`: React application entry point
- `src/App.tsx`: Main application component with routing
- `package.json`: Frontend dependencies and scripts

**Core Logic:**
- `src/types.ts`: Type definitions for entire application
- `src/services/geminiService.ts`: All AI interactions
- `src/services/qdrantService.ts`: Vector database operations
- `src/services/backendService.ts`: Backend API communication

**Views:**
- `src/components/UploadView.tsx`: New consultation form
- `src/components/SearchView.tsx`: Search interface
- `src/components/GraphView.tsx`: Patient graph visualization
- `src/components/AnalyticsView.tsx`: Analytics dashboard
- `src/components/HistoryView.tsx`: Consultation history

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `UploadView.tsx`)
- Services: camelCase (e.g., `geminiService.ts`)
- Types: PascalCase (e.g., `Consultation.tsx` - centralized in types.ts)

**Variables:**
- React state: camelCase (e.g., `consultations`, `isProcessing`)
- Functions: camelCase (e.g., `handleSave`, `transcribeAndSummarize`)
- Interfaces: PascalCase (e.g., `UploadViewProps`)

**Constants:**
- Environment variables: UPPERCASE (e.g., `QDRANT_URL`)
- Collection names: UPPER_SNAKE_CASE (e.g., `COLLECTION_NAME`)

## Where to Add New Code

**New View:**
- Implementation: `src/components/[Name]View.tsx`
- Add to `src/App.tsx` in view routing
- Add to ViewState type in `src/types.ts`
- Add navigation button in `App.tsx`

**New Service:**
- Implementation: `src/services/[service]Service.ts`
- Export functions from service file
- Import in components as needed
- Add error handling following existing patterns

**New Data Type:**
- Implementation: Add to `src/types.ts`
- Update existing interfaces as needed
- Include in serialization/deserialization logic

**New AI Feature:**
- Implementation: Add to `src/services/geminiService.ts`
- Follow existing async patterns
- Include proper error handling and language support

## Special Directories

**src/components/:**
- Purpose: Active development components
- Generated: No
- Committed: Yes

**components/:**
- Purpose: Legacy components
- Generated: No
- Committed: Yes
- Note: Deprecated, use `/src/components/` instead

**backend/:**
- Purpose: Optional Python backend
- Generated: No
- Committed: Yes
- Note: Currently minimal stub

**consultation_data/:**
- Purpose: Runtime data storage
- Generated: Yes (by backend)
- Committed: No (should be in .gitignore)

**dist/:**
- Purpose: Vite build output
- Generated: Yes (by Vite build)
- Committed: No (should be in .gitignore)

---

*Structure analysis: 2024-12-12*