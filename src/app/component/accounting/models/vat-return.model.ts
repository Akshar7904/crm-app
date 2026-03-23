// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

export type VatReturnStatus = 'DRAFT' | 'FILED' | 'PAID' | 'OVERDUE';

export interface VatReturn {
  id?: number;
  returnReference?: string;
  periodYear?: number;
  periodMonth?: number;
  periodStart?: string;
  periodEnd?: string;
  outputVat?: number;
  inputVatBills?: number;
  inputVatExpenses?: number;
  totalInputVat?: number;
  netVatPayable?: number;
  totalSalesExclVat?: number;
  totalPurchasesExclVat?: number;
  status?: VatReturnStatus;
  dueDate?: string;
  filedDate?: string;
  notes?: string;
  filedByName?: string;
  filedByEmail?: string;
  createdAt?: string;
}

export interface VatCalculation {
  year: number;
  month: number;
  periodLabel: string;
  outputVat: number;
  inputVatBills: number;
  inputVatExpenses: number;
  totalInputVat: number;
  netVatPayable: number;
  totalSalesExclVat: number;
  totalPurchasesExclVat: number;
  returnExists: boolean;
  existingReturnId?: number;
}

export interface VatStats {
  total: number;
  draft: number;
  filed: number;
  paid: number;
  overdue: number;
}
