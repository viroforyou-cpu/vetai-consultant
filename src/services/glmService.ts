import { ExtractedInfo, Consultation, KnowledgeGraphData, Language } from "../types";

// GLM-4.7 API configuration
const GLM_API_BASE_URL = process.env.GLM_API_URL || 'https://api.z.ai/api/anthropic';

const getGLMHeaders = () => ({
  'x-api-key': process.env.GLM_API_KEY || '',
  'Content-Type': 'application/json',
  'anthropic-version': '2023-06-01'
});

// Z.ai GLM model mapping (Anthropic-compatible endpoint)
const getGLMModel = () => {
  // Use GLM model names directly with Z.ai's Anthropic-compatible endpoint
  const model = process.env.GLM_MODEL || 'glm-4.7';
  console.log('[GLM] Using model:', model);
  return model;
};

// Helper function for GLM API calls (Anthropic-compatible format)
const callGLMAPI = async (messages: any[], useJsonFormat: boolean = false) => {
  // Try GLM model names in order (newest to oldest)
  const modelsToTry = [
    'glm-4.7',
    'glm-4.6',
    'glm-4.5',
    'glm-4.5-air',
    'glm-4',
  ];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[GLM API] Trying model: ${model}`);

      // Extract system message and user messages
      let systemMessage = '';
      const userMessages: any[] = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemMessage = msg.content;
        } else {
          userMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }

      const requestBody: any = {
        model: model,
        messages: userMessages,
        max_tokens: 2000,
        temperature: 0.3
      };

      if (systemMessage) {
        requestBody.system = systemMessage;
      }

      console.log(`[GLM API] Request with model ${model}:`, JSON.stringify(requestBody, null, 2));

      // Use Anthropic Messages API endpoint
      const response = await fetch(`${GLM_API_BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: getGLMHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log(`[GLM API] Model ${model} - Response status:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`[GLM API] Model ${model} - SUCCESS!`);

        // Extract content from Anthropic-format response
        let content = '';
        if (data.content && Array.isArray(data.content) && data.content[0]?.text) {
          content = data.content[0].text;
          console.log('[GLM API] Using content[0].text (Anthropic format)');
        } else if (data.choices && data.choices[0]?.message?.content) {
          content = data.choices[0].message.content;
          console.log('[GLM API] Using choices[0].message.content (OpenAI format)');
        } else if (data.message) {
          content = data.message;
        } else if (data.text) {
          content = data.text;
        } else if (typeof data === 'string') {
          content = data;
        } else {
          throw new Error(`Unknown response format: ${JSON.stringify(data)}`);
        }

        return content;
      } else {
        const errorText = await response.text();
        console.warn(`[GLM API] Model ${model} failed (${response.status}):`, errorText);
        lastError = new Error(`Model ${model} failed: ${response.status} - ${errorText}`);
        // Continue to next model
      }
    } catch (error) {
      console.warn(`[GLM API] Model ${model} error:`, error);
      lastError = error as Error;
      // Continue to next model
    }
  }

  // All models failed
  throw lastError || new Error('All GLM models failed. Check your API key and model access.');
};

export const getGLMEmbedding = async (text: string): Promise<number[]> => {
  console.log('[GLM Embedding] Generating embedding for:', text.substring(0, 50) + '...');

  // Use the dedicated embedding endpoint from environment
  const embeddingUrl = process.env.GLM_EMBEDDING_URL || `${GLM_API_BASE_URL}/v1/embeddings`;
  const embeddingModel = process.env.GLM_EMBEDDING_MODEL || 'glm-4.7';

  console.log('[GLM Embedding] Using endpoint:', embeddingUrl);
  console.log('[GLM Embedding] Using model:', embeddingModel);

  // Try multiple request formats for compatibility
  const formats = [
    // OpenAI-compatible format
    {
      body: {
        model: embeddingModel,
        input: text
      },
      description: 'OpenAI format'
    },
    // Zhipu AI format
    {
      body: {
        model: embeddingModel,
        input: [text]
      },
      description: 'Zhipu format'
    }
  ];

  for (const format of formats) {
    try {
      console.log(`[GLM Embedding] Trying ${format.description}:`, JSON.stringify(format.body));

      const response = await fetch(embeddingUrl, {
        method: 'POST',
        headers: getGLMHeaders(),
        body: JSON.stringify(format.body)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[GLM Embedding] Response:', data);

        // Handle different embedding response formats
        if (data.embedding) {
          return data.embedding;
        } else if (data.data && Array.isArray(data.data) && data.data[0]?.embedding) {
          return data.data[0].embedding;
        } else if (data.embeddings && Array.isArray(data.embeddings) && data.embeddings[0]) {
          return data.embeddings[0];
        } else {
          console.warn('[GLM Embedding] Unknown format, trying next format...');
        }
      } else {
        const errorText = await response.text();
        console.warn(`[GLM Embedding] ${format.description} failed (${response.status}):`, errorText);
      }
    } catch (error) {
      console.warn(`[GLM Embedding] ${format.description} error:`, error);
    }
  }

  throw new Error('GLM embedding failed with all formats. Please check GLM_EMBEDDING_URL and GLM_EMBEDDING_MODEL in .env');
};

export const transcribeAndSummarizeGLM = async (
  audioBase64: string,
  mimeType: string,
  language: Language
): Promise<{ transcription: string; summary: string }> => {
  const langText = language === 'es' ? 'Spanish' : 'English';

  const messages = [
    {
      role: "system",
      content: `You are an expert veterinary scribe. You will be given audio data that needs to be transcribed and summarized. Always respond in valid JSON format with "transcription" and "summary" keys.`
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Please transcribe this veterinary consultation audio verbatim in ${langText} and provide a concise 3-sentence summary of the clinical encounter in ${langText}. The audio format is ${mimeType}.`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${audioBase64}`
          }
        }
      ]
    }
  ];

  const result = await callGLMAPI(messages, true);

  try {
    const parsed = JSON.parse(result);
    return {
      transcription: parsed.transcription || '',
      summary: parsed.summary || ''
    };
  } catch (e) {
    // Fallback if JSON parsing fails
    const parts = result.split('\n\n');
    return {
      transcription: parts[0] || result,
      summary: parts[1] || 'Summary not available'
    };
  }
};

export const extractClinicalDataGLM = async (transcription: string, language: Language): Promise<ExtractedInfo> => {
  const langText = language === 'es' ? 'Spanish' : 'English';

  const messages = [
    {
      role: "system",
      content: `You are a veterinary data extraction expert. Extract structured data from consultation transcripts. Always respond in valid JSON format with the following structure: {"administrative": {...}, "clinical": {...}}. The keys should remain in English, but the values should be in ${langText}.`
    },
    {
      role: "user",
      content: `Extract structured data from this veterinary consultation transcript. Include administrative data (vetName, date, ownerName, patientName, breed, species, visitPurpose) and clinical data (chiefComplaint, examinationFindings, diagnosis, treatment, recoveryTime, followUp). All values should be in ${langText}.\n\nTranscript:\n${transcription}`
    }
  ];

  const result = await callGLMAPI(messages, true);

  try {
    return JSON.parse(result) as ExtractedInfo;
  } catch (e) {
    // Fallback structure
    return {
      administrative: {
        vetName: "Unknown",
        date: new Date().toISOString().split('T')[0],
        ownerName: "Unknown",
        patientName: "Unknown",
        breed: "Unknown",
        species: "Unknown",
        visitPurpose: "Consultation"
      },
      clinical: {
        chiefComplaint: "Not specified",
        examinationFindings: "Not specified",
        diagnosis: "Not specified",
        treatment: "Not specified",
        recoveryTime: "Unknown",
        followUp: "Not specified"
      }
    };
  }
};

export const semanticSearchGLM = async (query: string, consultations: Consultation[]): Promise<string[]> => {
  if (consultations.length === 0) return [];

  const corpus = consultations.map(c => ({
    id: c.id,
    summary: c.summary,
    diagnosis: c.extractedData?.clinical?.diagnosis || "",
    treatment: c.extractedData?.clinical?.treatment || ""
  }));

  const messages = [
    {
      role: "system",
      content: "You are a search engine for veterinary records. Return a JSON array of record IDs that match the query. Be inclusive - if uncertain, include the record."
    },
    {
      role: "user",
      content: `Query: "${query}"\n\nDatabase:\n${JSON.stringify(corpus)}\n\nReturn matching record IDs as a JSON array.`
    }
  ];

  const result = await callGLMAPI(messages, true);

  try {
    return JSON.parse(result);
  } catch (e) {
    // Fallback: return all IDs
    return consultations.map(c => c.id);
  }
};

export const generateAnswerFromContextGLM = async (query: string, results: Consultation[], language: Language): Promise<string> => {
  const langText = language === 'es' ? 'Spanish' : 'English';

  const context = results.map(c => `
    Patient: ${c.patientName}
    Date: ${c.extractedData?.administrative.date}
    Diagnosis: ${c.extractedData?.clinical.diagnosis}
    Treatment: ${c.extractedData?.clinical.treatment}
    Summary: ${c.summary}
    Full Transcription Snippet: ${c.transcription.substring(0, 1000)}...
  `).join('\n---\n');

  const messages = [
    {
      role: "system",
      content: `You are a veterinary AI assistant. Answer questions based ONLY on the provided context. If the answer is not in the context, say "I cannot find that information in the retrieved records." Respond in ${langText}.`
    },
    {
      role: "user",
      content: `User Question: "${query}"\n\nContext (Search Results):\n${context}\n\nPlease answer the question based only on this context.`
    }
  ];

  return await callGLMAPI(messages, false);
};

export const generatePatientExecutiveSummaryGLM = async (consultations: Consultation[], language: Language): Promise<string> => {
  const langText = language === 'es' ? 'Spanish' : 'English';

  if (consultations.length === 0) return "";

  const sorted = [...consultations].sort((a,b) => a.timestamp - b.timestamp);

  const historyText = sorted.map(c => `
    Date: ${c.extractedData?.administrative.date || new Date(c.timestamp).toLocaleDateString()}
    Summary: ${c.summary}
    Diagnosis: ${c.extractedData?.clinical.diagnosis || "N/A"}
  `).join('\n\n');

  const messages = [
    {
      role: "system",
      content: `You are a senior veterinary internist. Write professional executive summaries in ${langText}.`
    },
    {
      role: "user",
      content: `Review this chronological patient history and write a professional executive summary (1 paragraph) describing the progression of their condition, response to treatments, and any recurring patterns. Output in ${langText}.\n\nHistory:\n${historyText}`
    }
  ];

  return await callGLMAPI(messages, false);
};

export const askGraphQuestionGLM = async (graph: KnowledgeGraphData, question: string, language: Language): Promise<string> => {
  const langText = language === 'es' ? 'Spanish' : 'English';

  console.log('[GLM] Asking graph question:', question);
  console.log('[GLM] Graph data:', graph);

  const messages = [
    {
      role: "system",
      content: `You are a veterinary expert assistant. You analyze knowledge graphs of patient clinical history. Answer in ${langText}. If the answer is not in the graph data, state that the information is not available.`
    },
    {
      role: "user",
      content: `Knowledge Graph Data (JSON format):\n${JSON.stringify(graph, null, 2)}\n\nUser Question: "${question}"\n\nAnswer the question using ONLY the information provided in the graph data. If the answer is not available in the graph, say so clearly.`
    }
  ];

  try {
    const response = await callGLMAPI(messages, false);
    console.log('[GLM] Response received:', response);
    return response;
  } catch (error) {
    console.error('[GLM] Error asking graph question:', error);
    throw error;
  }
};