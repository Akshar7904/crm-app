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
