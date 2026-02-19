# Plan: Supabase Storage & Migration

**Phase:** 4 - Storage & Migration
**Created:** 2026-02-19
**Status:** Pending Execution

## Goal

Implement audio file storage in Supabase Storage and migrate existing localStorage consultations to Supabase Database.

## Background

Currently, the app stores consultations and audio files in localStorage. Phase 3 set up the database, but audio files still need a storage solution. Phase 4 will:
1. Set up Supabase Storage for audio files
2. Implement upload/download functionality
3. Create an abstraction layer for storage (Supabase primary, localStorage fallback)
4. Migrate existing data from localStorage to Supabase

## Requirements

- SUPA-05: Create consultation_audio storage bucket in Supabase
- SUPA-06: Implement audio file upload to Supabase Storage
- SUPA-07: Create storage service abstraction layer (Supabase primary, localStorage fallback)
- SUPA-08: Implement one-time migration script from localStorage to Supabase

## Pre-conditions

- PostgreSQL database running (localhost:54324) from Phase 3.1
- Migrations applied (consultations, attachments tables)
- Supabase JS client installed (`@supabase/supabase-js`)

## Constraints & Considerations

1. **Docker Socket Issue:** Full Supabase stack cannot start due to Docker Desktop configuration
   - **Workaround:** Use MinIO or local file storage for audio files in development
   - **Production:** Will use Supabase Cloud Storage

2. **Browser Limitations:** Direct PostgreSQL connection not possible from browser
   - Storage operations need a different approach than database operations
   - May need backend API or use browser-based storage abstraction

3. **localStorage to Supabase Migration:**
   - Need to read existing consultations from localStorage
   - Convert to database format
   - Save to Supabase
   - Handle audio files separately (may need base64 encoding)

## Steps

### Step 1: Determine Storage Strategy

Given the Docker socket issue, we have two options:

**Option A: Use Supabase Cloud Storage (Recommended for production)**
- Create a Supabase project at https://supabase.com
- Use Supabase Storage API for audio files
- Keep PostgreSQL local or use Supabase hosted database

**Option B: Local File Storage + PostgreSQL (Development setup)**
- Store audio files as base64 in database
- Or use a local file system via backend API
- Migrate to Supabase Storage in production

**Decision:** Proceed with Option B (local development) but design for Supabase Cloud migration.

### Step 2: Create Storage Service Abstraction Layer

Create `src/services/storageService.ts` with:
- Interface for storage operations (upload, download, delete)
- Primary implementation using PostgreSQL (store base64)
- Fallback to localStorage for offline support
- Migration function from localStorage to PostgreSQL

### Step 3: Update Attachment Handling

Modify `src/services/supabaseService.ts` to:
- Store base64-encoded audio data in attachments table
- Update `storage_path` to reference the data
- Implement retrieval with proper MIME type handling

### Step 4: Create Migration Script

Create `scripts/migrateLocalStorage.ts` that:
1. Reads all consultations from localStorage
2. Converts to database format
3. Saves to PostgreSQL via supabaseService
4. Handles attachments appropriately
5. Verifies migration success

### Step 5: Update App Integration

Modify `src/App.tsx` to:
- Use storage service for new consultations
- Trigger migration on first load if needed
- Handle migration errors gracefully

### Step 6: Testing

1. Create test consultation with audio
2. Verify it saves to PostgreSQL
3. Verify audio can be retrieved and played
4. Test migration from localStorage
5. Test fallback to localStorage if PostgreSQL unavailable

## File Structure

```
src/services/
├── storageService.ts      # NEW - Storage abstraction layer
├── supabaseService.ts     # MODIFY - Update attachment handling
└── aiService.ts           # No changes

scripts/
└── migrateLocalStorage.ts # NEW - Migration script

src/
├── App.tsx                # MODIFY - Integrate storage service
└── components/
    └── UploadView.tsx     # MAY MODIFY - Use new storage service
```

## Success Criteria

1. Audio files can be uploaded and stored (base64 in DB for now)
2. Audio files can be retrieved and played
3. Storage service abstraction works correctly
4. localStorage migration completes successfully
5. Fallback to localStorage works if database unavailable
6. No data loss during migration

## Rollback Plan

If migration fails:
1. Keep localStorage as primary storage
2. Log errors for debugging
3. Revert to previous code version if needed

## Migration Strategy

1. **Phase 4a:** Implement base64 storage in PostgreSQL (current phase)
2. **Phase 4b:** (Future) Migrate to Supabase Cloud Storage for production
3. **Phase 4c:** (Future) Implement direct file upload/download with backend API

## Known Limitations

1. Base64 encoding increases storage size by ~33%
2. Large audio files may hit database column size limits
3. For production, Supabase Storage or similar is recommended
4. Current approach is suitable for development and small-scale use

## Estimated Duration

60-90 minutes
- Storage service: 30 minutes
- Attachment handling: 20 minutes
- Migration script: 15 minutes
- Testing: 15 minutes
- Documentation: 10 minutes
