# Plan: Complete Supabase Database

**Phase:** 3.1 - Gap Closure Phase
**Created:** 2026-02-19
**Status:** Pending Execution

## Goal

Complete Phase 3 (Supabase Database) by deploying and testing the database setup that was coded but never deployed.

## Background

Phase 3 created all the code for Supabase integration (migration file, service, env config) but the Docker setup was never completed. This plan finishes the remaining steps to make the database functional.

## Pre-conditions

- Docker is installed and running (verified: Docker 29.2.1)
- Supabase CLI is installed (verified: version 2.76.8)
- Migration file exists: `supabase/migrations/20260213000000_initial_schema.sql`
- Service file exists: `src/services/supabaseService.ts`
- `.env` file has placeholder values for Supabase

## Steps

### Step 1: Start Supabase Local Stack
**Command:** `npx supabase start`

**Expected Output:**
- Started supabase local development setup
- Shows API URL (should be http://localhost:54321)
- Shows anon key (copy this to `.env`)
- Shows service_role key (not needed for this project)
- Shows database URL (internal to Docker)
- Shows studio URL (web UI at http://localhost:54323)

**Success Criteria:**
- Exit code 0
- Output contains "Started supabase local development setup"

### Step 2: Update .env with Anon Key
**Action:** Copy the anon key from `npx supabase start` output and update `.env`

**Current `.env` has:**
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Replace `your_supabase_anon_key_here`** with the actual key from output.

### Step 3: Apply Database Migrations
**Command:** `npx supabase db push`

**Expected Output:**
- Migrations applied successfully
- Tables created: consultations, attachments
- Extensions enabled: vector (pgvector)
- Indexes created
- Functions created: match_consultations

**Success Criteria:**
- Exit code 0
- No errors in output

### Step 4: Verify Schema
**Method 1:** Use Supabase Studio (web UI)
- Navigate to http://localhost:54323
- Check Table Editor for `consultations` and `attachments` tables
- Check Database → Extensions for `vector` extension

**Method 2:** Use psql
```bash
npx supabase db reset --debug
```
Or connect directly:
```bash
npx supabase inspect db logs
```

**Expected Results:**
- `consultations` table exists with all columns
- `attachments` table exists with foreign key
- `vector` extension is installed
- `consultations_embedding_idx` HNSW index exists
- `match_consultations` RPC function exists

### Step 5: Test Database Operations

Create a simple test script to verify:
1. Connection works
2. Can insert a consultation
3. Can query consultations
4. Vector search function works

**Test File:** `scripts/test-supabase.ts` (temporary)

```typescript
import { getSupabaseClient, checkConnection, saveConsultation } from '../src/services/supabaseService';
import { Consultation } from '../types';

async function test() {
  // 1. Test connection
  const connected = await checkConnection();
  console.log('Connection:', connected ? 'OK' : 'FAILED');

  // 2. Test insert
  const testConsultation: Consultation = {
    id: 'test-' + Date.now(),
    timestamp: Date.now(),
    uniqueTag: 'test-patient',
    vetName: 'Test Vet',
    ownerName: 'Test Owner',
    patientName: 'Test Patient',
    transcription: 'Test transcription',
    summary: 'Test summary',
    extractedData: {
      administrative: { /* ... */ },
      clinical: { /* ... */ }
    },
    attachments: [],
    embedding: new Array(1536).fill(0.1), // Dummy embedding
  };

  await saveConsultation(testConsultation);
  console.log('Insert: OK');

  // 3. Test query
  const { getAllConsultations } = await import('../src/services/supabaseService');
  const results = await getAllConsultations(10);
  console.log('Query:', results.length >= 1 ? 'OK' : 'FAILED');

  // 4. Test vector search
  const { vectorSearch } = await import('../src/services/supabaseService');
  const vectorResults = await vectorSearch(testConsultation.embedding!, 0.1, 5);
  console.log('Vector Search:', vectorResults.length >= 1 ? 'OK' : 'FAILED');
}

test().catch(console.error);
```

**Expected Results:**
- All tests pass
- No errors thrown

### Step 6: Create VERIFICATION.md

Document the verification of each SUPA requirement:
- SUPA-01: Supabase project set up (local via Docker)
- SUPA-02: pgvector enabled, consultations table created
- SUPA-03: embedding column VECTOR(1536) verified
- SUPA-04: HNSW index created and verified

### Step 7: Create SUMMARY.md

Create phase summary with `requirements-completed` frontmatter.

## Success Criteria

1. Supabase local stack is running
2. Migrations applied without errors
3. All tables and indexes exist
4. Database operations work from the app
5. Vector search function returns results
6. VERIFICATION.md created
7. SUMMARY.md created

## Rollback Plan

If anything fails:
1. `npx supabase stop` to stop the stack
2. Delete `.env` Supabase values (reset to placeholders)
3. Re-run this plan from Step 1

## Files Modified

- `.env` - Update with real Supabase anon key
- `.planning/phases/03.1-complete-supabase-database/VERIFICATION.md` - Create
- `.planning/phases/03.1-complete-supabase-database/SUMMARY.md` - Create

## Estimated Duration

15-30 minutes
- Supabase start: ~2-3 minutes
- Migration push: ~30 seconds
- Verification: ~5 minutes
- Testing: ~5-10 minutes
- Documentation: ~5 minutes
