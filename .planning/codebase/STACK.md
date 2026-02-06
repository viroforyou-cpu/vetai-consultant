# Technology Stack

**Analysis Date:** 2026-02-06

## Languages

**Primary:**
- TypeScript 5.5.3 - `/src`, `/services`, root `.tsx` files
  - Target: ES2022
  - JSX: react-jsx transform
  - Strict mode with path aliases (`@/*`)

**Secondary:**
- Python 3.x - `/backend` (FastAPI server, optional)

## Runtime

**Environment:**
- Node.js (via npm) - Frontend runtime
- Python 3.x - Backend runtime (optional, Docker or direct execution)

**Package Manager:**
- npm - Frontend dependencies
- pip - Backend dependencies (via `/backend/requirements.txt`)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.3.1 - UI framework (`/src/App.tsx`, `/src/components/`)
- Vite 5.3.3 - Build tool and dev server (`vite.config.ts`)
- FastAPI (Python) - Optional backend API server (`/backend/main.py`)

**Testing:**
- Not detected

**Build/Dev:**
- @vitejs/plugin-react 4.3.1 - React plugin for Vite
- esm.sh CDN imports - Non-standard dependency loading via `index.html` import maps

## Key Dependencies

**Critical:**
- @google/genai 0.2.0 - Google Gemini AI SDK for embeddings, transcription, structured data extraction
  - Model: `gemini-2.5-flash` for generation
  - Model: `text-embedding-004` for 768-dimension vectors
- d3 7.9.0 - Data visualization for knowledge graphs (`/src/components/GraphView.tsx`)

**Infrastructure:**
- lucide-react 0.400.0 - Icon library for UI
- tailwindcss 3.4.4 - Utility-first CSS framework (loaded via CDN in `index.html`)
- autoprefixer 10.4.19 - CSS post-processing
- postcss 8.4.38 - CSS transformation

**Python Backend (optional):**
- fastapi - Backend API framework (`/backend/main.py`)
- uvicorn - ASGI server
- pydantic - Data validation
- falkordb - Graph database client
- graphiti-core - Temporal knowledge graph library (`/backend/graph_service.py`)
- google-genai - Python Gemini SDK
- python-dotenv - Environment configuration
- python-multipart - Multipart form data handling
- requests - HTTP client library

## Configuration

**Environment:**
- `.env` file for API keys and configuration
- `AI_MODEL` env var for model selection (defaults to 'glm' or 'gemini')
- `GLM_API_KEY` for Z.ai GLM API (primary AI model)
- `GEMINI_API_KEY` for Google Gemini (optional fallback)
- `VITE_BACKEND_URL` for backend proxy (defaults to `/api` via Vite)
- `QDRANT_URL` for vector database (defaults to `http://localhost:6333`)

**Build:**
- `tsconfig.json` - TypeScript configuration (ES2022 target, JSX, path aliases)
- `vite.config.ts` - Vite build configuration with proxy
- `index.html` - HTML entry point with CDN import maps (non-standard)

## Platform Requirements

**Development:**
- Node.js with npm
- Python 3.x (for optional backend)
- Docker (for FalkorDB and Qdrant services via `docker-compose.yml`)

**Production:**
- Static hosting for frontend (Vite build output in `/dist`)
- Optional: Python backend server (port 8000)
- Optional: Docker for containerized services (FalkorDB on port 6379, Qdrant on port 6333)

---

*Stack analysis: 2026-02-06*
