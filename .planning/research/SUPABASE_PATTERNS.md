# Supabase Integration Patterns

## Recommended Architecture: Direct Client Integration

For React + Vercel + Supabase, use the **direct client approach**:
- Use `@supabase/supabase-js` directly in React app
- Configure environment variables in Vercel dashboard
- Simpler implementation, better debugging

## Database Schema for Consultations

```sql
-- Enable pgvector extension
CREATE EXTENSION vector WITH SCHEMA extensions;

-- Consultations table
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  unique_tag TEXT NOT NULL,
  vet_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  audioFileName TEXT,
  transcription TEXT NOT NULL,
  summary TEXT NOT NULL,
  extractedData JSONB,
  tags TEXT[],
  embedding VECTOR(1536),  -- GLM embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector similarity search index
CREATE INDEX consultations_embedding_idx ON consultations
USING hnsw (embedding vector_ip_ops);

-- Enable RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Single-user policy (vet practice owner)
CREATE POLICY "Owner can access all consultations"
ON consultations FOR ALL
USING (auth.uid() = 'USER-UUID-HERE');
```

## Auth Flow for Single-User App

### Magic Link Authentication
```typescript
// Send magic link
const { error } = await supabase.auth.signInWithOtp({
  email: 'vet@example.com',
  options: { shouldCreateUser: false }
});

// Verify on return from email
const { data, error } = await supabase.auth.verifyOtp({
  token_hash: params.token_hash,
  type: 'email'
});
```

### Environment Variables
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_AUTH_SITE_URL=http://localhost:3000  # or your Vercel URL
```

## Audio File Upload to Storage

### Storage Bucket Setup
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('consultation_audio', 'consultation_audio', false, 52428800, ARRAY['audio/*']);
```

### Upload Function
```typescript
const uploadAudio = async (file: File, consultationId: string) => {
  const { data, error } = await supabase.storage
    .from('consultation_audio')
    .upload(`${consultationId}/${file.name}`, file, {
      upsert: true,
      contentType: file.type
    });

  if (!error) {
    const { data } = supabase.storage
      .from('consultation_audio')
      .getPublicUrl(`${consultationId}/${file.name}`);
    return data.publicUrl;
  }
};
```

## Semantic Search with pgvector

### RPC Function for Vector Search
```sql
CREATE OR REPLACE FUNCTION match_consultations(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  similarity FLOAT,
  consultations consultations
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    consultations.id,
    1 - (consultations.embedding <=> query_embedding) AS similarity,
    consultations
  FROM consultations
  WHERE 1 - (consultations.embedding <=> query_embedding) > match_threshold
  ORDER BY consultations.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Search from React
```typescript
const searchConsultations = async (queryText: string) => {
  // Generate embedding using GLM
  const embedding = await glmService.generateEmbedding(queryText);

  // Search via Supabase RPC
  const { data, error } = await supabase.rpc('match_consultations', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5
  });

  return data;
};
```

## Free Tier Limitations

- **Database Storage**: 500 MB
- **File Storage**: 1 GB
- **Bandwidth**: 10 GB/month
- **Max File Size**: 50 MB
- **Monthly Active Users**: 50,000
- **API Requests**: Unlimited

## Row Level Security for Single User

```sql
-- Get your user UUID after first signup
SELECT auth.uid();

-- Policy for single-user access
CREATE POLICY "Owner full access"
ON consultations FOR ALL
USING (auth.uid() = 'YOUR-USER-UUID');
```

## Implementation Architecture

1. **Frontend**: React + Vite (existing)
2. **Database**: Supabase PostgreSQL + pgvector
3. **Authentication**: Magic link for vet practice owner
4. **Storage**: Supabase Storage for audio files
5. **Search**: PostgreSQL RPC + pgvector
6. **Deployment**: Vercel frontend + Supabase backend

## Migration Strategy

1. **Phase 1**: Set up Supabase project and database schema
2. **Phase 2**: Replace localStorage with Supabase queries
3. **Phase 3**: Implement authentication flow
4. **Phase 4**: Add audio file upload to Storage
5. **Phase 5**: Implement vector search with pgvector
