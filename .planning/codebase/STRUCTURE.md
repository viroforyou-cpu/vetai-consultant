# Directory Structure

**Analysis Date:** 2026-01-31

## Root Directory

```
vetai-consultant-latest/
├── index.html              # HTML entry with Tailwind CDN + import maps
├── index.tsx               # Alternative entry point (legacy)
├── App.tsx                 # Alternative App component (legacy, 23KB)
├── types.ts                # Root types file (legacy, 1,619 bytes)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite build config
├── docker-compose.yml      # Docker services (Qdrant, backend)
├── .env                    # Environment variables (gitignored)
├── .gitignore              # Git ignore patterns
├── CLAUDE.md               # Project documentation for Claude Code
├── README.md               # Project readme
└── secrets.env.example     # Example secrets file
```

## src/ Directory (Primary Source)

```
src/
├── index.tsx               # React entry point (14 lines)
├── App.tsx                 # Main app component (281 lines)
├── types.ts                # TypeScript type definitions (69 lines)
├── index.css               # Global styles
├── components/             # React components
│   ├── UploadView.tsx      # Consultation upload form (137 lines)
│   ├── SearchView.tsx      # Semantic search UI (132 lines)
│   ├── GraphView.tsx       # D3.js graph visualization (504 lines)
│   ├── AnalyticsView.tsx   # Analytics dashboard (22 lines)
│   ├── HistoryView.tsx     # Consultation history (69 lines)
│   └── AIModelSelector.tsx # AI model selection (148 lines)
└── services/               # External service integrations
    ├── aiService.ts        # AI service selector (103 lines)
    ├── geminiService.ts    # Google Gemini AI (297 lines)
    ├── glmService.ts       # GLM AI service (347 lines)
    ├── qdrantService.ts    # Vector database (116 lines)
    ├── backendService.ts   # Backend API (47 lines)
    └── graphService.ts     # Graph processing (205 lines)
```

## services/ Directory (Legacy)

```
services/
├── geminiService.ts        # Legacy Gemini service (369 lines)
├── backendService.ts       # Legacy backend service (29 lines)
└── qdrantService.ts        # Legacy Qdrant service (117 lines)
```

**Note**: This directory contains legacy/older versions of services. Current services are in `src/services/`.

## components/ Directory (Legacy)

```
components/
└── (Legacy React components - deprecated)
```

**Note**: Use `src/components/` for current component development.

## backend/ Directory (Optional)

```
backend/
├── main.py                 # FastAPI server entry point
├── requirements.txt        # Python dependencies
└── consultation_data/      # Saved consultation data (runtime)
```

## Subdirectories (Other Projects)

```
vetai-groq/                 # Alternative implementation with Groq AI
vet-groq/                   # Alternative implementation
veterinary-consultation/    # Related project
```

## Naming Conventions

**Files**:
- Components: PascalCase with `.tsx` extension (`UploadView.tsx`)
- Services: camelCase with `.ts` extension (`geminiService.ts`)
- Utilities: lowercase or camelCase

**Directories**:
- Lowercase for source directories (`src/`, `services/`, `components/`)
- kebab-case for feature directories (if any)

## Key File Locations

| Purpose | Location | Size |
|---------|----------|------|
| Main App Component | `src/App.tsx` | 281 lines |
| Entry Point | `src/index.tsx` | 14 lines |
| Type Definitions | `src/types.ts` | 69 lines |
| AI Service Selector | `src/services/aiService.ts` | 103 lines |
| Gemini Integration | `src/services/geminiService.ts` | 297 lines |
| Qdrant Integration | `src/services/qdrantService.ts` | 116 lines |
| Graph Component | `src/components/GraphView.tsx` | 504 lines |

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, metadata |
| `tsconfig.json` | TypeScript compiler configuration |
| `vite.config.ts` | Vite build tool configuration |
| `docker-compose.yml` | Docker services (Qdrant, backend) |
| `.env` | Environment variables (not in git) |
| `.gitignore` | Git ignore patterns |

## Build Artifacts

```
dist/                       # Production build output (generated)
```

---

*Structure analysis: 2026-01-31*
