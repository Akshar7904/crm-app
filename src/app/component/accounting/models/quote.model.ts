// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHEQUE';

export interface QuoteCustomer {
  id: number;
  name: string;
  email?: string;
}

export interface Quote {
  id?: number;
  quoteNumber?: string;
  customer?: QuoteCustomer;
  customerId?: number;
  issueDate?: string;
  validUntil?: string;
  status?: QuoteStatus;
  services?: string;
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  total?: number;
  discount?: number;
  notes?: string;
  issuedByName?: string;
  issuedByEmail?: string;
  convertedToInvoiceId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteStats {
  totalQuotes: number;
  draftQuotes: number;
  sentQuotes: number;
  acceptedQuotes: number;
  convertedQuotes: number;
  openQuotesValue: number;
  conversionRate: number;
}
