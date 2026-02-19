# Requirements: VetAI Consultant - Production Ready

**Defined:** 2025-02-04
**Core Value:** Veterinarians can record, transcribe, search, and analyze patient consultations using AI with data accessible from anywhere.

## v1 Requirements

### GLM Integration

- [ ] **GLM-01**: Configure ZhipuAI API endpoint for GLM 4.7 chat completions
- [ ] **GLM-02**: Implement chat completions for consultation transcript analysis
- [ ] **GLM-03**: Implement embedding generation using GLM embedding-3 model
- [ ] **GLM-04**: Add rate limiting with exponential backoff for 429 errors
- [ ] **GLM-05**: Add robust error handling with retry logic and user-friendly error messages

### Supabase Integration

- [ ] **SUPA-01**: Set up Supabase project with PostgreSQL database
- [ ] **SUPA-02**: Enable pgvector extension and create consultations table
- [ ] **SUPA-03**: Add embedding column (VECTOR(1536)) to consultations table
- [ ] **SUPA-04**: Create HNSW vector similarity search index on embeddings
- [ ] **SUPA-05**: Create consultation_audio storage bucket in Supabase
- [ ] **SUPA-06**: Implement audio file upload to Supabase Storage
- [ ] **SUPA-07**: Create storage service abstraction layer (Supabase primary, localStorage fallback)
- [ ] **SUPA-08**: Implement one-time migration script from localStorage to Supabase

### Vercel Deployment

- [ ] **DEPLOY-01**: Create GitHub repository and structure code properly
- [ ] **DEPLOY-02**: Push code to GitHub repository
- [ ] **DEPLOY-03**: Connect GitHub repository to Vercel
- [ ] **DEPLOY-04**: Configure environment variables in Vercel dashboard (ZHIPU_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] **DEPLOY-05**: Configure Vercel project settings (build command, output directory)
- [ ] **DEPLOY-06**: Deploy to production and verify all core features work
- [ ] **DEPLOY-07**: Configure Supabase CORS to allow Vercel domain

### Build Configuration

- [ ] **BUILD-01**: Install Tailwind CSS and PostCSS dependencies
- [ ] **BUILD-02**: Create tailwind.config.js with content paths
- [ ] **BUILD-03**: Create postcss.config.js with Tailwind plugin
- [ ] **BUILD-04**: Create src/index.css with Tailwind directives
- [ ] **BUILD-05**: Update index.html to remove Tailwind CDN and add local CSS
- [ ] **BUILD-06**: Create favicon.ico and add to index.html
- [ ] **BUILD-07**: Update vite.config.ts with Vercel-optimized settings
- [ ] **BUILD-08**: Fix console errors (backend API 404s, favicon 404)

## v2 Requirements

Deferred to future release.

### Authentication
- **AUTH-01**: Implement Supabase magic link authentication
- **AUTH-02**: Add login/logout UI components
- **AUTH-03**: Configure protected routes and data access

### Advanced Features
- **ADV-01**: Implement real-time subscription for multi-device sync
- **ADV-02**: Add offline support with service workers
- **ADV-03**: Implement data export/backup functionality

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user authentication | Personal use for single veterinarian practice |
| Payment processing | Not a commercial SaaS product |
| Mobile applications | Web-only, responsive design sufficient |
| Python backend deployment | Using serverless architecture (Vercel + Supabase) |
| Qdrant vector database | Replacing with Supabase pgvector |

## Traceability

Requirements mapped to phases in ROADMAP.md

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUILD-01 through BUILD-08 | Phase 1.1 | Pending |
| GLM-01 through GLM-05 | Phase 2.1 | Pending |
| SUPA-01 through SUPA-04 | Phase 3.1 | Pending |
| SUPA-05 through SUPA-08 | Phase 4 | Pending |
| DEPLOY-01 through DEPLOY-05 | Phase 5 | Pending |
| DEPLOY-06 through DEPLOY-07 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2025-02-04*
*Last updated: 2025-02-04 after roadmap creation*
