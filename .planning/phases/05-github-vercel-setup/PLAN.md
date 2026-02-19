# Plan: GitHub & Vercel Setup

**Phase:** 5 - GitHub & Vercel Setup
**Created:** 2026-02-19
**Status:** In Progress

## Goal

Set up GitHub repository with proper commit structure and connect to Vercel for deployment.

## Background

The project already has a GitHub repository (https://github.com/viroforyou-cpu/vetai-consultant.git) but has many uncommitted changes from Phases 1-4. This phase will:
1. Organize and commit all changes with proper commit messages
2. Push to GitHub
3. Connect to Vercel for deployment
4. Configure environment variables

## Requirements

- DEPLOY-01: Create GitHub repository and structure code properly
- DEPLOY-02: Push code to GitHub repository
- DEPLOY-03: Connect GitHub repository to Vercel
- DEPLOY-04: Configure environment variables in Vercel dashboard
- DEPLOY-05: Configure Vercel project settings (build command, output directory)

## Pre-conditions

- GitHub repository exists: https://github.com/viroforyou-cpu/vetai-consultant.git
- Git remote configured: `origin` points to the GitHub repo
- Vercel.json configuration exists
- Build process works locally (npm run build)

## Steps

### Step 1: Review and Clean Uncommitted Changes

Review all modified files and ensure:
- No sensitive data (API keys, secrets) in committed files
- .gitignore is properly configured
- All changes are intentional and documented

### Step 2: Stage and Commit Changes

Organize commits by phase:
1. Phase 1: Build Foundation (Tailwind, PostCSS, Vite config, etc.)
2. Phase 2: GLM Integration (aiService updates)
3. Phase 3 & 3.1: Database setup (supabaseService, migrations)
4. Phase 4: Storage & Migration (storageService, App.tsx updates)
5. Planning docs: All .planning files

### Step 3: Push to GitHub

```bash
git push origin main
```

### Step 4: Connect to Vercel

Option A - Using Vercel CLI:
```bash
npx vercel login
npx vercel link
```

Option B - Using Vercel Dashboard:
1. Go to https://vercel.com/new
2. Import GitHub repository
3. Configure project settings

### Step 5: Configure Vercel Project Settings

1. **Build Command:** `npm run build`
2. **Output Directory:** `dist`
3. **Install Command:** `npm install`
4. **Framework Preset:** Vite

### Step 6: Configure Environment Variables

Required environment variables for Vercel:
- `VITE_GLM_API_KEY` - ZhipuAI GLM API key
- `VITE_GLM_API_URL` - ZhipuAI API URL (https://api.z.ai/api/anthropic)
- `VITE_GLM_MODEL` - Model name (glm-4.7)
- `VITE_GLM_EMBEDDING_URL` - Embedding API URL (https://api.z.ai/api/v1/embeddings)
- `VITE_POSTGRES_URL` - PostgreSQL connection string (optional, for local development)

**Note:** Vercel requires `VITE_` prefix for client-side environment variables.

### Step 7: Deploy and Verify

1. Trigger deployment (automatic on push or manual)
2. Verify build succeeds
3. Test core functionality:
   - Page loads
   - Upload form works
   - Search works
   - Analytics renders

## Success Criteria

1. ✅ All changes committed to git with clear messages
2. ✅ Code pushed to GitHub repository
3. ✅ Repository connected to Vercel
4. ✅ Environment variables configured in Vercel dashboard
5. ✅ Vercel build succeeds
6. ✅ Application accessible at Vercel URL
7. ✅ Preview deployments enabled for pull requests

## Files Modified (to commit)

### Phase 1 - Build Foundation
- `tailwind.config.js`
- `postcss.config.js`
- `src/index.css`
- `index.html`
- `public/favicon.ico`
- `vite.config.ts`
- `vercel.json`
- `.gitignore`

### Phase 2 - GLM Integration
- `src/services/glmService.ts`
- `src/services/aiService.ts`
- `src/App.tsx`
- `src/components/HistoryView.tsx`
- `.env.docker.example`
- `secrets.env.example`

### Phase 3 & 3.1 - Database
- `supabase/migrations/20260213000000_initial_schema.sql`
- `supabase/migrations/20260219000000_add_attachment_data.sql`
- `src/services/supabaseService.ts`
- `.env`

### Phase 4 - Storage & Migration
- `src/services/storageService.ts`
- `src/App.tsx` (storage integration)
- `src/services/supabaseService.ts` (attachment updates)

### Planning
- `.planning/STATE.md`
- `.planning/phases/*/PLAN.md`
- `.planning/phases/*/VERIFICATION.md`
- `.planning/phases/*/SUMMARY.md`

## Known Issues

1. **Untracked files:** Several new files need to be added:
   - `postcss.config.js`
   - `tailwind.config.js`
   - `public/favicon.ico`
   - `vercel.json`
   - Planning docs

2. **Deleted files:** Some files were deleted and need proper commit:

3. **Database connectivity:** PostgreSQL is local, not accessible from Vercel
   - For production, use Supabase Cloud or similar

## Estimated Duration

45-60 minutes
- Organize commits: 20 minutes
- Push to GitHub: 5 minutes
- Connect to Vercel: 10 minutes
- Configure environment: 10 minutes
- Deploy and verify: 10 minutes
- Documentation: 5 minutes
