// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

/**
 * Department model interface
 */
export interface Department {
  id?: number;
  name: string;
  description?: string;
  managerId?: number;
  managerName?: string;
  employeeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Department form data
 */
export interface DepartmentForm {
  name: string;
  description?: string;
  managerId?: number;
}

/**
 * Employee interface for manager dropdown
 */
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status?: string;
  departmentId?: number;
  designationId?: number;
}
