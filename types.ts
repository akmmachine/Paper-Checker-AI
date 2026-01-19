
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

export interface QuestionData {
  id: string;
  topic: string;
  original: {
    question: string;
    options?: string[];
    correctOptionIndex?: number;
    correctAnswer?: string;
    solution: string;
  };
  audit?: {
    status: QuestionStatus;
    logs: AuditLog[];
    redlines: {
      question: string;
      options?: string[];
      correctAnswer?: string;
      solution: string;
    };
    clean: {
      question: string;
      options?: string[];
      correctOptionIndex?: number;
      correctAnswer?: string;
      solution: string;
    };
  };
  version: number;
  lastModified: number;
}

export interface Paper {
  id: string;
  title: string;
  subject: string;
  createdBy: string; // User ID
  creatorName: string;
  status: 'DRAFT' | 'PENDING_QC' | 'APPROVED' | 'REJECTED';
  questions: QuestionData[];
  createdAt: number;
  lastSyncedAt?: number;
}
