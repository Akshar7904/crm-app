// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

// Bank options for the (searchable) Bank Name field on Add/Edit Employee.
// bankName is stored as free text, so this is a suggestion list, not an enum.
export const BANK_OPTIONS: string[] = [
  'Absa Bank',
  'Access Bank',
  'African Bank',
  'Albaraka Bank',
  'Bank Zero',
  'Bidvest Bank',
  'Capitec Bank',
  'Discovery Bank',
  'eNL Mutual Bank',
  'Finbond Mutual Bank',
  'First National Bank (FNB)',
  'GBS Mutual Bank',
  'HBZ Bank',
  'Investec Bank',
  'Nedbank',
  'Old Mutual Bank | OM Bank',
  'Postbank',
  'Rand Merchant Bank (RMB)',
  'Sasfin Bank',
  'Standard Bank',
  'TymeBank',
  'Other'
];

export interface Employee {
  id?: number;
  employeeId?: string;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  hireDate: string;
  departmentId?: number;
  departmentName?: string;
  designationId?: number;
  designationTitle?: string;
  baseSalary?: number;
  employmentType: string;
  status?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  idNumber?: string;
  imageUrl?: string;
  bio?: string;
  managerName?: string;
  createdAt?: string;
  updatedAt?: string;
  // Banking info
  bankName?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
  branchCode?: string;
  accountType?: string;
}


/**
 * Department Model
 */
export interface Department {
  id?: number;
  name: string;
  description?: string;
  managerId?: number;
  managerName?: string;
  employeeCount?: number;
  createdAt?: string;
}

/**
 * Designation Model
 */
export interface Designation {
  id?: number;
  title: string;
  description?: string;
  level?: string;
  employeeCount?: number;
  createdAt?: string;
}

/**
 * Employee Form (for creating/updating)
 */
export interface EmployeeForm {
  id?: number;
  employeeId?: string;  // LKxxxx format - admin can update
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  hireDate?: string;
  departmentId?: number;
  designationId?: number;
  designationTitle?: string;
  baseSalary?: number;
  employmentType?: string;
  status?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  idNumber?: string;
  bio?: string;
  userId?: number;
  // Banking info
  bankName?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
  branchCode?: string;
  accountType?: string;
}

export interface ApiResponse<T> {
  timeStamp: string;
  statusCode: number;
  status: string;
  message: string;
  data: T;
}


export interface PagedResponse<T> {
  employees: T[];
  page: number;
  totalPages: number;
  totalElements: number;
}

