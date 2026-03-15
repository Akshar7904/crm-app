// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Employee } from '../component/employee/employee.model';
import { UserModel } from '../component/profile/user.model';

/**
 * Employee State - represents the state of a single employee view
 */
export interface EmployeeState {
  user: UserModel;
  employee: Employee;
}

/**
 * Employee Stats - for dashboard statistics
 */
export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees?: number;
  onLeaveEmployees?: number;
  newHiresThisMonth?: number;
}

export { Employee };

