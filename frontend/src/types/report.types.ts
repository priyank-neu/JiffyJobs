export enum ReportType {
  TASK = 'TASK',
  USER = 'USER',
  MESSAGE = 'MESSAGE',
  REVIEW = 'REVIEW',
}

export enum ReportStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface Report {
  reportId: string;
  type: ReportType;
  targetId: string;
  reporterId: string;
  reason: string;
  evidence?: string[];
  status: ReportStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  // Type-specific data
  task?: {
    taskId: string;
    title: string;
  };
  reportedUser?: {
    userId: string;
    name: string;
    email: string;
  };
  message?: {
    messageId: string;
    body: string;
  };
  review?: {
    reviewId: string;
    rating: number;
    comment?: string;
  };
  reporter: {
    userId: string;
    name: string;
    email: string;
  };
}

export interface ReportMetrics {
  total: {
    OPEN: number;
    RESOLVED: number;
    CLOSED: number;
  };
  byType: {
    TASK: { OPEN: number; RESOLVED: number; CLOSED: number };
    USER: { OPEN: number; RESOLVED: number; CLOSED: number };
    MESSAGE: { OPEN: number; RESOLVED: number; CLOSED: number };
    REVIEW: { OPEN: number; RESOLVED: number; CLOSED: number };
  };
}

export interface AuditLog {
  auditLogId: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  reportId?: string;
  details?: Record<string, unknown>;
  notes?: string;
  createdAt: string;
  admin: {
    userId: string;
    name: string;
    email: string;
  };
}

export interface CreateReportData {
  type: ReportType;
  targetId: string;
  reason: string;
  evidence?: string[];
}

