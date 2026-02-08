# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VetAI Consultant is a veterinary consultation management system powered by AI. It allows veterinarians to record, transcribe, and analyze patient consultations using Google's Gemini AI. The application supports both English and Spanish languages and provides features like semantic search, knowledge graphs, and analytics.

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (frontend on :3000, proxies API to :8000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development (Python FastAPI - Optional)
```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Run backend server directly (port 8000)
python main.py

# Or use the run_app.py wrapper
python run_app.py
```

### Environment Setup
```bash
# Set Gemini API key in .env file
# Only required: API_KEY for Google Gemini AI
echo "API_KEY=your_key_here" > .env
```

## Architecture Overview

### Project Structure
This is a **frontend-focused** React application with an optional Python backend:
- **Frontend**: React + TypeScript + Vite (`/src`, `/services`, `/components`)
- **Backend (Optional)**: FastAPI Python server (`/backend`) for file I/O and graph operations
- **Can Run Frontend-Only**: The app works without Python backend for most features

### Dual Component System
**IMPORTANT**: There are TWO component directories:
- `/src/components/`: **Use this** - Smaller, focused components (current, maintained)
- `/components/`: Legacy, larger monolithic components (deprecated)

Both directories contain similar files, but `/src/components/` should be used for development.

### Frontend (React + TypeScript + Vite)
- **Entry Point**: `index.tsx` → `src/App.tsx` (note: App.tsx exists at both root and `/src`)
- **Main Views**: Upload, Search, Analytics, Graph visualization
- **State Management**: Local React state with optimistic UI updates
- **Styling**: Tailwind CSS via CDN (configured in `index.html`)
- **Build**: Uses Vite with esm.sh import maps for dependencies

### Backend Services (Python - Optional)
- **FastAPI Server**: `backend/main.py` (currently minimal, mostly stub)
- **Dependencies**: FastAPI, uvicorn, FalkorDB, google-genai
- **Endpoints**: `/save_consultation` for file I/O operations
- **Note**: Docker compose references this but Dockerfile may not exist - backend runs via direct Python execution

### Key Services (`/services/`)
These are TypeScript services that handle backend communication:
- **geminiService.ts**: All AI interactions using `@google/genai` SDK
  - Transcription (audio → text)
  - Embedding generation (text → vector, uses `text-embedding-004`)
  - Semantic search (query → relevant consultations)
  - Data extraction (transcription → structured JSON)
- **qdrantService.ts**: Vector database for semantic search
  - **Graceful Degradation**: Falls back to browser-based vector search if Qdrant unavailable
  - Collection: `vet_consultations` with 768-dim cosine vectors
  - Auto-initialization on startup
- **backendService.ts**: File I/O and data persistence
  - Saves consultations to `consultation_data/` directory
  - Loads consultations on app startup
  - **Backend URL**: Auto-detects prod vs dev mode for correct API endpoint

### Data Flow & Architecture Patterns

**Consultation Upload Pipeline**:
1. User fills form + uploads audio/attachments
2. Optimistic UI update (instant feedback)
3. Parallel async processing (non-blocking):
   - Audio transcription via Gemini
   - Structured data extraction (admin + clinical info)
   - Embedding generation for semantic search
4. Background saves (fire-and-forget):
   - Disk storage via backend API
   - Qdrant upsert for vector search
5. Updates state with final results

**Search Pipeline**:
1. User enters search query
2. Query text → embedding via Gemini
3. Vector search against Qdrant (or local fallback)
4. Top results sent to Gemini for AI-generated answer
5. Results displayed with citations

**State Management Pattern**:
- `consultations` array in App.tsx is the single source of truth
- LocalStorage acts as backup/offline cache
- Embeddings stored inline in consultation objects for local search fallback
- No global state management library (useState + useEffect pattern)

### Environment Configuration
- **Required**: `API_KEY` in `.env` for Google Gemini
- **Optional**: `VITE_BACKEND_URL` (defaults to http://127.0.0.1:8000 in dev)
- **Optional**: `QDRANT_URL` (defaults to http://localhost:6333)
- **AI Model Selection**: `AI_MODEL` env var (defaults to 'gemini')

### Type System (types.ts)
Core types:
- `Consultation`: Main data model with id, timestamp, manual inputs, files, AI-generated fields
- `ExtractedInfo`: Structured data with `administrative` and `clinical` sections
- `KnowledgeGraphData`: Graph nodes/links for D3.js visualization
- `ViewState`: Union of 'upload' | 'search' | 'graph' | 'pubmed' | 'analytics'
- `Species`: Enum of animal types
- `Language`: 'en' | 'es'

### Error Handling Strategy
- Qdrant failures → silent fallback to local browser search
- Gemini failures → user-visible error alerts
- Backend failures → alerts with helpful messages (e.g., "Is the Python backend running?")
- Embedding generation failures → logged but doesn't block save
- Network failures → fails fast (no retry logic implemented)

## Important Implementation Details

### Import Maps
The app uses esm.sh CDN imports defined in `index.html`:
- `d3`, `@google/genai`, `react`, `react-dom` loaded from CDN
- This is non-standard - most Vite apps use npm dependencies
- Do not add imports without updating the importmap

### Dark Mode
- Implemented via Tailwind's `darkMode: 'class'` strategy
- Toggle in App.tsx adds/removes 'dark' class on `<html>` element
- All UI components must use `dark:` prefix for dark mode styles

### Backend Detection
The app auto-detects environment:
- Production mode: Backend at same origin (relative path '')
- Development mode: Backend at http://127.0.0.1:8000
- Detection: `window.location.port === '8000'` in backendService.ts

### Storage Locations
- **Consultation data**: `./consultation_data/` (relative to backend cwd)
- **Qdrant vectors**: Docker container or localhost:6333
- **FalkorDB graph**: Docker container (referenced in docker-compose.yml but may not be implemented)

## Development Notes

### When Working on Components
- Use `/src/components/` for new component development
- The `/components/` directory contains legacy code
- Each view is roughly 100-250 lines (manageable size)

### When Working on Services
- Services are plain TypeScript modules, not React components
- They handle external API calls (Gemini, Qdrant, Backend)
- All async functions return Promises with proper error handling
- Check `isQdrantAvailable()` before making Qdrant calls

### When Working on Types
- All types centralized in `types.ts`
- Add new types there rather than inline in components
- Use strict TypeScript - no `any` types unless absolutely necessary

### Common Tasks
- **Add new field to consultation**: Update `Consultation` type in types.ts, update forms in UploadView.tsx
- **Change AI prompt**: Modify prompt templates in geminiService.ts
- **Add new visualization**: Create component in `/src/components/`, import in App.tsx, add to ViewState type
- **Debug embedding issues**: Check browser console for "Qdrant is not reachable" warnings
- **Test without backend**: App works for basic upload/search without Python backend (uses localStorage)
