import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedInfo, Consultation, KnowledgeGraphData, Language } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  
  // Minimal corpus to save tokens, but include clinical data for better matching
  const corpus = consultations.map(c => ({
    id: c.id,
    summary: c.summary,
    diagnosis: c.extractedData?.clinical?.diagnosis || "",
    treatment: c.extractedData?.clinical?.treatment || ""
  }));

  const prompt = `
    You are a search engine for veterinary records.
    Query: "${query}"
    
    Database (JSON): 
    ${JSON.stringify(corpus)}
    
    Task: Return a JSON array of "id" strings for all records that are relevant to the query.
    - If the query is broad (e.g. "medications", "cats", "treatment"), include all records that fit.
    - If specific, include only specific matches.
    - If uncertain, include the record to be safe.
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
  // Clean potential markdown blocks just in case
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

export const generatePatientExecutiveSummary = async (consultations: Consultation[], language: Language): Promise<string> => {
  const ai = getAI();
  const langText = language === 'es' ? 'Spanish' : 'English';
  
  if (consultations.length === 0) return "";

  const sorted = [...consultations].sort((a,b) => a.timestamp - b.timestamp);

  const historyText = sorted.map(c => `
    Date: ${c.extractedData?.administrative.date || new Date(c.timestamp).toLocaleDateString()}
    Summary: ${c.summary}
    Diagnosis: ${c.extractedData?.clinical?.diagnosis || "N/A"}
  `).join('\n\n');

  const prompt = `
    Act as a senior veterinary internist. 
    Review this chronological history of a patient:
    ${historyText}

    Write a professional executive summary (1 paragraph) describing the progression of their condition, response to treatments, and any recurring patterns. 
    Output in ${langText}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text || "Summary not available.";
};