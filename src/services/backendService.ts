import { Consultation, KnowledgeGraphData } from "../types";

// Vite proxies /api to backend
const BACKEND_URL = '/api';

// Export for use by other services
export const backendUrl = BACKEND_URL; 

export const saveConsultationToDisk = async (consultation: Consultation): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_URL}/save_consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultation),
    });
    
    if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
    }
  } catch (error) {
    console.error("Save Consultation Error:", error);
    // Don't throw, just log. We don't want to break the UI flow if just the local backup fails
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

export const getPatientGraph = async (patientName: string): Promise<KnowledgeGraphData> => {
    try {
        const url = `${BACKEND_URL}/graph/patient/${encodeURIComponent(patientName)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Graph fetch failed");
        return await res.json();
    } catch (e) {
        console.error("Error fetching patient graph:", e);
        return { nodes: [], links: [] };
    }
};
