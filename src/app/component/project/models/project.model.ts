// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskComment {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ProjectTask {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: number;
  assigneeName?: string;
  dueDate?: string;
  sortOrder?: number;
  createdById?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  comments?: TaskComment[];
}

export interface ProjectTransaction {
  id: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description?: string;
  linkedEntityType?: string;
  linkedEntityId?: number;
  createdAt: string;
}

export interface Project {
  id: number;
  projectNumber: string;
  name: string;
  description?: string;
  customerId?: number;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  budget?: number;
  totalIncome?: number;
  totalExpenses?: number;
  profit?: number;
  ownerId?: number;
  ownerName?: string;
  createdById?: number;
  createdByName?: string;
  companyId?: number;
  createdAt: string;
  updatedAt?: string;
  tasks?: ProjectTask[];
  transactions?: ProjectTransaction[];
}

export interface ProjectPage {
  content: Project[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
}
