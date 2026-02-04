# Roadmap: VetAI Consultant - Production Ready

## Overview

Transform the existing VetAI Consultant from a local development prototype to a production-ready application deployed on Vercel with Supabase backend. The journey begins by fixing the build configuration and replacing Gemini with GLM 4.7, then establishes the Supabase data layer (database, storage, migration), and finally deploys to production with GitHub and Vercel integration. Each phase delivers a verifiable capability that builds toward the final goal: a veterinarian-accessible AI consultation system available from anywhere.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Build Foundation** - Fix Tailwind CDN, add favicon, optimize Vite config for production
- [ ] **Phase 2: GLM Integration** - Replace Gemini with ZhipuAI GLM 4.7 for all AI features
- [ ] **Phase 3: Supabase Database** - Set up PostgreSQL with pgvector for consultations and embeddings
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

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Build Foundation | 0/TBD | Not started | - |
| 2. GLM Integration | 0/TBD | Not started | - |
| 3. Supabase Database | 0/TBD | Not started | - |
| 4. Storage & Migration | 0/TBD | Not started | - |
| 5. GitHub & Vercel Setup | 0/TBD | Not started | - |
| 6. Production Deployment | 0/TBD | Not started | - |
