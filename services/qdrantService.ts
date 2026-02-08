
import { Consultation } from "../types";

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'vet_consultations';

// Helper to check if Qdrant is actually reachable
const isQdrantAvailable = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${QDRANT_URL}/collections`);
        return res.ok;
    } catch {
        return false;
    }
};

export const initQdrant = async () => {
    if (!await isQdrantAvailable()) {
        console.warn("Qdrant is not reachable. App will run in 'Local Only' mode using browser-based vector search.");
        return;
    }
    try {
        const checkRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);
        if (!checkRes.ok) {
            await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vectors: { size: 768, distance: 'Cosine' }
                })
            });
        }
    } catch (error) {
        console.warn("Qdrant init error:", error);
    }
};

export const upsertConsultation = async (consultation: Consultation, vector: number[]) => {
    if (!await isQdrantAvailable()) return; 

    try {
        const payload = {
            points: [{
                id: consultation.id,
                vector: vector,
                payload: {
                    patientName: consultation.patientName,
                    vetName: consultation.vetName,
                    summary: consultation.summary,
                    uniqueTag: consultation.uniqueTag,
                    diagnosis: consultation.extractedData?.clinical?.diagnosis || "N/A"
                }
            }]
        };

        await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error("Failed to save to Qdrant:", error);
    }
};

export const searchQdrant = async (vector: number[]): Promise<string[]> => {
    if (!await isQdrantAvailable()) return [];

    try {
        const response = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vector: vector,
                limit: 10,
                with_payload: true,
                score_threshold: 0.20 // Lowered threshold to be less strict
            })
        });

        if (!response.ok) return [];
        const data = await response.json();
        return data.result.map((point: any) => point.id);
    } catch (error) {
        console.error("Qdrant search failed:", error);
        return [];
    }
};

/**
 * Fallback: Search using Cosine Similarity locally in the browser.
 * This ensures "Database Search" works even if Qdrant (Docker) is offline.
 */
export const searchLocalVectors = (queryVector: number[], consultations: Consultation[]): string[] => {
    try {
        // Helper: Dot Product
        const dot = (a: number[], b: number[]) => a.reduce((acc, val, i) => acc + val * b[i], 0);
        // Helper: Magnitude
        const mag = (v: number[]) => Math.sqrt(v.reduce((acc, val) => acc + val * val, 0));

        const results = consultations
            .filter(c => c.embedding && Array.isArray(c.embedding) && c.embedding.length === queryVector.length)
            .map(c => {
                const denominator = mag(queryVector) * mag(c.embedding!);
                const similarity = denominator === 0 ? 0 : dot(queryVector, c.embedding!) / denominator;
                return { id: c.id, score: similarity };
            })
            .filter(r => r.score > 0.20) // Lowered threshold (was 0.45) to ensure results appear
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        return results.map(r => r.id);
    } catch (e) {
        console.error("Local vector search error", e);
        return [];
    }
};
