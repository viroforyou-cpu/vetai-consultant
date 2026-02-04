# VetAI Consultant - Production Ready

## What This Is

A veterinary consultation management system powered by GLM 4.7 AI. Enables veterinarians to record patient consultations, automatically generate transcriptions and summaries, search semantically through records, and visualize patient knowledge graphs. Runs locally on Debian for development and deploys to Vercel for production access.

## Core Value

Veterinarians can record, transcribe, search, and analyze patient consultations using AI with data accessible from anywhere.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ **Frontend UI** — React views (Upload, Search, Analytics, Graph) with dark mode — existing
- ✓ **AI Service Abstraction** — Support for multiple AI models (Gemini/GLM) — existing
- ✓ **Semantic Search** — Local fallback when vector DB unavailable — existing
- ✓ **Knowledge Graph** — D3.js force-directed visualization with mock data fallback — existing
- ✓ **Analytics Dashboard** — Basic statistics display — existing
- ✓ **Mock Data** — Built-in test data loading — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] **GLM-01**: GLM 4.7 (ZhipuAI) API integration properly configured with working endpoint
- [ ] **SUPA-01**: Supabase PostgreSQL database configured for consultations storage
- [ ] **SUPA-02**: Supabase Auth configured for single-user access
- [ ] **SUPA-03**: Supabase Storage configured for audio file uploads
- [ ] **DEPLOY-01**: GitHub repository created and properly structured
- [ ] **DEPLOY-02**: Vercel deployment configured with environment variables
- [ ] **DEPLOY-03**: Local development on Debian works with hot-reload
- [ ] **FIX-01**: Resolve critical GLM API connection issues
- [ ] **FIX-02**: Resolve favicon and build warnings
- [ ] **BUILD-01**: Production build optimized for Vercel

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- **Multi-user authentication** — Personal use for single veterinarian practice
- **Payment processing** — Not a commercial SaaS product
- **Mobile applications** — Web-only, responsive design sufficient
- **Real-time collaboration** — Single-user workflow
- **Python backend deployment** — Moving to serverless architecture (Vercel Functions + Supabase)
- **Qdrant vector database** — Using Supabase pgvector or external API instead

## Context

**Technical Environment:**
- Development: Debian Linux with Node.js/npm
- Frontend: React 18, TypeScript, Vite 5, Tailwind CSS
- AI Provider: ZhipuAI GLM 4.7 (BigModel platform)
- Database: Supabase (PostgreSQL + pgvector + Auth + Storage)
- Deployment: Vercel (frontend) + Supabase (backend)

**Current State:**
- Codebase has working frontend with all views
- GLM service exists but needs proper ZhipuAI endpoint configuration
- Local development uses localStorage; needs migration to Supabase
- Some console warnings (favicon, Tailwind CDN, API 404s)
- Git repo initialized but not pushed to GitHub

**Known Issues from Testing:**
- Qdrant unreachable (expected, using Supabase instead)
- Backend API 404 errors (transitioning to serverless)
- Favicon missing
- Tailwind CDN warning (use local build for production)
- Embedding API errors (GLM endpoint configuration needed)

## Constraints

- **Platform**: Development must work on Debian Linux
- **Deployment**: Frontend on Vercel, data on Supabase
- **Architecture**: Serverless (no deployed Python backend)
- **Budget**: Prefer free tiers for personal use (Supabase free, Vercel hobby)
- **AI**: Must use GLM 4.7 via ZhipuAI API (user has credentials)
- **Timeline**: Production-ready as soon as possible
- **Access**: Single-user (personal veterinary practice)

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Supabase over Qdrant | Built-in auth, storage, PostgreSQL + pgvector in one free tier | — Pending |
| Serverless over Python backend | Simpler deployment, no server management, Vercel native | — Pending |
| Single-user auth | Personal use case, simpler implementation | — Pending |
| GLM over Gemini | User has ZhipuAI credentials and prefers GLM 4.7 | — Pending |

---
*Last updated: 2025-02-04 after project initialization*
