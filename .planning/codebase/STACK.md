# Technology Stack

**Analysis Date:** 2026-01-29

## Languages

**Primary:**
- TypeScript 5.5.3 - Frontend application code
- JavaScript ES2022 - Browser runtime, React components

**Secondary:**
- Python 3 - Backend services (minimal FastAPI implementation)

## Runtime

**Environment:**
- Browser runtime (Chrome, Firefox, Safari)
- Node.js 18+ (ESNext modules)

**Package Manager:**
- npm 9+ - JavaScript dependencies
- pip - Python dependencies

## Frameworks

**Core:**
- React 18.3.1 - UI framework
- Vite 5.3.3 - Build tool and development server
- TypeScript 5.5.3 - Type checking and compilation

**Testing:**
- No testing framework detected

**Build/Dev:**
- Tailwind CSS 3.4.4 - Utility-first CSS framework
- PostCSS 8.4.38 - CSS transformation tool
- Autoprefixer 10.4.19 - CSS vendor prefixing
- @vitejs/plugin-react 4.3.1 - React plugin for Vite

## Key Dependencies

**Critical:**
- @google/genai 0.2.0 - Google Gemini AI SDK for all AI operations
- d3 7.9.0 - Data visualization for knowledge graphs
- react-dom 18.3.1 - React DOM rendering
- lucide-react 0.400.0 - Icon library

**Infrastructure:**
- FastAPI (Python) - Backend server (minimal implementation)
- FalkorDB - Graph database (referenced in Docker)
- Qdrant - Vector database for semantic search (optional, with local fallback)

## Configuration

**Environment:**
- Environment variables: API_KEY (required), VITE_BACKEND_URL (optional), QDRANT_URL (optional)
- Configuration in vite.config.ts for proxy settings
- Import maps in index.html for CDN-based dependencies

**Build:**
- Vite configuration with proxy for backend API
- TypeScript configuration with ES2022 target
- Tailwind CSS with dark mode support

## Platform Requirements

**Development:**
- Node.js 18+
- npm 9+
- Python 3.10+ (optional backend)

**Production:**
- Node.js runtime (if using npm build)
- Web server for static files
- Optional: Python FastAPI server for file I/O operations

---

*Stack analysis: 2026-01-29*
```