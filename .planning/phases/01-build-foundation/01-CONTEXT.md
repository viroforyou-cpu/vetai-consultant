# Phase 1: Build Foundation - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Production-ready Docker container distribution of the VetAI Consultant app. Includes React frontend build optimization, local Supabase self-hosting via Docker Compose, Tailwind CSS setup, and elimination of all console warnings and errors.

**Scope anchor:** Transform from development prototype (CDN-based, localStorage, manual starts) to production Docker distribution (containerized, local Supabase, zero warnings).

**Architecture change from original roadmap:**
- Original: Vercel deployment + hosted Supabase
- New: Docker container distribution + local Supabase self-hosting

</domain>

<decisions>
## Implementation Decisions

### UI Framework
- **Keep React** — Continue with React 18 + TypeScript + Vite, do NOT switch to Streamlit
- All 6 existing React components will be preserved and optimized
- User clarified after initially mentioning Streamlit

### Docker Distribution
- **Single docker-compose.yml** — All services in one compose file for ease of use
- User runs `docker-compose up` and everything works together
- Easiest distribution model for veterinarians to deploy

### Docker Stack Composition
```
docker-compose.yml includes:
├── vetai-app (React frontend, built via Vite, served via nginx)
├── supabase-db (PostgreSQL + pgvector extension)
├── supabase-auth (Supabase Auth service)
├── supabase-storage (Supabase Storage service)
└── supabase-rest (Supabase REST API/gateway)
```

### Supabase Local Setup
- **Official Supabase self-hosted Docker stack** — Use official Supabase Docker images
- Full-featured local Supabase (auth, storage, database, real-time)
- Not a simplified PostgreSQL-only setup

### Tailwind CSS Setup
- **PostCSS + npm** — Install Tailwind as proper PostCSS plugin via npm
- Remove CDN dependency (`<script src="https://cdn.tailwindcss.com">`)
- Standard Vite + PostCSS setup for production builds
- Configuration files needed: `tailwind.config.js`, `postcss.config.js`

### Build Optimization
- **Standard Vite defaults** — Use Vite's out-of-the-box optimization
- No aggressive custom config; Vite defaults are good
- Includes: minification, tree-shaking, code splitting
- Balance of build speed and bundle size

### Warning Tolerance
- **Zero tolerance** — Fix ALL console warnings and errors
- Even warnings from third-party dependencies must be addressed
- No console output should appear when app starts
- This may require suppressing or fixing dependency warnings

### Claude's Discretion
- **Favicon design** — Choose appropriate icon (SVG or ICO) that resolves 404 error
- **Exact Docker image naming** — Tag and version strategy
- **Environment variable structure** — How users configure Supabase connection
- **Volume mounting strategy** — Database persistence across container restarts

</decisions>

<specifics>
## Specific Ideas

- User wants to distribute this app to other veterinarians via Docker
- Single `docker-compose up` command should start everything
- Official Supabase self-hosted stack chosen for feature parity with hosted version
- Tailwind CDN warning must be eliminated (currently appears in console)

</specifics>

<deferred>
## Deferred Ideas

- **Vercel deployment** — Original roadmap had Vercel deployment (Phase 5-6); now Docker distribution takes priority
- **Streamlit UI** — Considered briefly but decided against; keeping React/TypeScript

</deferred>

---

*Phase: 01-build-foundation*
*Context gathered: 2026-02-06*
