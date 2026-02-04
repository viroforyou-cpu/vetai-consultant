# Research Summary: VetAI Consultant Production Roadmap

**Research Date:** 2025-02-04
**Goal:** Deploy VetAI Consultant to production with GLM 4.7 + Supabase + Vercel

---

## Key Findings

### Technology Stack Confirmed
- **Frontend**: React 18, TypeScript 5.5, Vite 5, Tailwind CSS
- **AI Provider**: GLM 4.7 via ZhipuAI (BigModel) API
- **Database**: Supabase (PostgreSQL + pgvector + Auth + Storage)
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Platform**: Debian Linux for local development

### Critical Architecture Decisions

**Recommended: Serverless Architecture**
- Direct Supabase client integration (no Edge Functions needed)
- Frontend-only deployment to Vercel
- Serverless functions only if complex processing needed
- Simpler than maintaining Python backend

**Why This Works:**
- Supabase handles auth, database, storage in one platform
- Vercel provides global CDN and automatic deployments
- Eliminates server management overhead
- Free tiers sufficient for personal use

---

## GLM 4.7 Integration: Key Points

### API Configuration
```
Base URL: https://open.bigmodel.cn/oneapi/v1
Chat: /chat/completions
Embeddings: /embeddings
Auth: Bearer token
```

### Implementation Strategy
1. Install `zhipuai-sdk-nodejs-v4` for TypeScript
2. Configure with `VITE_ZHIPU_API_KEY` environment variable
3. Use `glm-4.7` for analysis, `embedding-3` for vectors
4. Implement exponential backoff for rate limiting
5. **Note**: GLM doesn't support audio transcription - need separate STT service

### Code Example
```typescript
import { ZhipuAI } from 'zhipuai-sdk-nodejs-v4';

const ai = new ZhipuAI({
  apiKey: import.meta.env.VITE_ZHIPU_API_KEY
});

// Chat completion
const response = await ai.chat.completions.create({
  model: "glm-4.7",
  messages: [{ role: "user", content: text }]
});
```

---

## Supabase Integration: Key Points

### Database Schema Requirements
- Enable `pgvector` extension for semantic search
- Create `consultations` table with `embedding` column (VECTOR(1536))
- Set up Row Level Security (RLS) for single-user access
- Create HNSW index for fast vector similarity search

### Storage Setup
- Create `consultation_audio` bucket (50MB limit per file)
- Configure as private (not public)
- Use signed URLs for temporary access

### Auth Strategy
- Magic link authentication (simplest for single-user)
- One email = vet practice owner
- Configure redirect URLs for Vercel domains

### Free Tier Limits
- 500 MB database storage
- 1 GB file storage
- 10 GB bandwidth/month
- 50,000 MAU (more than enough for personal use)

---

## Vercel Deployment: Key Points

### Critical Configurations
1. `vite.config.ts`: Set `base: './'` for Vercel
2. `package.json`: `"build": "tsc && vite build"`
3. `vercel.json`: Set `outputDirectory: "dist"`
4. Environment: Add all variables via Vercel dashboard

### Tailwind Migration (Fix CDN Warning)
- Install `tailwindcss`, `postcss`, `autoprefixer`, `@tailwindcss/postcss`
- Create `tailwind.config.js` and `postcss.config.js`
- Replace CDN with local CSS build
- Update `index.html` to remove CDN script

### Deployment Workflow
```bash
# Connect GitHub to Vercel
# Push to main branch → auto-deploys to production
# Pull requests → preview deployments
```

---

## Common Pitfalls to Avoid

### 1. localStorage Migration Data Loss
**Risk**: Losing existing consultation data during migration
**Prevention**: Create migration script, test with data backup

### 2. CORS Configuration Errors
**Risk**: Supabase requests blocked in production
**Prevention**: Add Vercel domains to Supabase CORS settings

### 3. Environment Variable Exposure
**Risk**: API keys visible in browser
**Prevention**: Use `VITE_` prefix, mark as sensitive in Vercel

### 4. Build/Environment Confusion
**Risk**: Different behavior in dev vs production
**Prevention**: Use `import.meta.env.DEV/PROD` not `process.env`

### 5. Hot-Reload Breaking
**Risk**: Development stops working after Supabase integration
**Prevention**: Configure Vite HMR properly, restart server when adding env vars

---

## Recommended Implementation Order

### Phase 1: Foundation (1-2 weeks)
- [ ] Set up Supabase project
- [ ] Configure database schema with pgvector
- [ ] Set up authentication
- [ ] Create storage bucket
- [ ] Configure environment variables locally

### Phase 2: GLM Integration (1 week)
- [ ] Install ZhipuAI SDK
- [ ] Configure API endpoint
- [ ] Implement chat completions
- [ ] Implement embeddings
- [ ] Test all AI features

### Phase 3: Data Layer (1-2 weeks)
- [ ] Create Supabase client service
- [ ] Implement storage abstraction layer
- [ ] Migrate from localStorage to Supabase
- [ ] Test data persistence

### Phase 4: Audio Upload (1 week)
- [ ] Implement audio upload to Storage
- [ ] Generate signed URLs
- [ ] Test file upload/download

### Phase 5: Vector Search (1 week)
- [ ] Store embeddings in Supabase
- [ ] Create RPC function for similarity search
- [ ] Implement semantic search UI
- [ ] Test search accuracy

### Phase 6: Production Build (1 week)
- [ ] Fix Tailwind CDN warning
- [ ] Add favicon
- [ ] Optimize build
- [ ] Create vercel.json

### Phase 7: Vercel Deployment (1 week)
- [ ] Connect GitHub to Vercel
- [ ] Configure environment variables
- [ ] Deploy to production
- [ ] Test all features
- [ ] Configure custom domain (optional)

---

## Success Criteria

Production-ready when:
- [ ] GLM 4.7 API working for all features
- [ ] Data persists to Supabase correctly
- [ ] Audio files upload to Supabase Storage
- [ ] Semantic search returns relevant results
- [ ] Authentication works (magic link)
- [ ] No console errors in production
- [ ] Build completes without warnings
- [ ] App loads fast on Vercel CDN
- [ ] Works across different browsers
- [ ] Local development still works on Debian

---

## Next Steps

1. Review this research summary
2. Define specific requirements based on findings
3. Create detailed roadmap with phases
4. Begin Phase 1: Foundation setup

---

*Research completed: 2025-02-04*
*All research files available in `.planning/research/`*
