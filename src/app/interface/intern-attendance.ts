export interface InternAttendance {
  id?: number;
  employeeId: number;
  employeeName?: string;
  employeeEmail?: string;
  employeePhotoUrl?: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  institutionName?: string;
  subjectOrModule?: string;
  reason?: string;
  status: string;
  statusDescription?: string;
  remarks?: string;
  rejectionReason?: string;
  approvedById?: number;
  approvedByName?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InternAttendanceRequest {
  employeeId: number;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  institutionName?: string;
  subjectOrModule?: string;
  reason?: string;
  remarks?: string;
}

export interface InternAttendanceApproval {
  attendanceId: number;
  approvedBy: number;
  status: string;
  remarks?: string;
  rejectionReason?: string;
}
