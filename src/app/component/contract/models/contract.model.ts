// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

export type ContractStatus =
  | 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';

export type ContractType =
  | 'SERVICE' | 'SUPPLIER' | 'NDA' | 'EMPLOYMENT' | 'LEASE' | 'MAINTENANCE' | 'OTHER';

export interface ApprovalStep {
  id?: number;
  stepOrder: number;
  approverId?: number;
  approverName?: string;
  approverRole?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  approvedAt?: string;
}

export interface DocumentMeta {
  id: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedByName: string;
  uploadedAt: string;
  documentCategory?: string;
}

export interface ContractObligation {
  id?: number;
  title: string;
  description?: string;
  obligationType?: string;
  party?: string;
  dueDate?: string;
  recurring?: boolean;
  recurrenceDays?: number;
  status?: string;
  assignedToName?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface ContractMessage {
  id?: number;
  senderId?: number;
  senderName: string;
  messageType?: 'INTERNAL' | 'EXTERNAL' | 'SYSTEM';
  subject?: string;
  body: string;
  read?: boolean;
  createdAt?: string;
}

export interface ContractSignature {
  id?: number;
  signerId?: number;
  signerName: string;
  signerRole?: string;
  signedAt?: string;
  ipAddress?: string;
}

export interface ContractVersion {
  id?: number;
  versionNumber: number;
  title?: string;
  content?: string;
  description?: string;
  notes?: string;
  renewalNotes?: string;
  changeSummary?: string;
  changedByName?: string;
  createdAt?: string;
}

export interface ContractTemplate {
  id?: number;
  name: string;
  contractType: string;
  description?: string;
  content?: string;
  lockedClauses?: string;
  global?: boolean;
  active?: boolean;
  companyId?: number;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contract {
  id?: number;
  contractNumber?: string;
  title: string;
  contractType: ContractType;
  contractTypeDisplay?: string;
  status?: ContractStatus;
  statusDisplay?: string;

  counterpartyName?: string;
  counterpartyType?: string;
  vendorId?: number;
  customerId?: number;

  value?: number;
  currency?: string;

  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  noticePeriodDays?: number;
  autoRenew?: boolean;
  daysUntilExpiry?: number;

  description?: string;
  notes?: string;
  content?: string;
  department?: string;
  renewalNotes?: string;
  templateId?: number;

  signedByName?: string;
  signedAt?: string;

  ownerId?: number;
  ownerName?: string;
  createdById?: number;
  createdByName?: string;
  updatedByName?: string;

  companyId?: number;
  createdAt?: string;
  updatedAt?: string;

  approvalSteps?: ApprovalStep[];
  documents?: DocumentMeta[];
  obligations?: ContractObligation[];
  messages?: ContractMessage[];
  signatures?: ContractSignature[];
  versions?: ContractVersion[];
}

export interface ContractStats {
  draft: number;
  pending_approval: number;
  active: number;
  expiring_soon: number;
  expired: number;
  terminated: number;
  renewed: number;
  expiring30Days: number;
  expiring90Days: number;
  expiring180Days: number;
  totalFinancialLiability?: number;
}

export interface ContractPage {
  contracts: Contract[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface ContractEnumItem {
  value: string;
  label: string;
}
