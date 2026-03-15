// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

/**
 * Designation model and form interfaces
 */

export interface Designation {
  id?: number;
  title: string;
  description?: string;
  level?: string;
  createdAt?: string;
  employeeCount?: number;
}

export interface DesignationForm {
  title: string;
  description?: string;
  level?: string;
}

// Designation levels enum
export enum DesignationLevel {
  JUNIOR = 'JUNIOR',
  INTERMEDIATE = 'INTERMEDIATE',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
  MANAGER = 'MANAGER',
  EXECUTIVE = 'EXECUTIVE'
}
