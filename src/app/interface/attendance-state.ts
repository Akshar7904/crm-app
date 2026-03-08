export interface AttendanceState {
  attendances: EmployeeAttendance[];
  loading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
}

export type ClockInMethod = 'WEB' | 'WHATSAPP';

export interface Attendance {
  id?: number;
  employeeId: number;
  employeeName?: string;
  employeeEmail?: string;
  attendanceDate: string;
  attendanceType: AttendanceType;
  reason?: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  clockInMethod?: ClockInMethod;
  status?: string;
  break1Start?: string;
  break1End?: string;
  lunchStart?: string;
  lunchEnd?: string;
  break2Start?: string;
  break2End?: string;
  totalWorkHours?: number;
  checkInLocation?: string;
  checkOutLocation?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface EmployeeAttendance {
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  designation?: string;
  department?: string;
  dailyAttendance: { [day: number]: AttendanceType };
  totalPresent: number;
  totalAbsent: number;
  totalHalfDay: number;
  totalLeave: number;
}

export enum AttendanceType {
  FULL_DAY_PRESENT = 'FULL_DAY_PRESENT',
  HALF_DAY_PRESENT = 'HALF_DAY_PRESENT',
  FULL_DAY_ABSENCE = 'FULL_DAY_ABSENCE',
  LATE_ARRIVAL = 'LATE_ARRIVAL',
  EARLY_DEPARTURE = 'EARLY_DEPARTURE',
  ON_LEAVE = 'ON_LEAVE',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY'
}

export interface AttendanceForm {
  employeeId: number;
  attendanceDate: string;
  attendanceType: AttendanceType;
  reason?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalHalfDay: number;
  totalLeave: number;
}

export interface AttendanceFilter {
  employeeId?: number;
  attendanceType?: AttendanceType;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

/**
 * Form for employee self-service attendance entry.
 * Does not require employeeId as it's derived from authenticated user.
 */
export interface SelfAttendanceForm {
  attendanceDate: string;
  attendanceType: AttendanceType;
  reason?: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: string;
  checkOutLocation?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
}

export interface MyMonthlyAttendanceResponse {
  attendances: Attendance[];
  summary: AttendanceSummary;
  employee: any;
  year: number;
  month: number;
}
