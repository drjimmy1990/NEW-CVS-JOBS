// ===== CV Service Types =====
// Ported from cv-editor-maker-website/types.ts + enhanced for GrowthNexus

// --- Enums ---

export type CvLanguage = 'en' | 'ar' | 'bilingual';
export type CvSessionType = 'optimize' | 'create' | 'ats_convert';
export type CvInputMode = 'upload' | 'form' | 'paste';
export type CvSessionStatus = 'active' | 'processing' | 'ready' | 'downloaded' | 'archived';

// --- API Response Types ---

/** CV Optimizer AI response */
export interface CvOptimizeResult {
  type?: 'pdf_update' | 'chat_message';
  message?: string;
  optimizedText: string;
  pdfBase64: string;
  suggestions?: string[];
}

/** CV Finalize response */
export interface CvFinalizeResult {
  downloadUrl: string;
  sessionId: string;
}

/** ATS Convert response */
export interface CvAtsConvertResult {
  sessionId: string;
  downloadUrl: string;
  parsedData: CvParsedData;
}

/** Profile link response (user-initiated) */
export interface CvLinkProfileResult {
  success: boolean;
  message: string;
  cv_url?: string;
  error?: string;
}

// --- AI-Extracted Structured Data ---

/** Stored in cv_sessions.parsed_data — used for profile auto-link */
export interface CvParsedData {
  fullName: string;
  email: string;
  phone: string;
  skills: string[];
  yearsExperience: number;
  currentTitle: string;
  summary: string;
  experience: {
    title: string;
    company: string;
    duration: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
}

// --- CV Creator Form Types ---

export interface CvWorkExperience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface CvEducation {
  institution: string;
  degree: string;
  field: string;
  gradDate: string;
  gpa: string;
}

export interface CvSkill {
  name: string;
}

export interface CvLanguageEntry {
  name: string;
  proficiency: string;
}

export interface CvProject {
  name: string;
  date: string;
  description: string;
  link: string;
}

export interface CvCertification {
  name: string;
  org: string;
  date: string;
  link: string;
}

export interface CvAward {
  name: string;
  org: string;
  year: string;
}

export interface CustomSectionItem {
  title: string;
  description: string;
  date?: string;
  fields: { label: string; value: string }[];
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

/** Full CV form data — matches cv-editor-maker-website/types.ts:CvData */
export interface CvData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  photoBase64: string;
  summary: string;
  experience: CvWorkExperience[];
  education: CvEducation[];
  skills: CvSkill[];
  languages: CvLanguageEntry[];
  projects: CvProject[];
  certifications: CvCertification[];
  awards: CvAward[];
  hobbies: string;
  references: string;
  customSections: CustomSection[];
}

// --- Chat Message Types ---

export interface CvChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// --- DB Row Types ---

export interface DbCvSession {
  id: string;
  user_id: string;
  session_type: CvSessionType;
  input_mode: CvInputMode;
  language: CvLanguage;
  status: CvSessionStatus;
  original_pdf_url?: string;
  latest_draft_url?: string;
  final_pdf_url?: string;
  text_content?: string;
  form_data?: CvData;
  parsed_data?: CvParsedData;
  linked_to_profile: boolean;
  linked_at?: string;
  created_at: string;
}

export interface DbCvChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
