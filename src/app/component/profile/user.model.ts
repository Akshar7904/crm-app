// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

export interface UserModel {
  // ========== AUTHENTICATION & CORE USER FIELDS ==========
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  imageUrl?: string;
  enabled: boolean;
  notLocked: boolean;
  usingMfa: boolean;
  createdAt?: Date;

  // ========== ROLE & PERMISSIONS ==========
  roleName: string;
  permissions: string;
  authorities: string | string[];

  // ========== PROFILE INFORMATION ==========
  bio?: string;                // User biography

  // ========== EMPLOYEE FIELDS (NEW - Consolidated from Employee table) ==========

  // Employee Identification
  employeeId?: string;         // Auto-generated employee ID (e.g., LKC0001, LKC0002)

  // Personal Information
  dateOfBirth?: string;        // Date of birth (ISO format: YYYY-MM-DD)
  gender?: string;             // MALE, FEMALE, OTHER

  // Employment Information
  hireDate?: string;           // Date when employee was hired (ISO format)
  departmentId?: number;       // Foreign key to Department
  departmentName?: string;     // Department name (joined from Department table)
  designationId?: number;      // Foreign key to Designation
  designationTitle?: string;   // Designation/Job title (e.g., "Senior Developer", "HR Manager")
  baseSalary?: number;         // Base salary amount (ADMIN-ONLY - not shown to employees)
  employmentType?: string;     // FULL_TIME, PART_TIME, CONTRACT, INTERN
  status?: string;             // Active, Pending, Inactive, On Leave, Terminated

  // Location Information
  city?: string;               // City
  state?: string;              // State/Province (e.g., Gauteng)
  country?: string;            // Country (default: South Africa)
  postalCode?: string;         // Postal/ZIP code

  // Emergency Contact
  emergencyContactName?: string;   // Full name of emergency contact
  emergencyContactPhone?: string;  // Phone number of emergency contact

  // Banking Details (for Payroll)
  bankName?: string;               // Name of bank (e.g., FNB, Standard Bank, TymeBank)
  bankAccountNumber?: string;      // Bank account number
  accountHolderName?: string;      // Account holder's name
  branchCode?: string;             // Bank branch code
  accountType?: string;            // CURRENT, SAVINGS, CHEQUE

  // Multi-tenancy
  companyId?: number;              // The tenant company this user belongs to

  // System Tracking
  updatedAt?: Date;                // Last update timestamp

  // Manager Information (optional)
  managerId?: number;              // Foreign key to manager's user ID
  managerName?: string;            // Manager's full name (joined)
}

/**
 * Helper type for User with computed properties
 */
export interface UserWithComputed extends UserModel {
  fullName: string;                // firstName + lastName
  displayStatus: string;           // Formatted status
  isActive: boolean;               // status === 'Active'
  isPending: boolean;              // status === 'Pending'
  isProfileComplete: boolean;      // Has all required employee fields
}

/**
 * Factory function to create UserWithComputed from UserModel
 */
export function createUserWithComputed(user: UserModel): UserWithComputed {
  return {
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    displayStatus: user.status || 'Pending',
    isActive: user.status === 'Active',
    isPending: user.status === 'Pending',
    isProfileComplete: !!(
      user.employeeId &&
      user.departmentId &&
      user.designationId &&
      user.hireDate
    )
  };
}

/**
 * Type guard to check if UserModel has employee data
 */
export function hasEmployeeData(user: UserModel): boolean {
  return !!(user.employeeId && user.departmentId && user.designationId);
}

/**
 * Employment Type Enum (for type safety)
 */
export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN'
}

/**
 * Employee Status Enum (for type safety)
 */
export enum EmployeeStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  INACTIVE = 'Inactive',
  ON_LEAVE = 'On Leave',
  TERMINATED = 'Terminated'
}

/**
 * Gender Enum (for type safety)
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

/**
 * Account Type Enum (for banking)
 */
export enum AccountType {
  CURRENT = 'CURRENT',
  SAVINGS = 'SAVINGS',
  CHEQUE = 'CHEQUE'
}

/**
 * South African Banks Enum
 */
export enum SouthAfricanBanks {
  ABSA = 'ABSA',
  STANDARD_BANK = 'Standard Bank',
  FNB = 'FNB',
  NEDBANK = 'Nedbank',
  CAPITEC = 'Capitec',
  TYMEBANK = 'TymeBank',
  DISCOVERY_BANK = 'Discovery Bank',
  AFRICAN_BANK = 'African Bank'
}
