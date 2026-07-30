// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

export type BankAccountType = 'CURRENT' | 'SAVINGS' | 'CREDIT';
export type BankTransactionType = 'DEBIT' | 'CREDIT';

export interface BankAccount {
  id?: number;
  name: string;
  bankName: string;
  accountNumber: string;
  accountType: BankAccountType;
  openingBalance: number;
  currentBalance: number;
  currency: string;
  active: boolean;
  notes?: string;
  companyId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankTransaction {
  id?: number;
  bankAccount: { id: number };
  date: string;
  description: string;
  amount: number;
  type: BankTransactionType;
  reference?: string;
  category?: string;
  reconciled: boolean;
  reconciledAt?: string;
  linkedEntityType?: string;
  linkedEntityId?: number;
  companyId?: number;
  createdAt?: string;
}

export interface BankingStats {
  total: number;
  active: number;
  totalBalance: number;
}

export const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  CURRENT: 'Current Account',
  SAVINGS: 'Savings Account',
  CREDIT:  'Credit Account'
};

export const TRANSACTION_CATEGORIES = [
  'Sales Income', 'Service Income', 'Rent', 'Utilities', 'Payroll',
  'Supplier Payment', 'Tax Payment', 'Bank Charges', 'Loan Repayment',
  'Asset Purchase', 'Refund', 'Transfer', 'Other'
];
