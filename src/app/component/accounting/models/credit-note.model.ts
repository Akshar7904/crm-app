// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

export type CreditNoteStatus = 'DRAFT' | 'ISSUED' | 'APPLIED' | 'VOIDED';

export interface CreditNoteCustomer {
  id: number;
  name: string;
  email?: string;
}

export interface CreditNote {
  id?: number;
  creditNoteNumber?: string;
  customer?: CreditNoteCustomer;
  customerId?: number;
  invoiceId?: number;
  issueDate?: string;
  status?: CreditNoteStatus;
  reason?: string;
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  total?: number;
  notes?: string;
  issuedByName?: string;
  issuedByEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditNoteStats {
  totalCreditNotes: number;
  draftCreditNotes: number;
  issuedCreditNotes: number;
  appliedCreditNotes: number;
  voidedCreditNotes: number;
  openValue: number;
}
