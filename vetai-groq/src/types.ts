export type Language = 'en' | 'es';

export interface AdminData {
  vetName: string;
  date: string;
  ownerName: string;
  patientName: string;
  breed: string;
  species: string;
  visitPurpose: string;
}

export interface ClinicalData {
  chiefComplaint: string;
  examinationFindings: string;
  diagnosis: string;
  treatment: string;
  recoveryTime: string;
  followUp: string;
}

export interface ExtractedInfo {
  administrative: AdminData;
  clinical: ClinicalData;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; 
}

export interface Consultation {
  id: string;
  timestamp: number;
  uniqueTag: string;
  vetName: string;
  ownerName: string;
  patientName: string;
  audioFileName?: string;
  attachments: Attachment[];
  transcription: string;
  summary: string;
  extractedData?: ExtractedInfo;
  tags?: string[];
  embedding?: number[]; 
}

export interface GraphNode {
  id: string;
  group: number;
  label: string;
  details?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
  relation: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export type ViewState = 'upload' | 'search' | 'graph' | 'analytics';