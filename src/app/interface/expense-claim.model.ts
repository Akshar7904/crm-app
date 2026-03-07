// expense-claim.model.ts - Interfaces for Expense Claims

export interface ExpenseClaim {
  id?: number;
  claimNumber?: string;
  employeeId: number;
  employeeName?: string;
  employeeEmail?: string;
  claimDate: string;
  purpose: string;
  totalAmount?: number;
  status?: ExpenseClaimStatus;
  remarks?: string;
  rejectionReason?: string;
  approvedById?: number;
  approvedByName?: string;
  approvedAt?: string;
  paidAt?: string;
  expenseItems: ExpenseItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseItem {
  id?: number;
  expenseDate: string;
  payTo: string;
  description: string;
  amount: number;
  receiptUrl?: string;
  receiptAttached: boolean;
}

export enum ExpenseClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface ExpenseClaimApprovalForm {
  expenseClaimId: number;
  approvedBy: number;
  remarks?: string;
  rejectionReason?: string;
}

export interface ExpenseClaimForm {
  employeeId: number;
  claimDate: string;
  purpose?: string;
  remarks?: string;
  expenseItems: ExpenseItemForm[];
}

export interface ExpenseItemForm {
  expenseDate: string;
  payTo: string;
  description: string;
  amount: number;
  receiptUrl?: string;
  receiptAttached?: boolean;
}
