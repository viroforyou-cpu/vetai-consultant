-- Add attachment data column for base64-encoded storage
-- Phase 4: Supabase Storage & Migration

-- Add data column to attachments table for base64-encoded audio
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS data TEXT;

-- Add comment for documentation
COMMENT ON COLUMN attachments.data IS 'Base64-encoded audio data (for local development, will use Supabase Storage in production)';
