// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

// Enumerations
export enum AssetCategory {
  LAPTOP = 'LAPTOP',
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  PHONE = 'PHONE',
  MONITOR = 'MONITOR',
  KEYBOARD = 'KEYBOARD',
  MOUSE = 'MOUSE',
  HEADSET = 'HEADSET',
  PRINTER = 'PRINTER',
  SCANNER = 'SCANNER',
  PROJECTOR = 'PROJECTOR',
  CAMERA = 'CAMERA',
  FURNITURE = 'FURNITURE',
  VEHICLE = 'VEHICLE',
  SOFTWARE_LICENSE = 'SOFTWARE_LICENSE',
  OTHER = 'OTHER'
}

export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  RESERVED = 'RESERVED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  RETIRED = 'RETIRED',
  LOST = 'LOST',
  DAMAGED = 'DAMAGED'
}

export enum AssetCondition {
  NEW = 'NEW',
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR'
}

export enum AssignmentStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
  LOST = 'LOST'
}

export enum AssetRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  FULFILLED = 'FULFILLED'
}

export enum AssetRequestType {
  NEW = 'NEW',
  REPLACEMENT = 'REPLACEMENT',
  UPGRADE = 'UPGRADE',
  TEMPORARY = 'TEMPORARY'
}

export enum AssetRequestPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Main Interfaces
export interface Asset {
  id: number;
  assetTag: string;
  name: string;
  description?: string;
  category: AssetCategory;
  status: AssetStatus;
  condition: AssetCondition;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  location?: string;
  notes?: string;
  imageUrl?: string;
  currentAssigneeId?: number;
  currentAssigneeName?: string;
  assignedById?: number;
  assignedByName?: string;
  assignedDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AssetRequest {
  id: number;
  requesterId: number;
  requesterName: string;
  requesterEmail?: string;
  assetCategory: AssetCategory;
  requestType: AssetRequestType;
  priority: AssetRequestPriority;
  justification: string;
  status: AssetRequestStatus;
  approvedById?: number;
  approvedByName?: string;
  approvalDate?: Date;
  approvalNotes?: string;
  rejectionReason?: string;
  fulfilledById?: number;
  fulfilledByName?: string;
  fulfillmentDate?: Date;
  assignedAssetId?: number;
  assignedAssetTag?: string;
  expectedReturnDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AssetAssignment {
  id: number;
  assetId: number;
  assetTag: string;
  assetName: string;
  employeeId: number;
  employeeName: string;
  employeeEmail?: string;
  assignedById: number;
  assignedByName: string;
  assignmentDate: Date;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
  returnedToId?: number;
  returnedToName?: string;
  status: AssignmentStatus;
  conditionOnAssignment: AssetCondition;
  conditionOnReturn?: AssetCondition;
  assignmentNotes?: string;
  returnNotes?: string;
  acknowledgementDate?: Date;
  acknowledged?: boolean;
  requestId?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AssetStatistics {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  underMaintenanceAssets: number;
  pendingRequests: number;
  activeAssignments: number;
  overdueAssignments: number;
  assetsByCategory: { [key: string]: number };
  availableByCategory: { [key: string]: number };
}

// Form Interfaces
export interface AssetForm {
  assetTag: string;
  name: string;
  description?: string;
  category: AssetCategory;
  status: AssetStatus;
  condition: AssetCondition;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  location?: string;
  notes?: string;
}

export interface AssetRequestForm {
  requesterId: number;
  requesterName: string;
  assetCategory: AssetCategory;
  requestType: AssetRequestType;
  priority: AssetRequestPriority;
  purpose: string;
  justification: string;
  expectedReturnDate?: string;
}

export interface AssetRequestApprovalForm {
  requestId: number;
  approvedById: number;
  approvedByName: string;
  approvalNotes?: string;
  rejectionReason?: string;
}

export interface AssetAssignmentForm {
  assetId: number;
  employeeId: number;
  employeeName: string;
  assignedById: number;
  assignedByName: string;
  expectedReturnDate?: string;
  conditionOnAssignment: AssetCondition;
  assignmentNotes?: string;
}

export interface AssetReturnForm {
  assignmentId: number;
  returnedToId: number;
  returnedToName: string;
  conditionOnReturn: AssetCondition;
  notes?: string;
}

export interface AssetFulfillmentForm {
  requestId: number;
  assetId: number;
  fulfilledById: number;
  fulfilledByName: string;
  conditionOnAssignment: AssetCondition;
  expectedReturnDate?: string;
  notes?: string;
}
