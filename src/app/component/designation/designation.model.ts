// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
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

// Seniority levels enum. Existing keys (JUNIOR/INTERMEDIATE/SENIOR/LEAD/
// MANAGER/EXECUTIVE) are kept as-is so designations saved before this list
// was expanded still resolve to a valid label — only their display text
// changed (see DESIGNATION_LEVEL_LABELS).
export enum DesignationLevel {
  LEARNER_APPRENTICE = 'LEARNER_APPRENTICE',
  INTERN_TRAINEE = 'INTERN_TRAINEE',
  OPERATIONAL_SUPPORT_STAFF = 'OPERATIONAL_SUPPORT_STAFF',
  ENTRY_LEVEL = 'ENTRY_LEVEL',
  JUNIOR = 'JUNIOR',
  INTERMEDIATE = 'INTERMEDIATE',
  SENIOR = 'SENIOR',
  SPECIALIST = 'SPECIALIST',
  LEAD = 'LEAD',
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER',
  SENIOR_MANAGER = 'SENIOR_MANAGER',
  HEAD_OF_DEPARTMENT = 'HEAD_OF_DEPARTMENT',
  GENERAL_MANAGER = 'GENERAL_MANAGER',
  DIRECTOR = 'DIRECTOR',
  EXECUTIVE = 'EXECUTIVE',
  MANAGING_DIRECTOR = 'MANAGING_DIRECTOR',
  OWNER_FOUNDER_PARTNER = 'OWNER_FOUNDER_PARTNER',
  BOARD_NON_EXECUTIVE_DIRECTOR = 'BOARD_NON_EXECUTIVE_DIRECTOR',
  OTHER = 'OTHER',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

// Display label for each level — needed because several labels contain
// pipes/multi-word text that naive "capitalize first letter" formatting
// can't produce from the enum key.
export const DESIGNATION_LEVEL_LABELS: Record<string, string> = {
  LEARNER_APPRENTICE: 'Learner | Apprentice',
  INTERN_TRAINEE: 'Intern | Trainee',
  OPERATIONAL_SUPPORT_STAFF: 'Operational | Support Staff',
  ENTRY_LEVEL: 'Entry Level',
  JUNIOR: 'Junior',
  INTERMEDIATE: 'Intermediate',
  SENIOR: 'Senior',
  SPECIALIST: 'Specialist',
  LEAD: 'Lead | Principal',
  SUPERVISOR: 'Supervisor',
  MANAGER: 'Manager',
  SENIOR_MANAGER: 'Senior Manager',
  HEAD_OF_DEPARTMENT: 'Head of Department',
  GENERAL_MANAGER: 'General Manager',
  DIRECTOR: 'Director',
  EXECUTIVE: 'Executive | C-Suite',
  MANAGING_DIRECTOR: 'Managing Director',
  OWNER_FOUNDER_PARTNER: 'Owner | Founder | Partner',
  BOARD_NON_EXECUTIVE_DIRECTOR: 'Board | Non-Executive Director',
  OTHER: 'Other',
  NOT_APPLICABLE: 'Not Applicable'
};

// Levels that keep their own badge color (see designation.component.scss);
// every other level (all the newly added ones) falls back to the neutral
// "level-unknown" style rather than getting 15 new bespoke colors.
export const COLORED_DESIGNATION_LEVELS = ['JUNIOR', 'INTERMEDIATE', 'SENIOR', 'LEAD', 'MANAGER', 'EXECUTIVE'];
