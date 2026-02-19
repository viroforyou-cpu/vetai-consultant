# Phase 3: Supabase Database (Local)

**Status:** Planning
**Created:** 2026-02-13
**Depends on:** Phase 2 (GLM Integration) ✅ Complete

## Goal

Local PostgreSQL database with pgvector ready for consultation storage and semantic search, running via Supabase CLI.

## Requirements Coverage

| Requirement | Description | Status |
|-------------|-------------|--------|
| SUPA-01 | Set up Supabase project with PostgreSQL database | Pending |
| SUPA-02 | Enable pgvector extension and create consultations table | Pending |
| SUPA-03 | Add embedding column VECTOR(1536) to consultations table | Pending |
| SUPA-04 | Create HNSW vector similarity search index on embeddings | Pending |

## Success Criteria

1. Supabase local instance is running via Docker
2. Consultations table exists with all required fields
3. Embedding column accepts VECTOR(1536) for GLM embeddings
4. Vector similarity search returns relevant consultations
5. Database can be queried from the application using Supabase client

## Architecture Overview

```mermaid
flowchart TB
    subgraph Current State
        A[Frontend React App] --> B[FastAPI Backend]
        B --> C[Local JSON Files]
        A --> D[Qdrant Vector DB]
        D --> E[Docker Container]
    end
    
    subgraph Target State - Local Development
        F[Frontend React App] --> G[Supabase Client]
        G --> H[Supabase Local Stack]
        H --> I[PostgreSQL + pgvector]
        I --> J[Vector Similarity Search]
        
        subgraph Docker Services
            H
            I
            K[GoTrue Auth]
            L[PostgREST API]
            M[Realtime]
            N[Storage API]
        end
    end
```

## Database Schema Design

### Consultations Table

Based on the existing [`Consultation`](src/types.ts:43) interface:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Consultations table
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp BIGINT NOT NULL,
    unique_tag TEXT NOT NULL UNIQUE,
    vet_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    audio_file_name TEXT,
    transcription TEXT NOT NULL,
    summary TEXT NOT NULL,
    
    -- Extracted administrative data
    admin_date TEXT,
    admin_breed TEXT,
    admin_species TEXT,
    admin_visit_purpose TEXT,
    
    -- Extracted clinical data
    clinical_chief_complaint TEXT,
    clinical_exam_findings TEXT,
    clinical_diagnosis TEXT,
    clinical_treatment TEXT,
    clinical_recovery_time TEXT,
    clinical_follow_up TEXT,
    
    -- Tags array
    tags TEXT[],
    
    -- Embedding for semantic search (GLM embeddings are 1536 dimensions)
    embedding VECTOR(1536),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index for vector similarity search
CREATE INDEX consultations_embedding_idx ON consultations 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create indexes for common queries
CREATE INDEX consultations_patient_idx ON consultations(patient_name);
CREATE INDEX consultations_owner_idx ON consultations(owner_name);
CREATE INDEX consultations_timestamp_idx ON consultations(timestamp DESC);
CREATE INDEX consultations_unique_tag_idx ON consultations(unique_tag);
```

### Attachments Table

For the [`Attachment`](src/types.ts:37) interface (audio files stored separately in Phase 4):

```sql
-- Attachments table (for metadata only, files in Storage Phase 4)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT,  -- Populated in Phase 4
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Steps

### Step 1: Install Supabase CLI

```bash
# Linux/macOS
npm install -g supabase

# Verify installation
supabase --version
```

### Step 2: Initialize Supabase Locally

```bash
# Initialize Supabase in the project
supabase init

# This creates:
# - supabase/config.toml
# - supabase/migrations/ (directory for SQL migrations)
```

### Step 3: Start Local Supabase Stack

```bash
# Start all Supabase services (PostgreSQL, GoTrue, PostgREST, etc.)
supabase start

# This outputs:
# - API URL: http://localhost:54321
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - Anon key: (generated key)
# - Service role key: (generated key)
```

### Step 4: Create Database Migration

Create `supabase/migrations/20260213000000_initial_schema.sql` with the schema defined above.

### Step 5: Apply Migration

```bash
# Apply migrations to local database
supabase db push
```

### Step 6: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 7: Create Supabase Service

Create [`src/services/supabaseService.ts`](src/services/supabaseService.ts) with:
- Client initialization using local URLs
- CRUD operations for consultations
- Vector similarity search function
- Error handling

### Step 8: Update Environment Configuration

Create/update `.env` with local Supabase credentials:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

Also update:
- [`.env.docker.example`](.env.docker.example) - Add Supabase variables
- [`secrets.env.example`](secrets.env.example) - Add Supabase variables

### Step 9: Integration Testing

- Test database connection
- Test insert/select operations
- Test vector similarity search
- Verify embedding dimensions match GLM output

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/config.toml` | Create (via CLI) | Supabase local configuration |
| `supabase/migrations/20260213000000_initial_schema.sql` | Create | Database schema migration |
| `src/services/supabaseService.ts` | Create | Supabase client and operations |
| `src/types.ts` | Modify | Add Supabase-related types if needed |
| `.env` | Modify | Add local Supabase credentials |
| `.env.docker.example` | Modify | Add Supabase env variables |
| `secrets.env.example` | Modify | Add Supabase env variables |
| `.gitignore` | Modify | Add Supabase local files |

## Docker Integration

The existing [`docker-compose.yml`](docker-compose.yml) can optionally include Supabase services, but using the Supabase CLI is recommended for local development as it manages all services automatically.

**Supabase CLI starts these Docker containers:**
- `supabase_db_postgres` - PostgreSQL with pgvector
- `supabase_auth_go_true` - Authentication service
- `supabase_rest_postgrest` - REST API
- `supabase_realtime` - Realtime subscriptions
- `supabase_storage` - File storage API
- `supabase_studio` - Admin dashboard at http://localhost:54323

**To integrate with existing Docker setup:**
```bash
# Option 1: Run Supabase separately (recommended)
supabase start  # Uses its own Docker network

# Option 2: Stop existing containers first if there are port conflicts
docker-compose down
supabase start
```

## Embedding Dimension Note

The current Qdrant configuration uses 768 dimensions (from Gemini), but GLM embeddings are 1536 dimensions. The Supabase schema uses `VECTOR(1536)` to match GLM embedding output.

**Verification needed:** Confirm GLM embedding dimensions by testing the [`getGLMEmbedding`](src/services/glmService.ts:239) function.

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Docker port conflicts | Stop existing containers before starting Supabase |
| Embedding dimension mismatch | Test GLM embeddings before schema creation |
| CORS issues | Local development uses localhost, no CORS issues |
| Data migration complexity | Phase 4 handles migration from localStorage |
| Supabase CLI version issues | Use latest version: `npm update -g supabase` |

## Dependencies

- Supabase CLI (`npm install -g supabase`)
- Docker (required for Supabase local services)
- GLM API key (already configured from Phase 2)
- Node.js package: `@supabase/supabase-js`

## Quick Reference Commands

```bash
# Start local Supabase
supabase start

# View local credentials
supabase status

# Stop local Supabase
supabase stop

# Reset database (careful - deletes all data)
supabase db reset

# Apply new migrations
supabase db push

# Open Supabase Studio (admin UI)
supabase studio
```

## Next Phase Preview

Phase 4 (Storage & Migration) will:
- Create Supabase Storage bucket for audio files
- Implement audio file upload/download
- Migrate existing localStorage data to Supabase
- Create storage service abstraction layer

---

**Ready for implementation?** Switch to Code mode to execute this plan.
