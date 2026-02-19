# Roadmap: VetAI Consultant - Production Ready

## Overview

Transform the existing VetAI Consultant from a local development prototype to a production-ready application deployed on Vercel with Supabase backend. The journey begins by fixing the build configuration and replacing Gemini with GLM 4.7, then establishes the Supabase data layer (database, storage, migration), and finally deploys to production with GitHub and Vercel integration. Each phase delivers a verifiable capability that builds toward the final goal: a veterinarian-accessible AI consultation system available from anywhere.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (1.1, 2.1, 3.1): Gap closure verification phases
- Integer phases (7, 8, 9): Remaining planned work

Decimal phases appear between their surrounding integers in numeric order.

### Original Phases (Complete - Gap Closure Required)

- [x] **Phase 1: Build Foundation** - Fix Tailwind CDN, add favicon, optimize Vite config for production
- [x] **Phase 2: GLM Integration** - Replace Gemini with ZhipuAI GLM 4.7 for all AI features
- [ ] **Phase 3: Supabase Database** - Set up PostgreSQL with pgvector for consultations and embeddings

### Gap Closure Verification Phases

**Phase 1.1: Verify Build Foundation**
**Goal:** Create verification documentation for completed Build Foundation work
**Type:** Verification Phase - work exists, needs GSD verification artifacts
**Closes:** BUILD-01 through BUILD-08 (verification gap)
**Depends on:** Phase 1

**Phase 2.1: Verify GLM Integration**
**Goal:** Create verification documentation for completed GLM Integration work
**Type:** Verification Phase - work exists, needs GSD verification artifacts
**Closes:** GLM-01 through GLM-05 (verification gap)
**Depends on:** Phase 2

**Phase 3.1: Complete Supabase Database**
**Goal:** Complete testing and deployment of Supabase database
**Type:** Completion Phase - code written, needs testing and verification
**Closes:** SUPA-01 through SUPA-04 (actual work remaining)
**Depends on:** Phase 3

### Remaining Planned Phases

- [ ] **Phase 4: Storage & Migration** - Audio file storage and localStorage to Supabase migration
- [ ] **Phase 5: GitHub & Vercel Setup** - Repository structure and Vercel project configuration
- [ ] **Phase 6: Production Deployment** - Deploy to Vercel, verify, and configure CORS

## Phase Details

### Phase 1: Build Foundation

**Goal**: Production-optimized build configuration with no console errors or warnings

**Depends on**: Nothing (first phase)

**Requirements**: BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05, BUILD-06, BUILD-07, BUILD-08

**Success Criteria** (what must be TRUE):
1. Application builds locally without warnings or errors
2. Tailwind CSS styles render correctly without CDN dependency
3. Favicon loads without 404 errors
4. No console errors when application starts in development mode
5. Production build is optimized for Vercel deployment

**Plans**: TBD (will be determined during planning)

### Phase 2: GLM Integration

**Goal**: All AI features powered by ZhipuAI GLM 4.7 instead of Gemini

**Depends on**: Phase 1

**Requirements**: GLM-01, GLM-02, GLM-03, GLM-04, GLM-05

**Success Criteria** (what must be TRUE):
1. Consultation transcripts are successfully analyzed using GLM 4.7
2. Semantic search returns relevant results using GLM embeddings
3. API rate limits are handled gracefully with exponential backoff
4. User-friendly error messages display when GLM API fails
5. No API calls are made to Gemini (fully migrated to GLM)

**Plans**: TBD (will be determined during planning)

### Phase 3: Supabase Database

**Goal**: PostgreSQL database with pgvector ready for consultation storage and semantic search

**Depends on**: Phase 2

**Requirements**: SUPA-01, SUPA-02, SUPA-03, SUPA-04

**Success Criteria** (what must be TRUE):
1. Supabase project is created and accessible
2. Consultations table exists with all required fields
3. Embedding column accepts VECTOR(1536) for GLM embeddings
4. Vector similarity search returns relevant consultations
5. Database can be queried from the application using Supabase client

**Plans**: TBD (will be determined during planning)

### Phase 4: Storage & Migration

**Goal**: Audio files stored in Supabase Storage and existing data migrated from localStorage

**Depends on**: Phase 3

**Requirements**: SUPA-05, SUPA-06, SUPA-07, SUPA-08

**Success Criteria** (what must be TRUE):
1. Audio files upload successfully to Supabase Storage
2. Uploaded audio files can be retrieved and played
3. Existing localStorage consultations are migrated to Supabase
4. Storage service abstraction layer handles both Supabase and localStorage fallback
5. New consultations save to Supabase instead of localStorage

**Plans**: TBD (will be determined during planning)

### Phase 5: GitHub & Vercel Setup

**Goal**: Code repository properly structured and connected to Vercel for deployment

**Depends on**: Phase 4

**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05

**Success Criteria** (what must be TRUE):
1. GitHub repository exists with properly committed code
2. Repository is connected to Vercel
3. Environment variables are configured in Vercel dashboard
4. Vercel project settings point to correct build command and output directory
5. Preview deployments work on pull requests

**Plans**: TBD (will be determined during planning)

### Phase 6: Production Deployment

**Goal**: Application deployed to Vercel production and fully functional

**Depends on**: Phase 5

**Requirements**: DEPLOY-06, DEPLOY-07

**Success Criteria** (what must be TRUE):
1. Application is accessible via Vercel production URL
2. Consultation upload works end-to-end with audio files
3. Semantic search returns accurate results from Supabase
4. Analytics and graph views render correctly
5. No CORS errors when accessing Supabase from Vercel domain

**Plans**: TBD (will be determined during planning)

### Phase 1.1: Verify Build Foundation

**Goal**: Create verification documentation for completed Build Foundation work

**Type**: Verification Phase - work exists, needs GSD verification artifacts

**Depends on**: Phase 1

**Requirements**: BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05, BUILD-06, BUILD-07, BUILD-08

**Gap Closure**: Closes verification gap - all BUILD requirements completed but missing VERIFICATION.md

**Success Criteria** (what must be TRUE):
1. VERIFICATION.md created with all BUILD requirements verified as passed
2. SUMMARY.md created with requirements-completed listing all 8 BUILD requirements
3. Code artifacts verified: tailwind.config.js, postcss.config.js, index.html, favicon.ico, vite.config.ts, vercel.json exist and are correct
4. Build process verified: npm run build succeeds without errors

**Plans**: 1 plan
- [ ] 01.1-01-PLAN.md — Verify BUILD-01 through BUILD-08 artifacts and create verification documentation

### Phase 2.1: Verify GLM Integration

**Goal**: Create verification documentation for completed GLM Integration work

**Type**: Verification Phase - work exists, needs GSD verification artifacts

**Depends on**: Phase 2

**Requirements**: GLM-01, GLM-02, GLM-03, GLM-04, GLM-05

**Gap Closure**: Closes verification gap - all GLM requirements completed but missing VERIFICATION.md

**Success Criteria** (what must be TRUE):
1. VERIFICATION.md created with all GLM requirements verified as passed
2. SUMMARY.md created with requirements-completed listing all 5 GLM requirements
3. Code artifacts verified: glmService.ts with rate limiting, error handling, retry logic exists
4. aiService.ts properly routes to GLM instead of Gemini
5. GLM API endpoint configuration verified

**Plans**: TBD (will be determined during planning)

### Phase 3.1: Complete Supabase Database

**Goal**: Complete testing and deployment of Supabase database

**Type**: Completion Phase - code written, needs testing and verification

**Depends on**: Phase 3

**Requirements**: SUPA-01, SUPA-02, SUPA-03, SUPA-04

**Gap Closure**: Closes actual work gap - migrations written, need Docker setup and testing

**Success Criteria** (what must be TRUE):
1. Supabase local stack starts successfully with Docker
2. Database migrations applied successfully (npx supabase db push)
3. Consultations table verified with pgvector extension enabled
4. Vector similarity search tested and working
5. VERIFICATION.md created confirming all SUPA-01 through SUPA-04 requirements met
6. SUMMARY.md created with requirements-completed listing all 4 SUPA requirements

**Plans**: TBD (will be determined during planning)

## Progress

**Execution Order:**
Phases execute in numeric order: 1.1 → 2.1 → 3.1 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Build Foundation | 3/3 | ✅ Complete | 2026-02-13 |
| 2. GLM Integration | 1/1 | ✅ Complete | 2026-02-13 |
| 1.1. Verify Build Foundation | 0/1 | ⏳ Pending | - |
| 2.1. Verify GLM Integration | 0/TBD | ⏳ Pending | - |
| 3. Supabase Database | 0/TBD | 🔄 In Progress | 2026-02-13 |
| 3.1. Complete Supabase Database | 0/TBD | ⏳ Pending | - |
| 4. Storage & Migration | 0/TBD | Not started | - |
| 5. GitHub & Vercel Setup | 0/TBD | Not started | - |
| 6. Production Deployment | 0/TBD | Not started | - |
