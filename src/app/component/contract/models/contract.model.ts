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
