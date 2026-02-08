import { ExtractedInfo, KnowledgeGraphData, Language, Consultation } from "../types";

const getApiKey = () => process.env.GROQ_API_KEY;

// 1. Audio Transcription (Whisper Large V3)
export const transcribeAudio = async (audioFile: File): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("model", "whisper-large-v3");
  formData.append("response_format", "json");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: formData
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq Transcription Error: ${err}`);
  }

  const data = await response.json();
  return data.text;
};

// 2. Summarization (Llama3 70B)
export const summarizeText = async (text: string, language: Language): Promise<string> => {
  const apiKey = getApiKey();
  const langPrompt = language === 'es' ? 'Spanish' : 'English';
  
  const prompt = `Provide a concise 3-sentence summary of this veterinary consultation in ${langPrompt}.\n\nText: ${text}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

// 3. Data Extraction (Llama3 70B - JSON Mode)
export const extractClinicalData = async (transcription: string, language: Language): Promise<ExtractedInfo> => {
  const apiKey = getApiKey();
  const langPrompt = language === 'es' ? 'Spanish' : 'English';

  const systemPrompt = `
    You are a veterinary scribe. Extract structured data from the text in JSON format.
    Ensure values are in ${langPrompt}.
    Required JSON structure:
    {
      "administrative": { "vetName": "", "date": "", "ownerName": "", "patientName": "", "breed": "", "species": "", "visitPurpose": "" },
      "clinical": { "chiefComplaint": "", "examinationFindings": "", "diagnosis": "", "treatment": "", "recoveryTime": "", "followUp": "" }
    }
  `;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcription }
      ],
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  return JSON.parse(content);
};

// 4. Knowledge Graph (Llama3 70B - JSON Mode)
export const generateKnowledgeGraph = async (
  consultations: Consultation[], 
  patientContext?: { patientName: string, ownerName: string }, 
  language: Language = 'en'
): Promise<KnowledgeGraphData> => {
  const apiKey = getApiKey();
  const langText = language === 'es' ? 'Spanish' : 'English';
  
  const relevantConsults = patientContext
    ? consultations.filter(c => 
        c.patientName.trim().toLowerCase() === patientContext.patientName.trim().toLowerCase() &&
        c.ownerName.trim().toLowerCase() === patientContext.ownerName.trim().toLowerCase()
      )
    : consultations;

  if (relevantConsults.length === 0) return { nodes: [], links: [] };

  const inputData = relevantConsults.map(c => ({
    date: new Date(c.timestamp).toLocaleDateString(),
    patient: c.patientName,
    summary: c.summary,
    diagnosis: c.extractedData?.clinical.diagnosis,
    treatment: c.extractedData?.clinical.treatment
  }));

  const systemPrompt = `
    Generate a knowledge graph JSON from the input records.
    Labels in ${langText}.
    Groups: 1=Patient, 2=Symptom, 3=Diagnosis, 4=Treatment, 5=Consultation.
    Structure: { "nodes": [{"id": "...", "group": 1, "label": "..."}], "links": [{"source": "...", "target": "...", "relation": "..."}] }
    Central Node must be the Patient. Link Patient -> Consultations -> Clinical details.
  `;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(inputData) }
      ],
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0]?.message?.content);
};

// 5. RAG Answer (Llama3 70B)
export const generateAnswerFromContext = async (query: string, results: Consultation[], language: Language): Promise<string> => {
  const apiKey = getApiKey();
  const langText = language === 'es' ? 'Spanish' : 'English';

  const context = results.map(c => `
    Date: ${c.extractedData?.administrative.date}
    Patient: ${c.patientName}
    Summary: ${c.summary}
    Diagnosis: ${c.extractedData?.clinical.diagnosis}
    Treatment: ${c.extractedData?.clinical.treatment}
  `).join('\n---\n');

  const prompt = `
    Context:
    ${context}
    
    Question: ${query}
    
    Answer the question specifically using the context above in ${langText}.
  `;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || "No answer.";
};

// 6. Semantic Search (Hybrid Fallback)
export const semanticSearch = async (query: string, consultations: Consultation[]): Promise<string[]> => {
  // Groq doesn't do embeddings well natively yet, so we use Llama 3 to "select" relevant IDs
  const apiKey = getApiKey();
  
  const corpus = consultations.map(c => ({ id: c.id, text: `${c.patientName} ${c.summary} ${c.extractedData?.clinical.diagnosis}` }));
  
  const prompt = `
    Query: "${query}"
    Records: ${JSON.stringify(corpus)}
    
    Return a JSON array of string IDs for records that match the query.
    { "ids": ["id1", "id2"] }
  `;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const json = JSON.parse(data.choices[0]?.message?.content);
  return json.ids || [];
};