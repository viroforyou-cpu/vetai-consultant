import { Consultation } from "../types";

const BACKEND_URL = 'http://localhost:8000';

export const saveConsultationToDisk = async (consultation: Consultation): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_URL}/save_consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultation),
    });
    if (!response.ok) throw new Error("Backend save failed");
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const loadConsultationsFromDisk = async (): Promise<Consultation[]> => {
    try {
        const res = await fetch(`${BACKEND_URL}/consultations`);
        if(res.ok) return await res.json();
        return [];
    } catch(e) {
        console.error("Failed to load from disk", e);
        return [];
    }
};

export const getLocalEmbedding = async (text: string): Promise<number[]> => {
    try {
        const res = await fetch(`${BACKEND_URL}/embed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error("Embedding failed");
        const data = await res.json();
        return data.embedding;
    } catch (e) {
        console.error(e);
        throw e;
    }
}