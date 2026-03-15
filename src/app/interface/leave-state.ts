// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { DataState } from "../enum/datastate.enum";

/**
 * Leave entity interface
 */
export interface Leave {
  id?: number;
  employeeId: number;
  employeeName?: string;
  employeeEmail?: string;
  employeePhotoUrl?: string;
  leaveType: LeaveType;
  leaveTypeDescription?: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason?: string;
  status: LeaveStatus;
  statusDescription?: string;
  remarks?: string;
  rejectionReason?: string;
  doctorNoteAttached?: boolean;
  doctorNoteUrl?: string;
  doctorNoteFilename?: string;
  approvedById?: number;
  approvedByName?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Leave balance interface
 */
export interface LeaveBalance {
  id?: number;
  employeeId: number;
  employeeName?: string;
  leaveType: LeaveType;
  leaveTypeDescription?: string;
  year: number;
  totalEntitled: number;
  used: number;
  pending: number;
  available: number;
  carriedOver?: number;
}

/**
 * Leave type enumeration
 */
export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  FAMILY_RESPONSIBILITY = 'FAMILY_RESPONSIBILITY',
  MATERNITY = 'MATERNITY',
  PARENTAL = 'PARENTAL',
  ADOPTION = 'ADOPTION',
  STUDY = 'STUDY',
  UNPAID = 'UNPAID',
  SPECIAL = 'SPECIAL'
}

/**
 * Leave status enumeration
 */
export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

/**
 * Leave type display labels
 */
export const LEAVE_TYPE_LABELS: { [key in LeaveType]: string } = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  FAMILY_RESPONSIBILITY: 'Family Responsibility Leave',
  MATERNITY: 'Maternity Leave',
  PARENTAL: 'Parental Leave',
  ADOPTION: 'Adoption Leave',
  STUDY: 'Study Leave',
  UNPAID: 'Unpaid Leave',
  SPECIAL: 'Special Leave'
};

/**
 * Leave status display labels
 */
export const LEAVE_STATUS_LABELS: { [key in LeaveStatus]: string } = {
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled'
};

/**
 * Leave state for component state management
 */
export interface LeaveState {
  dataState: DataState;
  leaves?: Leave[];
  selectedLeave?: Leave;
  leaveBalances?: LeaveBalance[];
  error?: string;
  message?: string;
}

/**
 * Custom HTTP Response wrapper for leave data
 */
export interface LeaveHttpResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  totalElements?: number;
}

/**
 * Page wrapper for paginated leave data
 */
export interface LeavePage {
  content: Leave[];
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  size: number;
  number: number;
}

/**
 * Leave request form interface
 */
export interface LeaveRequest {
  employeeId: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason?: string;
  remarks?: string;
  doctorNoteAttached?: boolean;
}

/**
 * Leave approval form interface
 */
export interface LeaveApproval {
  leaveId: number;
  status: LeaveStatus;
  approvedBy: number;
  remarks?: string;
  rejectionReason?: string;
}

/**
 * Leave filter options
 */
export interface LeaveFilters {
  status?: LeaveStatus;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  search?: string;
}
