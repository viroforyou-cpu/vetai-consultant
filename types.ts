
export type Language = 'en' | 'es';

export enum Species {
  DOG = 'Dog',
  CAT = 'Cat',
  BIRD = 'Bird',
  HORSE = 'Horse',
  OTHER = 'Other',
  UNKNOWN = 'Unknown'
}

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
  data: string; // Base64 string
}

export interface Consultation {
  id: string;
  timestamp: number;
  uniqueTag: string;
  
  // Manual Inputs
  vetName: string;
  ownerName: string;
  patientName: string;
  
  // Files
  audioFileName?: string;
  attachments: Attachment[];

  // Generated
  transcription: string;
  summary: string;
  
  // The structured extracted data
  extractedData?: ExtractedInfo;

  // Tags
  tags?: string[];
  
  // Local Vector Search
  embedding?: number[]; 
}

export interface GraphNode {
  id: string;
  group: number; // 1: Patient, 2: Symptom, 3: Diagnosis, 4: Medication, 5: Consultation Event
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

export type ViewState = 'upload' | 'search' | 'graph' | 'pubmed' | 'analytics' | 'appointment';

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
