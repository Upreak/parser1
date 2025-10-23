
export type Role = 'Admin' | 'Recruiter';

export interface User {
  id: string;
  username: string; // This will now store the user's email
  role: Role;
}

export type ProviderName = 'Google Gemini' | 'OpenRouter' | 'Together AI';

export interface AiProvider {
  id: string;
  name: ProviderName;
  apiKey: string;
  baseURL?: string;
  parsingModel: string;
  matchingModel: string;
}

export type PipelineStage = string;

export interface PipelineSettings {
  stages: PipelineStage[];
}


export interface Candidate {
  id:string;
  name: string;
  email: string;
  phone: string;
  lastUpdated: number; // Timestamp of the last update
  pipelineStage?: PipelineStage;
  
  // New detailed fields
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  maritalStatus?: 'Single' | 'Married' | 'Other';
  languages?: string[];
  reservationCategory?: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'Other';
  
  highestEducation?: string;
  secondHighestEducation?: string;
  thirdHighestEducation?: string;
  diploma?: string;
  iti?: string;
  puc?: string;
  sslc?: string;
  certificates?: string[];
  
  totalExperience?: number;
  currentRole?: string;
  expectedRole?: string;
  jobType?: 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid';
  currentLocations?: string[];
  preferredLocations?: string[];
  readyToRelocate?: 'Yes' | 'No' | 'Open to Discussion';
  noticePeriod?: 'Immediate' | '15 Days' | '30 Days' | '45 Days' | '60 Days' | '90+ Days';

  currentCTC?: string;
  expectedCTC?: string;

  lookingForJobsAbroad?: 'Yes' | 'No';
  sectorType?: 'Government' | 'Private' | 'Both';
  preferredIndustries?: string[];
  
  hasCurrentOffers?: 'Yes' | 'No';
  bestTimeToContact?: string;
  preferredModeOfContact?: 'Call' | 'WhatsApp' | 'Email';

  // Existing fields
  skills: string[];
  experience: Experience[];
  education: Education[]; // Retained for compatibility but new fields are more specific
  summary: string;
  originalResume: OriginalResume;
  confidenceScores?: Record<string, number>;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
  startDate?: string;
  endDate?: string;
  toolsUsed?: string;
}

export interface Education {
  institution: string;
  degree: string;
  duration: string;
}

export interface OriginalResume {
    name: string;
    type: string;
    content: string; // base64 encoded content
}

export interface MatchedCandidate extends Candidate {
    matchScore: number;
    matchReason: string;
}

export interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export interface InterviewQuestions {
  technical: string[];
  behavioral: string[];
  situational: string[];
}
