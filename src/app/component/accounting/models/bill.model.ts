// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

export type BillStatus = 'DRAFT' | 'RECEIVED' | 'DUE' | 'PAID' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHEQUE';

export interface Bill {
  id?: number;
  billNumber?: string;
  vendor?: { id: number; vendorName: string };
  account?: { id: number; accountCode: string; accountName: string };
  issueDate: string;
  dueDate: string;
  status: BillStatus;
  description?: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface BillStats {
  total: number;
  draft: number;
  unpaid: number;
  paid: number;
  overdue: number;
  outstanding: number;
}
