export interface Payroll {
  id?: number;
  employeeId: number;
  employeeName?: string;
  employeeNumber?: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentDate: string;

  // Earnings
  basicSalary: number;
  overtimePay: number;
  bonus: number;
  allowances: number;
  commission: number;
  grossSalary: number;

  // Deductions
  payeTax: number;
  uif: number;
  pensionFund: number;
  medicalAid: number;
  otherDeductions: number;
  totalDeductions: number;

  // Net salary
  netSalary: number;

  // Attendance
  daysWorked: number;
  daysAbsent: number;
  daysOnLeave: number;
  overtimeHours: number;

  // Status
  status: 'DRAFT' | 'PROCESSED' | 'PAID' | 'CANCELLED';
  paymentMethod: string;

  // Additional info
  remarks?: string;
  processedBy?: number;
  processedByName?: string;
  processedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollDTO {
  employeeId: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentDate: string;
  basicSalary?: number;
  overtimePay?: number;
  bonus?: number;
  allowances?: number;
  commission?: number;
  pensionFund?: number;
  medicalAid?: number;
  otherDeductions?: number;
  daysWorked?: number;
  daysAbsent?: number;
  daysOnLeave?: number;
  overtimeHours?: number;
  remarks?: string;
  paymentMethod?: string;
}
