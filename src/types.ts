export type Language = 'en' | 'es';

export enum Species {
  DOG = 'Dog',
  CAT = 'Cat',
  BIRD = 'Bird',
  HORSE = 'Horse',
  OTHER = 'Other',
  UNKNOWN = 'Unknown'
}
export type AIModel = 'gemini' | 'glm';

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
  relation: string;
  value?: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export type ViewState = 'upload' | 'search' | 'graph' | 'analytics' | 'history' | 'appointment';

export interface Appointment {
  id: string;
  timestamp: number;

  // Patient Information
  patientName: string;
  ownerName: string;
  species: Species;
  breed?: string;

  // Appointment Details
  appointmentDate: string; // ISO date string
  appointmentTime: string; // HH:MM format
  duration: number; // minutes
  appointmentType: 'wellness' | 'consultation' | 'emergency' | 'follow-up' | 'surgery' | 'vaccination' | 'other';

  // Clinical Information
  reason: string;
  notes?: string;

  // Status
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

  // Consultation Link (optional - if appointment results in a consultation)
  consultationId?: string;
}
