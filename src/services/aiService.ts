import { ExtractedInfo, Consultation, KnowledgeGraphData, Language, AIModel } from "../types";
import * as geminiService from "./geminiService";
import * as glmService from "./glmService";

// Get current AI model from environment
export const getCurrentAIModel = (): AIModel => {
  const model = process.env.AI_MODEL?.toLowerCase();
  return model === 'glm' ? 'glm' : 'gemini';
};

// Service selector functions
export const getEmbedding = async (text: string): Promise<number[]> => {
  const model = getCurrentAIModel();
  if (model === 'glm') {
    return glmService.getGLMEmbedding(text);
  }
  return geminiService.getEmbedding(text);
};

export const transcribeAndSummarize = async (
  audioBase64: string,
  mimeType: string,
  language: Language
): Promise<{ transcription: string; summary: string }> => {
  const model = getCurrentAIModel();
  if (model === 'glm') {
    return glmService.transcribeAndSummarizeGLM(audioBase64, mimeType, language);
  }
  return geminiService.transcribeAndSummarize(audioBase64, mimeType, language);
};

export const extractClinicalData = async (transcription: string, language: Language): Promise<ExtractedInfo> => {
  const model = getCurrentAIModel();
  if (model === 'glm') {
    return glmService.extractClinicalDataGLM(transcription, language);
  }
  return geminiService.extractClinicalData(transcription, language);
};

export const semanticSearch = async (query: string, consultations: Consultation[]): Promise<string[]> => {
  const model = getCurrentAIModel();
  if (model === 'glm') {
    return glmService.semanticSearchGLM(query, consultations);
  }
  return geminiService.semanticSearch(query, consultations);
};

export const generateAnswerFromContext = async (query: string, results: Consultation[], language: Language): Promise<string> => {
  const model = getCurrentAIModel();
  if (model === 'glm') {
    return glmService.generateAnswerFromContextGLM(query, results, language);
  }
  return geminiService.generateAnswerFromContext(query, results, language);
};

export const askGraphQuestion = async (graph: KnowledgeGraphData, question: string, language: Language): Promise<string> => {
  const model = getCurrentAIModel();
  if (model === 'glm') {
    return glmService.askGraphQuestionGLM(graph, question, language);
  }
  return geminiService.askGraphQuestion(graph, question, language);
};

export const searchPubMed = async (clinicalFeatures: string, language: Language) => {
  const model = getCurrentAIModel();
  if (model === 'glm') {
    return glmService.searchPubMedGLM(clinicalFeatures, language);
  }
  return geminiService.searchPubMed(clinicalFeatures, language);
};

export const generatePatientExecutiveSummary = async (consultations: Consultation[], language: Language): Promise<string> => {
  const model = getCurrentAIModel();
  if (model === 'glm') {
    return glmService.generatePatientExecutiveSummaryGLM(consultations, language);
  }
  return geminiService.generatePatientExecutiveSummary(consultations, language);
};

// Check which models are available
export const checkModelAvailability = () => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const glmKey = process.env.GLM_API_KEY;

  return {
    gemini: !!geminiKey && geminiKey !== 'AIzaSyYOUR_ACTUAL_API_KEY_HERE',
    glm: !!glmKey && glmKey !== 'your_glm_api_key_here'
  };
};

// Get model display info
export const getModelInfo = () => {
  const current = getCurrentAIModel();
  const available = checkModelAvailability();

  return {
    current,
    available,
    displayName: current === 'glm' ? 'GLM-4.6' : 'Gemini 2.5 Flash',
    canSwitch: available.gemini && available.glm
  };
};