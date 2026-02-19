# Plan: Docker Container Deployment

**Phase:** 6 - Docker Deployment
**Created:** 2026-02-19
**Status:** Pending Execution

## Goal

Create a complete, self-contained Docker container for VetAI Consultant that can be easily distributed to others.

## Background

The existing Docker setup uses the old architecture (Qdrant + FalkorDB + Gemini). This phase updates the Docker deployment to use the current architecture:
- PostgreSQL with pgvector for vector search
- GLM 4.7 AI model
- Storage service abstraction layer
- Self-contained for easy distribution

## Requirements

1. **Self-contained**: All services in one docker-compose file
2. **Easy to run**: Single command to start everything
3. **Configurable**: Environment variables for API keys and settings
4. **Data persistence**: Volumes for database and storage
5. **Production-ready**: Optimized builds, health checks, restart policies

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     docker-compose.yml                       │
│  Starts all services with proper networking and volumes       │
└──────────────┬────────────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│  Frontend    │  │  PostgreSQL  │
│  (nginx)     │  │  + pgvector  │
│  Port 8080   │  │  Port 54324  │
└──────────────┘  └──────────────┘
```

## Services

### 1. Frontend (nginx)
- React app built with Vite
- Served by nginx:alpine
- Port: 8080
- Environment variables:
  - `VITE_GLM_API_KEY` - ZhipuAI API key
  - `VITE_GLM_API_URL` - ZhipuAI API URL
  - `VITE_GLM_MODEL` - Model name (glm-4.7)
  - `VITE_GLM_EMBEDDING_URL` - Embeddings endpoint

### 2. PostgreSQL + pgvector
- PostgreSQL 16 with pgvector extension
- Port: 54324 (mapped from 5432 internal)
- Volumes: Persistent data storage
- Pre-initialized with schema migrations

## Files to Create/Update

### 1. Dockerfile (update)
- Multi-stage build for optimal image size
- Build React app with Vite
- Serve with nginx

### 2. docker-compose.yml (update)
- Frontend service
- PostgreSQL service
- Networks and volumes
- Environment variable configuration

### 3. nginx.conf (update)
- Proper routing for SPA
- CORS headers for API calls
- Gzip compression

### 4. .env.docker.example (update)
- All required environment variables
- Documentation for each variable

### 5. init-db.sh (create)
- Database initialization script
- Run migrations on startup
- Create database and user

### 6. README-Docker.md (create)
- Quick start guide
- Configuration instructions
- Troubleshooting

## Steps

### Step 1: Update Dockerfile
- Ensure it uses current build configuration
- Add health check
- Optimize for production

### Step 2: Create docker-compose.yml
- Frontend service (nginx)
- PostgreSQL service with pgvector
- Proper networking and volumes

### Step 3: Create database initialization
- Script to run migrations on container start
- Create database and extensions

### Step 4: Update nginx configuration
- SPA routing support
- CORS headers
- Security headers

### Step 5: Create distribution package
- Docker build script
- Run script
- Documentation

### Step 6: Test
- Build images
- Start containers
- Verify all features work
- Test data persistence

## Distribution Package

The distribution will include:
1. `docker-compose.yml` - Main orchestration file
2. `Dockerfile` - Frontend build definition
3. `.env.example` - Environment variable template
4. `README-Docker.md` - Quick start guide
5. `scripts/docker-build.sh` - Build script (optional)
6. `scripts/docker-start.sh` - Start script (optional)

## Quick Start for Users

```bash
# 1. Clone or extract the package
git clone https://github.com/viroforyou-cpu/vetai-consultant.git
cd vetai-consultant

# 2. Configure environment
cp .env.docker.example .env
# Edit .env and add your GLM API key

# 3. Start the application
docker-compose up -d

# 4. Open browser
# http://localhost:8080
```

## Environment Variables

Required:
- `VITE_GLM_API_KEY` - ZhipuAI GLM API key (get from https://open.bigmodel.cn)

Optional:
- `VITE_GLM_API_URL` - Default: https://api.z.ai/api/anthropic
- `VITE_GLM_MODEL` - Default: glm-4.7
- `VITE_GLM_EMBEDDING_URL` - Default: https://api.z.ai/api/v1/embeddings
- `POSTGRES_PASSWORD` - Default: vetai_dev_password
- `POSTGRES_DB` - Default: vetai
- `POSTGRES_USER` - Default: vetai

## Success Criteria

1. ✅ Docker image builds successfully
2. ✅ docker-compose up starts all services
3. ✅ Application loads in browser
4. ✅ Database migrations run automatically
5. ✅ Consultations can be saved and retrieved
6. ✅ Semantic search works
7. ✅ Data persists across container restarts

## Estimated Duration

60-90 minutes
- Update Dockerfile: 15 minutes
- Create docker-compose.yml: 20 minutes
- Create init scripts: 15 minutes
- Create documentation: 15 minutes
- Test and verify: 15 minutes

## Known Considerations

1. **API Key**: Users must obtain their own GLM API key
2. **Resource Requirements**:
   - ~500MB disk space for images
   - ~512MB RAM for PostgreSQL
   - ~128MB RAM for frontend
3. **Port Conflicts**: Default ports can be changed in docker-compose.yml
4. **First Run**: Database initialization may take 10-20 seconds

## Rollback Plan

If issues arise:
1. Keep existing Dockerfile and docker-compose as backup
2. Test new setup before committing
3. Document any breaking changes
