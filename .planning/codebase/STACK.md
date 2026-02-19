# Technology Stack

**Analysis Date:** 2025-02-19

## Languages

**Primary:**
- TypeScript 5.5.3 - Frontend React application (`/src`)
  - Target: ES2022
  - JSX: react-jsx transform
  - Strict mode with path aliases (`@/*`)
- JavaScript (ES2022) - Build tooling, browser runtime

**Secondary:**
- Python 3.x - Backend FastAPI server (`/backend/main.py`)
- SQL - Database schema definitions (`/supabase/migrations/`)

## Runtime

**Environment:**
- Node.js 18.x (via Docker `node:18-alpine`)
- Python 3.x (via backend container or local execution)

**Package Manager:**
- npm (Node.js)
- pip (Python)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.3.1 - UI framework
- FastAPI - Python backend web framework
- Vite 5.3.3 - Frontend build tool and dev server

**Testing:**
- Not detected

**Build/Dev:**
- @vitejs/plugin-react 4.3.1 - React plugin for Vite
- TypeScript 5.5.3 - Type checking and compilation
- Tailwind CSS 3.4.4 - Utility-first CSS framework
- PostCSS 8.4.38 - CSS processing
- Autoprefixer 10.4.19 - CSS vendor prefixing
- nginx:alpine - Production web server

## Key Dependencies

**Critical:**
- @google/genai 0.2.0 - Google Gemini AI SDK for transcription, embeddings, and AI features
  - Model: `gemini-2.5-flash` for generation
  - Model: `text-embedding-004` for embeddings
- @supabase/supabase-js 2.95.3 - Supabase client for database and vector search
- d3 7.9.0 - Data visualization for knowledge graphs
- react 18.3.1 / react-dom 18.3.1 - Core React libraries
- lucide-react 0.400.0 - Icon library

**Infrastructure:**
- fastapi - Python web framework for backend API
- uvicorn - ASGI server for Python FastAPI
- pydantic - Data validation for Python models
- falkordb - Graph database client for knowledge graphs
- graphiti-core - Temporal knowledge graph service
- google-generativeai - Alternative Google AI client (Python backend)
- python-dotenv - Environment configuration
- python-multipart - Multipart form data handling
- requests - HTTP client library

**Development:**
- @types/d3 7.4.3 - TypeScript definitions for D3
- @types/node 25.0.0 - TypeScript definitions for Node
- @types/react 18.3.3 - TypeScript definitions for React
- @types/react-dom 18.3.0 - TypeScript definitions for React DOM
- supabase 2.76.8 - Supabase CLI for local development

## Configuration

**Environment:**
- Configured via `.env` file (not committed to git)
- Example configuration: `.env.docker.example`
- Vite environment loading via `loadEnv()` in `vite.config.ts`
- Python backend uses `python-dotenv` for environment loading

**Key configs required:**
- `AI_MODEL` - Model selection: 'gemini' or 'glm' (default: 'gemini')
- `GLM_API_KEY` - ZhipuAI/Z.ai API key for GLM models
- `GEMINI_API_KEY` - Google Gemini API key
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `API_KEY` - Legacy fallback (maps to GLM_API_KEY)
- `VITE_BACKEND_URL` - Optional backend URL override (default: http://127.0.0.1:8000)
- `QDRANT_URL` - Optional Qdrant URL (default: http://localhost:6333)

**Build:**
- `vite.config.ts` - Vite build configuration with React plugin
- `tsconfig.json` - TypeScript compiler configuration (target: ES2022)
- `tailwind.config.js` - Tailwind CSS configuration with dark mode
- `postcss.config.js` - PostCSS configuration for Tailwind/Autoprefixer
- `Dockerfile` - Multi-stage Docker build (Node build -> nginx serve)
- `docker-compose.yml` - Multi-container orchestration
- `nginx.conf` - nginx reverse proxy configuration
- `supabase/config.toml` - Supabase CLI configuration for local development

## Platform Requirements

**Development:**
- Node.js 18+ for frontend development
- Python 3.x for backend (optional - app can run frontend-only)
- Docker & Docker Compose for containerized development
- Supabase CLI (`npx supabase`) for local database

**Production:**
- Container deployment via Docker Compose
- nginx for serving static frontend assets
- External services required: Supabase (or self-hosted), AI provider API

**Deployment options:**
1. Docker Compose (full stack with frontend, backend, Qdrant, FalkorDB)
2. Frontend-only (Vercel/static hosting) with external backend
3. Local development with Vite dev server

---

*Stack analysis: 2025-02-19*
