// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'COMPLETED';
export type RiskIssueType = 'RISK' | 'ISSUE' | 'DEPENDENCY' | 'DECISION';
export type RiskIssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type RiskIssueStatus = 'OPEN' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';
export type ProjectDocumentType =
  | 'PROPOSAL_QUOTE' | 'CONTRACT_PO' | 'PROJECT_PLAN' | 'CUSTOMER_DOCUMENTS'
  | 'DELIVERABLES' | 'MEETING_MINUTES' | 'REPORTS' | 'FINANCIAL_DOCUMENTS'
  | 'SUPPORTING_DOCUMENTS' | 'FINAL_CLOSURE_DOCUMENTS' | 'OTHER';

export interface TaskComment {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ProjectTask {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: number;
  assigneeName?: string;
  dueDate?: string;
  sortOrder?: number;
  milestoneId?: number;
  createdById?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  comments?: TaskComment[];
}

export interface ProjectTransaction {
  id: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description?: string;
  linkedEntityType?: string;
  linkedEntityId?: number;
  createdAt: string;
}

export interface MilestoneAttachment {
  id: number;
  fileName: string;
  contentType?: string;
  fileSize?: number;
  uploadedByName?: string;
  uploadedAt: string;
}

export interface Milestone {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  status: MilestoneStatus;
  targetDate: string;
  actualDate?: string;
  sortOrder?: number;
  dependsOnMilestoneId?: number;
  dependsOnMilestoneName?: string;
  progressPercent?: number;
  overdue?: boolean;
  reviewedById?: number;
  reviewedByName?: string;
  createdById?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: MilestoneAttachment[];
}

export interface ProjectMember {
  id: number;
  projectId: number;
  employeeId: number;
  employeeName: string;
  roleLabel?: string;
  addedById?: number;
  addedByName?: string;
  createdAt: string;
}

export interface ProjectRiskIssue {
  id: number;
  projectId: number;
  type: RiskIssueType;
  description: string;
  severity: RiskIssueSeverity;
  ownerId?: number;
  ownerName?: string;
  dueDate?: string;
  status: RiskIssueStatus;
  createdById?: number;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectDocument {
  id: number;
  projectId: number;
  documentType: ProjectDocumentType;
  fileName: string;
  contentType?: string;
  fileSize?: number;
  description?: string;
  uploadedByUserId?: number;
  uploadedByName?: string;
  uploadedAt?: string;
}

export interface Project {
  id: number;
  projectNumber: string;
  name: string;
  description?: string;
  customerId?: number;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  budget?: number;
  totalIncome?: number;
  totalExpenses?: number;
  profit?: number;
  projectValue?: number;
  invoiced?: number;
  paid?: number;
  forecastCost?: number;
  remainingBudget?: number;
  outstanding?: number;
  forecastProfit?: number;
  margin?: number;
  closureTasksComplete?: boolean;
  closureDeliverablesComplete?: boolean;
  closureCustomerSignoff?: boolean;
  closureFinalInvoiceRaised?: boolean;
  closureOutstandingPaymentsCaptured?: boolean;
  closureDocumentsArchived?: boolean;
  closureFinancialsFinalised?: boolean;
  closureLessonsCaptured?: boolean;
  closureApproved?: boolean;
  closureItemsComplete?: number;
  closureComplete?: boolean;
  closedAt?: string;
  closedById?: number;
  closedByName?: string;
  ownerId?: number;
  ownerName?: string;
  createdById?: number;
  createdByName?: string;
  companyId?: number;
  createdAt: string;
  updatedAt?: string;
  tasks?: ProjectTask[];
  milestones?: Milestone[];
  transactions?: ProjectTransaction[];
  members?: ProjectMember[];
  risks?: ProjectRiskIssue[];
  documents?: ProjectDocument[];
}

export interface ProjectPage {
  content: Project[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
}
