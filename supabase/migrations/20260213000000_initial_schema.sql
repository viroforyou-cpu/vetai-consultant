-- VetAI Consultant Initial Schema
-- Phase 3: Supabase Database Setup

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Consultations table
-- Stores all consultation data including extracted clinical information
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
-- HNSW is efficient for high-dimensional vectors and provides fast approximate nearest neighbor search
CREATE INDEX consultations_embedding_idx ON consultations 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create indexes for common queries
CREATE INDEX consultations_patient_idx ON consultations(patient_name);
CREATE INDEX consultations_owner_idx ON consultations(owner_name);
CREATE INDEX consultations_timestamp_idx ON consultations(timestamp DESC);
CREATE INDEX consultations_unique_tag_idx ON consultations(unique_tag);

-- Attachments table (for metadata, files stored in Supabase Storage - Phase 4)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT,  -- Populated in Phase 4 when audio storage is implemented
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for attachments lookup by consultation
CREATE INDEX attachments_consultation_idx ON attachments(consultation_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on consultations
CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- For now, allow all operations (single-user mode)
-- In Phase v2, these will be updated for multi-user authentication

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (anon key counts as authenticated)
CREATE POLICY "Allow all operations on consultations" ON consultations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on attachments" ON attachments
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to anon role (for client-side access)
GRANT ALL ON consultations TO anon;
GRANT ALL ON attachments TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_consultations(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  consultation_timestamp BIGINT,
  unique_tag TEXT,
  vet_name TEXT,
  owner_name TEXT,
  patient_name TEXT,
  audio_file_name TEXT,
  transcription TEXT,
  summary TEXT,
  admin_date TEXT,
  admin_breed TEXT,
  admin_species TEXT,
  admin_visit_purpose TEXT,
  clinical_chief_complaint TEXT,
  clinical_exam_findings TEXT,
  clinical_diagnosis TEXT,
  clinical_treatment TEXT,
  clinical_recovery_time TEXT,
  clinical_follow_up TEXT,
  tags TEXT[],
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.timestamp AS consultation_timestamp,
    c.unique_tag,
    c.vet_name,
    c.owner_name,
    c.patient_name,
    c.audio_file_name,
    c.transcription,
    c.summary,
    c.admin_date,
    c.admin_breed,
    c.admin_species,
    c.admin_visit_purpose,
    c.clinical_chief_complaint,
    c.clinical_exam_findings,
    c.clinical_diagnosis,
    c.clinical_treatment,
    c.clinical_recovery_time,
    c.clinical_follow_up,
    c.tags,
    c.embedding,
    c.created_at,
    c.updated_at,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM consultations c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE consultations IS 'Stores veterinary consultation records with extracted clinical data and embeddings for semantic search';
COMMENT ON TABLE attachments IS 'Stores attachment metadata for consultations (audio files stored in Supabase Storage)';
COMMENT ON COLUMN consultations.embedding IS 'GLM embedding vector (1536 dimensions) for semantic similarity search';
COMMENT ON COLUMN consultations.unique_tag IS 'Unique identifier combining date and patient name for deduplication';
COMMENT ON FUNCTION match_consultations IS 'Performs vector similarity search on consultation embeddings using cosine distance';
