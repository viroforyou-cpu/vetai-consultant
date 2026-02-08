
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedInfo, Consultation, KnowledgeGraphData, Language } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getEmbedding = async (text: string): Promise<number[]> => {
  const ai = getAI();
  const response = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: text
  });
  
  // The response type only contains 'embeddings'
  const values = response.embeddings?.[0]?.values;

  if (!values) {
    throw new Error("Failed to generate embedding: No values found in response.");
  }
  return values;
};

export const transcribeAndSummarize = async (
  audioBase64: string,
  mimeType: string,
  language: Language
): Promise<{ transcription: string; summary: string }> => {
  const ai = getAI();
  const langText = language === 'es' ? 'Spanish' : 'English';
  
  const prompt = `
    You are an expert veterinary scribe. 
    1. Transcribe the audio of this consultation verbatim in ${langText}.
    2. Provide a concise 3-sentence summary of the clinical encounter in ${langText}.
    
    Return the result in JSON format with keys: "transcription" and "summary".
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { mimeType, data: audioBase64 } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          summary: { type: Type.STRING }
        },
        required: ["transcription", "summary"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(text);
};

export const extractClinicalData = async (transcription: string, language: Language): Promise<ExtractedInfo> => {
  const ai = getAI();
  const langText = language === 'es' ? 'Spanish' : 'English';
  
  const prompt = `
    Analyze the veterinary consultation transcription and extract structured data.
    Ensure all extracted values are in ${langText}.
    
    1. Administrative Data:
       - Name of veterinarian
       - Date
       - Name of owner
       - Name of patient
       - Breed
       - Species
       - Purpose of visit

    2. Clinical Data (Key Points):
       - Chief complaint
       - Examination findings
       - Diagnosis
       - Treatment
       - Recovery time
       - Follow-up
    
    Ensure the output is concise, professional, and formatted as JSON.
    The keys in the JSON must remain in English (e.g., "vetName", "diagnosis"), but the values must be in ${langText}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { text: transcription },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          administrative: {
            type: Type.OBJECT,
            properties: {
              vetName: { type: Type.STRING },
              date: { type: Type.STRING },
              ownerName: { type: Type.STRING },
              patientName: { type: Type.STRING },
              breed: { type: Type.STRING },
              species: { type: Type.STRING },
              visitPurpose: { type: Type.STRING },
            },
            required: ["vetName", "patientName", "species"]
          },
          clinical: {
            type: Type.OBJECT,
            properties: {
              chiefComplaint: { type: Type.STRING },
              examinationFindings: { type: Type.STRING },
              diagnosis: { type: Type.STRING },
              treatment: { type: Type.STRING },
              recoveryTime: { type: Type.STRING },
              followUp: { type: Type.STRING }
            },
            required: ["chiefComplaint", "examinationFindings", "diagnosis", "treatment"]
          }
        },
        required: ["administrative", "clinical"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to extract data");
  return JSON.parse(text) as ExtractedInfo;
};

export const semanticSearch = async (query: string, consultations: Consultation[]): Promise<string[]> => {
  if (consultations.length === 0) return [];
  const ai = getAI();
  
  const corpus = consultations.map(c => ({
    id: c.id,
    tag: c.uniqueTag,
    summary: c.summary,
    admin: c.extractedData?.administrative,
    clinical: c.extractedData?.clinical
  }));

  const prompt = `
    Perform a robust semantic search on the following veterinary consultation records.
    Query: "${query}"
    Records: ${JSON.stringify(corpus)}
    
    Goal: Find any records that are even remotely relevant to the query.
    1. Check for exact keyword matches (e.g., patient name, diagnosis).
    2. Check for contextual matches (e.g. query "broken leg" matches "fracture").
    
    Return a JSON array of strings containing the IDs of the relevant consultations.
    If uncertain, INCLUDE the record. Only return an empty array if absolutely nothing matches.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  const text = response.text;
  // Clean potential markdown blocks
  const cleanText = text?.replace(/```json|```/g, '').trim();
  return cleanText ? JSON.parse(cleanText) : [];
};

export const generateAnswerFromContext = async (query: string, results: Consultation[], language: Language): Promise<string> => {
  const ai = getAI();
  const langText = language === 'es' ? 'Spanish' : 'English';

  const context = results.map(c => `
    Patient: ${c.patientName}
    Date: ${c.extractedData?.administrative.date}
    Diagnosis: ${c.extractedData?.clinical.diagnosis}
    Treatment: ${c.extractedData?.clinical.treatment}
    Summary: ${c.summary}
    Full Transcription Snippet: ${c.transcription.substring(0, 1000)}...
  `).join('\n---\n');

  const prompt = `
    You are a veterinary AI assistant.
    User Question: "${query}"
    
    Context (Search Results):
    ${context}
    
    Instructions:
    1. Answer the user's question directly and specifically based ONLY on the provided Context.
    2. If the answer is found, be concise.
    3. If the answer is NOT in the context, say "I cannot find that information in the retrieved records."
    4. Respond in ${langText}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text || "No answer generated.";
};

// Updated signature to accept specific context
export const generateKnowledgeGraph = async (
  consultations: Consultation[], 
  patientContext?: { patientName: string, ownerName: string }, 
  language: Language = 'en'
): Promise<KnowledgeGraphData> => {
  const ai = getAI();
  const langText = language === 'es' ? 'Spanish' : 'English';
  
  const relevantConsults = patientContext
    ? consultations.filter(c => 
        c.patientName.trim().toLowerCase() === patientContext.patientName.trim().toLowerCase() &&
        c.ownerName.trim().toLowerCase() === patientContext.ownerName.trim().toLowerCase()
      )
    : []; // For graph generation, we now strictly require a selection, or logic needs to handle 'all'.
          // However, previous UI logic handled 'Show All'. Let's keep it safe:
  
  const finalConsults = relevantConsults.length > 0 ? relevantConsults : consultations;

  if (finalConsults.length === 0) return { nodes: [], links: [] };

  const inputData = finalConsults.map(c => ({
    date: new Date(c.timestamp).toLocaleDateString(),
    visitPurpose: c.extractedData?.administrative.visitPurpose || "Consultation",
    patient: c.patientName,
    owner: c.ownerName, // Include owner in prompt input
    summary: c.summary,
    clinical: c.extractedData?.clinical
  }));

  const prompt = `
    Act as a clinical knowledge graph generator for veterinary medicine.
    Analyze the following consultation records${patientContext ? ` specifically for patient "${patientContext.patientName}" (Owner: ${patientContext.ownerName})` : ""}.
    
    Construct a knowledge graph that visualizes the patient's history over time.
    Use ${langText} for all labels and relations.
    
    1. Generate Nodes assigned to these specific Groups:
       - Group 1: The Patient (Central Node). 
         ${patientContext ? `IMPORTANT: The label for this node MUST be exactly: "${patientContext.patientName} (Owner: ${patientContext.ownerName})"` : ""}
       - Group 5: Consultation Events (Nodes labeled by Date and Visit Purpose).
       - Group 2: Clinical Signs & Symptoms.
       - Group 3: Diagnoses & Pathology.
       - Group 4: Treatments & Medications.
    
    2. Generate Links (Hierarchy):
       - Link the Patient (Group 1) to each Consultation Event (Group 5).
       - Link each Consultation Event (Group 5) to the specific Symptoms, Diagnoses, and Treatments found in that visit.
       - Provide a short label for the relationship (e.g., "visited on", "presented with", "diagnosed as").
    
    Input Records:
    ${JSON.stringify(inputData)}
    
    Return JSON with "nodes" and "links".
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                group: { type: Type.INTEGER },
                label: { type: Type.STRING },
                details: { type: Type.STRING }
              },
              required: ["id", "group", "label"]
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                value: { type: Type.NUMBER },
                relation: { type: Type.STRING }
              },
              required: ["source", "target", "relation"]
            }
          }
        },
        required: ["nodes", "links"]
      }
    }
  });

  const text = response.text;
  return text ? JSON.parse(text) : { nodes: [], links: [] };
};

export const askGraphQuestion = async (graph: KnowledgeGraphData, question: string, language: Language): Promise<string> => {
  const ai = getAI();
  const langText = language === 'es' ? 'Spanish' : 'English';

  const prompt = `
    You are a veterinary expert assistant. You are provided with a Knowledge Graph of a patient's clinical history in JSON format.
    
    Graph Data:
    ${JSON.stringify(graph)}
    
    User Question: "${question}"
    
    Answer the question using ONLY the information provided in the graph data. 
    Answer in ${langText}.
    If the answer is not in the graph, state that the information is not available in the current records.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text || "No answer generated.";
};

export const searchPubMed = async (clinicalFeatures: string, language: Language) => {
  const ai = getAI();
  const langText = language === 'es' ? 'Spanish' : 'English';
  
  const prompt = `
    Search for recent veterinary medical literature or PubMed articles related to: ${clinicalFeatures}.
    Focus on prognosis, treatment options, and similar case studies.
    Provide a summary of findings in ${langText} and list the sources with URLs.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};
