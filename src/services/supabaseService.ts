import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Consultation, Attachment } from '../types';

// Database row types matching the schema
export interface ConsultationRow {
    id: string;
    timestamp: number;
    unique_tag: string;
    vet_name: string;
    owner_name: string;
    patient_name: string;
    audio_file_name: string | null;
    transcription: string;
    summary: string;
    admin_date: string | null;
    admin_breed: string | null;
    admin_species: string | null;
    admin_visit_purpose: string | null;
    clinical_chief_complaint: string | null;
    clinical_exam_findings: string | null;
    clinical_diagnosis: string | null;
    clinical_treatment: string | null;
    clinical_recovery_time: string | null;
    clinical_follow_up: string | null;
    tags: string[] | null;
    embedding: number[] | null;
    created_at: string;
    updated_at: string;
}

export interface AttachmentRow {
    id: string;
    consultation_id: string;
    name: string;
    mime_type: string;
    storage_path: string | null;
    data: string | null;
    created_at: string;
}

// Vector search result type
export interface VectorSearchResult {
    consultation: Consultation;
    similarity: number;
}

// Custom error class for Supabase operations
export class SupabaseError extends Error {
    constructor(
        message: string,
        public operation: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = 'SupabaseError';
    }
}

// Get Supabase configuration from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Create Supabase client (singleton)
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (!supabaseClient) {
        if (!isSupabaseConfigured()) {
            console.warn('Supabase not configured. Using placeholder client.');
        }
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || 'placeholder-key');
    }
    return supabaseClient;
}

/**
 * Convert a Consultation object to a database row format
 */
function consultationToRow(consultation: Consultation): Omit<ConsultationRow, 'created_at' | 'updated_at'> {
    return {
        id: consultation.id,
        timestamp: consultation.timestamp,
        unique_tag: consultation.uniqueTag,
        vet_name: consultation.vetName,
        owner_name: consultation.ownerName,
        patient_name: consultation.patientName,
        audio_file_name: consultation.audioFileName || null,
        transcription: consultation.transcription,
        summary: consultation.summary,
        admin_date: consultation.extractedData?.administrative.date || null,
        admin_breed: consultation.extractedData?.administrative.breed || null,
        admin_species: consultation.extractedData?.administrative.species || null,
        admin_visit_purpose: consultation.extractedData?.administrative.visitPurpose || null,
        clinical_chief_complaint: consultation.extractedData?.clinical.chiefComplaint || null,
        clinical_exam_findings: consultation.extractedData?.clinical.examinationFindings || null,
        clinical_diagnosis: consultation.extractedData?.clinical.diagnosis || null,
        clinical_treatment: consultation.extractedData?.clinical.treatment || null,
        clinical_recovery_time: consultation.extractedData?.clinical.recoveryTime || null,
        clinical_follow_up: consultation.extractedData?.clinical.followUp || null,
        tags: consultation.tags || null,
        embedding: consultation.embedding || null,
    };
}

/**
 * Convert a database row to a Consultation object
 */
function rowToConsultation(row: ConsultationRow, attachments: Attachment[] = []): Consultation {
    return {
        id: row.id,
        timestamp: row.timestamp,
        uniqueTag: row.unique_tag,
        vetName: row.vet_name,
        ownerName: row.owner_name,
        patientName: row.patient_name,
        audioFileName: row.audio_file_name || undefined,
        transcription: row.transcription,
        summary: row.summary,
        attachments,
        extractedData: {
            administrative: {
                vetName: row.vet_name,
                date: row.admin_date || '',
                ownerName: row.owner_name,
                patientName: row.patient_name,
                breed: row.admin_breed || '',
                species: row.admin_species || '',
                visitPurpose: row.admin_visit_purpose || '',
            },
            clinical: {
                chiefComplaint: row.clinical_chief_complaint || '',
                examinationFindings: row.clinical_exam_findings || '',
                diagnosis: row.clinical_diagnosis || '',
                treatment: row.clinical_treatment || '',
                recoveryTime: row.clinical_recovery_time || '',
                followUp: row.clinical_follow_up || '',
            },
        },
        tags: row.tags || undefined,
        embedding: row.embedding || undefined,
    };
}

/**
 * Save a consultation to the database
 */
export async function saveConsultation(consultation: Consultation): Promise<void> {
    const client = getSupabaseClient();

    try {
        // Insert consultation
        const { error: consultError } = await client
            .from('consultations')
            .upsert(consultationToRow(consultation), { onConflict: 'unique_tag' });

        if (consultError) {
            throw new SupabaseError(
                `Failed to save consultation: ${consultError.message}`,
                'saveConsultation',
                consultError
            );
        }

        // Save attachments metadata and data (base64 encoded for local storage)
        if (consultation.attachments.length > 0) {
            const attachmentRows = consultation.attachments.map(att => ({
                consultation_id: consultation.id,
                name: att.name,
                mime_type: att.mimeType,
                storage_path: 'base64', // Indicates base64 storage
                data: att.data || null, // Store base64 data directly
            }));

            const { error: attachError } = await client
                .from('attachments')
                .insert(attachmentRows);

            if (attachError) {
                console.warn('Failed to save attachments metadata:', attachError.message);
                // Don't throw - consultation is saved, attachments are secondary
            }
        }
    } catch (error) {
        if (error instanceof SupabaseError) throw error;
        throw new SupabaseError(
            'Unexpected error saving consultation',
            'saveConsultation',
            error
        );
    }
}

/**
 * Get a consultation by ID
 */
export async function getConsultationById(id: string): Promise<Consultation | null> {
    const client = getSupabaseClient();

    try {
        // Get consultation
        const { data: consultData, error: consultError } = await client
            .from('consultations')
            .select('*')
            .eq('id', id)
            .single();

        if (consultError) {
            if (consultError.code === 'PGRST116') return null; // Not found
            throw new SupabaseError(
                `Failed to get consultation: ${consultError.message}`,
                'getConsultationById',
                consultError
            );
        }

        // Get attachments
        const { data: attachData, error: attachError } = await client
            .from('attachments')
            .select('*')
            .eq('consultation_id', id);

        const attachments: Attachment[] = attachError ? [] : (attachData || []).map(row => ({
            name: row.name,
            mimeType: row.mime_type,
            data: row.data || '', // Load base64 data from database
        }));

        return rowToConsultation(consultData as ConsultationRow, attachments);
    } catch (error) {
        if (error instanceof SupabaseError) throw error;
        throw new SupabaseError(
            'Unexpected error getting consultation',
            'getConsultationById',
            error
        );
    }
}

/**
 * Get all consultations, sorted by timestamp descending
 */
export async function getAllConsultations(limit = 100, offset = 0): Promise<Consultation[]> {
    const client = getSupabaseClient();

    try {
        // Query consultations with their attachments
        const { data, error } = await client
            .from('consultations')
            .select('*, attachments(id, name, mime_type, data)')
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw new SupabaseError(
                `Failed to get consultations: ${error.message}`,
                'getAllConsultations',
                error
            );
        }

        return (data || []).map((row: any) => {
            // Extract attachments from the nested query result
            const attachments: Attachment[] = (row.attachments || []).map((att: any) => ({
                name: att.name,
                mimeType: att.mime_type,
                data: att.data || '',
            }));

            // Use rowToConsultation without the attachments param (we handle them above)
            return {
                id: row.id,
                timestamp: row.timestamp,
                uniqueTag: row.unique_tag,
                vetName: row.vet_name,
                ownerName: row.owner_name,
                patientName: row.patient_name,
                audioFileName: row.audio_file_name || undefined,
                transcription: row.transcription,
                summary: row.summary,
                attachments,
                extractedData: {
                    administrative: {
                        vetName: row.vet_name,
                        date: row.admin_date || '',
                        ownerName: row.owner_name,
                        patientName: row.patient_name,
                        breed: row.admin_breed || '',
                        species: row.admin_species || '',
                        visitPurpose: row.admin_visit_purpose || '',
                    },
                    clinical: {
                        chiefComplaint: row.clinical_chief_complaint || '',
                        examinationFindings: row.clinical_exam_findings || '',
                        diagnosis: row.clinical_diagnosis || '',
                        treatment: row.clinical_treatment || '',
                        recoveryTime: row.clinical_recovery_time || '',
                        followUp: row.clinical_follow_up || '',
                    },
                },
                tags: row.tags || undefined,
                embedding: row.embedding || undefined,
            };
        });
    } catch (error) {
        if (error instanceof SupabaseError) throw error;
        throw new SupabaseError(
            'Unexpected error getting consultations',
            'getAllConsultations',
            error
        );
    }
}

/**
 * Search consultations by text query
 */
export async function searchConsultations(query: string): Promise<Consultation[]> {
    const client = getSupabaseClient();

    try {
        const { data, error } = await client
            .from('consultations')
            .select('*')
            .or(`patient_name.ilike.%${query}%,owner_name.ilike.%${query}%,transcription.ilike.%${query}%,summary.ilike.%${query}%`)
            .order('timestamp', { ascending: false })
            .limit(50);

        if (error) {
            throw new SupabaseError(
                `Failed to search consultations: ${error.message}`,
                'searchConsultations',
                error
            );
        }

        return (data || []).map(row => rowToConsultation(row as ConsultationRow));
    } catch (error) {
        if (error instanceof SupabaseError) throw error;
        throw new SupabaseError(
            'Unexpected error searching consultations',
            'searchConsultations',
            error
        );
    }
}

/**
 * Perform vector similarity search using pgvector
 * Returns consultations sorted by similarity to the query embedding
 */
export async function vectorSearch(
    queryEmbedding: number[],
    matchThreshold = 0.5,
    matchCount = 10
): Promise<VectorSearchResult[]> {
    const client = getSupabaseClient();

    try {
        // Call the RPC function for vector search
        // Note: This requires a database function to be created
        const { data, error } = await client.rpc('match_consultations', {
            query_embedding: queryEmbedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
        });

        if (error) {
            // If RPC doesn't exist, fall back to basic search
            if (error.code === 'PGRST202') {
                console.warn('Vector search function not found. Falling back to basic search.');
                const consultations = await getAllConsultations(matchCount);
                return consultations.map(c => ({ consultation: c, similarity: 0 }));
            }
            throw new SupabaseError(
                `Failed to perform vector search: ${error.message}`,
                'vectorSearch',
                error
            );
        }

        return (data || []).map((row: { id: string; similarity: number } & ConsultationRow) => ({
            consultation: rowToConsultation(row),
            similarity: row.similarity,
        }));
    } catch (error) {
        if (error instanceof SupabaseError) throw error;
        throw new SupabaseError(
            'Unexpected error during vector search',
            'vectorSearch',
            error
        );
    }
}

/**
 * Delete a consultation by ID
 */
export async function deleteConsultation(id: string): Promise<void> {
    const client = getSupabaseClient();

    try {
        // Attachments are deleted automatically via CASCADE
        const { error } = await client
            .from('consultations')
            .delete()
            .eq('id', id);

        if (error) {
            throw new SupabaseError(
                `Failed to delete consultation: ${error.message}`,
                'deleteConsultation',
                error
            );
        }
    } catch (error) {
        if (error instanceof SupabaseError) throw error;
        throw new SupabaseError(
            'Unexpected error deleting consultation',
            'deleteConsultation',
            error
        );
    }
}

/**
 * Update the embedding for a consultation
 */
export async function updateEmbedding(id: string, embedding: number[]): Promise<void> {
    const client = getSupabaseClient();

    try {
        const { error } = await client
            .from('consultations')
            .update({ embedding })
            .eq('id', id);

        if (error) {
            throw new SupabaseError(
                `Failed to update embedding: ${error.message}`,
                'updateEmbedding',
                error
            );
        }
    } catch (error) {
        if (error instanceof SupabaseError) throw error;
        throw new SupabaseError(
            'Unexpected error updating embedding',
            'updateEmbedding',
            error
        );
    }
}

/**
 * Get consultations by patient name
 */
export async function getConsultationsByPatient(patientName: string): Promise<Consultation[]> {
    const client = getSupabaseClient();

    try {
        const { data, error } = await client
            .from('consultations')
            .select('*')
            .ilike('patient_name', patientName)
            .order('timestamp', { ascending: false });

        if (error) {
            throw new SupabaseError(
                `Failed to get consultations by patient: ${error.message}`,
                'getConsultationsByPatient',
                error
            );
        }

        return (data || []).map(row => rowToConsultation(row as ConsultationRow));
    } catch (error) {
        if (error instanceof SupabaseError) throw error;
        throw new SupabaseError(
            'Unexpected error getting consultations by patient',
            'getConsultationsByPatient',
            error
        );
    }
}

/**
 * Get consultations by owner name
 */
export async function getConsultationsByOwner(ownerName: string): Promise<Consultation[]> {
    const client = getSupabaseClient();

    try {
        const { data, error } = await client
            .from('consultations')
            .select('*')
            .ilike('owner_name', ownerName)
            .order('timestamp', { ascending: false });

        if (error) {
            throw new SupabaseError(
                `Failed to get consultations by owner: ${error.message}`,
                'getConsultationsByOwner',
                error
            );
        }

        return (data || []).map(row => rowToConsultation(row as ConsultationRow));
    } catch (error) {
        if (error instanceof SupabaseError) throw error;
        throw new SupabaseError(
            'Unexpected error getting consultations by owner',
            'getConsultationsByOwner',
            error
        );
    }
}

/**
 * Check database connection
 */
export async function checkConnection(): Promise<boolean> {
    const client = getSupabaseClient();

    try {
        const { error } = await client.from('consultations').select('id').limit(1);
        return !error;
    } catch {
        return false;
    }
}
