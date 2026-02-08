import { Consultation } from "../types";

// When served statically, the backend is the same origin (relative path)
// If running dev (port 3000), we point to 8000. If running prod (port 8000), we point to /
const isProd = window.location.port === '8000';
const BACKEND_URL = isProd ? '' : 'http://127.0.0.1:8000';

export const saveConsultationToDisk = async (consultation: Consultation): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_URL}/save_consultation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(consultation),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log(`Saved successfully to: ${result.path}`);
  } catch (error) {
    console.error("Failed to save consultation to disk:", error);
    alert("Error saving to local disk. Is the Python backend running? (python backend/main.py)");
    throw error;
  }
};