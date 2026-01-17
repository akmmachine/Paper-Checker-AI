
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
    options: string[];
    correctOptionIndex: number;
    solution: string;
  };
  audit?: {
    status: QuestionStatus;
    logs: AuditLog[];
    redlines: {
      question: string; // HTML-like string with <del> and <ins>
      options: string[];
      solution: string;
    };
    clean: {
      question: string;
      options: string[];
      correctOptionIndex: number;
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
  createdBy: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'LOCKED';
  questions: QuestionData[];
  createdAt: number;
}
