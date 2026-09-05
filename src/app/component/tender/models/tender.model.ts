// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

export type TenderStatus = 'NEW' | 'DECISION_REQUIRED' | 'IN_PROGRESS' | 'FINAL_REVIEW' | 'SUBMITTED' | 'CLOSED';
export type TenderGoNoGoDecision = 'PENDING' | 'GO' | 'NO_GO';
export type TenderOutcome = 'PENDING' | 'WON' | 'LOST' | 'CANCELLED';
export type TenderOutcomeReason = 'PRICE' | 'TECHNICAL_SCORE' | 'REFERENCES' | 'COMPLIANCE' | 'OTHER';
export type TenderTaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | 'OVERDUE';
export type TenderRequirementType = 'MANDATORY' | 'FUNCTIONALITY' | 'TECHNICAL' | 'COMMERCIAL';
export type TenderRequirementStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'AT_RISK' | 'COMPLETE';
export type TenderBidDocumentCategory = 'COVER_LETTER' | 'PROPOSAL' | 'SUPPORTING_SCHEDULE' | 'OTHER';
export type TenderFollowUpStatus = 'OPEN' | 'DONE';

export interface TenderTaskItem {
  id: number;
  tenderId: number;
  description: string;
  allocatedToId?: number;
  allocatedToName?: string;
  dueDate?: string;
  status: TenderTaskStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface TenderRequirement {
  id: number;
  tenderId: number;
  type: TenderRequirementType;
  description: string;
  ownerId?: number;
  ownerName?: string;
  status: TenderRequirementStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface TenderPricingLine {
  id: number;
  tenderId: number;
  itemName: string;
  description?: string;
  quantity: number;
  supplierName?: string;
  supplierReference?: string;
  unitCost: number;
  vatRate: number;
  profitMarkupPercent: number;
  totalCost?: number;
  profitAmount?: number;
  sellExclVat?: number;
  vatAmount?: number;
  totalInclVat?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TenderBidDocument {
  id: number;
  tenderId: number;
  category: TenderBidDocumentCategory;
  displayName?: string;
  description?: string;
  fileName?: string;
  contentType?: string;
  version: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TenderFollowUp {
  id: number;
  tenderId: number;
  description: string;
  dueDate?: string;
  status: TenderFollowUpStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Tender {
  id: number;
  tenderReference?: string;
  title: string;
  issuingOrganisation?: string;
  estimatedValue?: number;
  closingDate?: string;
  bidLeadId?: number;
  bidLeadName?: string;
  goNoGoOwnerId?: number;
  goNoGoOwnerName?: string;
  status: TenderStatus;
  goNoGoDecision: TenderGoNoGoDecision;
  goNoGoReason?: string;
  pricingFinalised?: boolean;
  attachmentFileName?: string;
  attachmentContentType?: string;
  outcome: TenderOutcome;
  outcomeReason?: TenderOutcomeReason;
  lessonLearned?: string;
  execSignOffRecorded?: boolean;
  fileNamesAndOrderChecked?: boolean;
  portalUploadTestCompleted?: boolean;
  proofOfSubmissionSaved?: boolean;
  companyId?: number;
  createdAt: string;
  updatedAt?: string;
  progressPercent?: number;
  supplierCostExclVat?: number;
  expectedProfit?: number;
  averageMarkupPercent?: number;
  finalSellExclVat?: number;
  finalVatAmount?: number;
  finalTotalInclVat?: number;
  tasks?: TenderTaskItem[];
  requirements?: TenderRequirement[];
  pricingLines?: TenderPricingLine[];
  bidDocuments?: TenderBidDocument[];
  followUps?: TenderFollowUp[];
}

export interface TenderPage {
  content: Tender[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface TenderDashboardStats {
  activeCount: number;
  closingSoonCount: number;
  submittedCount: number;
  wonCount: number;
  wonValue: number;
}

export interface TenderReport {
  submittedCount: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  winRatePercent: number;
  pipelineValueByStatus: Record<string, number>;
  lossReasons: Record<string, { count: number; percent: number }>;
  teamWorkload: Record<string, number>;
}
