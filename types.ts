
export enum UserRole {
  TEACHER = 'TEACHER',
  QC_HEAD = 'QC_HEAD'
}

export enum QuestionStatus {
  APPROVED = 'APPROVED',
  NEEDS_CORRECTION = 'NEEDS_CORRECTION',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING'
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  department: string;
}

export interface AuditLog {
  id: string;
  type: 'CONCEPTUAL' | 'NUMERICAL' | 'LOGICAL' | 'GRAMMATICAL';
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface QuestionVersion {
  versionNumber: 1 | 2 | 3; // v1: Original, v2: AI Corrected, v3: Final Approved
  question: string;
  options?: string[];
  correctAnswer?: string; // For numerical/subjective
  correctOptionIndex?: number; // For MCQ
  solution: string;
}

export interface QuestionData {
  id: string;
  topic: string;
  status: QuestionStatus;
  
  // Strict Version History
  v1_original: QuestionVersion;
  v2_ai_corrected?: QuestionVersion;
  v3_final_approved?: QuestionVersion;
  
  auditLogs: AuditLog[];
  redlineHtml: {
    question: string;
    options?: string[];
    solution: string;
  };
  
  isLocked: boolean;
  lastModified: number;
}

export interface Paper {
  id: string;
  title: string;
  subject: string;
  createdBy: string;
  creatorName: string;
  status: 'DRAFT' | 'PENDING_QC' | 'APPROVED_LOCKED';
  questions: QuestionData[];
  createdAt: number;
  lastSyncedAt?: number;
}
