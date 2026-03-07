import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { AttendanceService } from '../../../service/attendance.service';
import { UserService } from '../../../service/user.service';
import { NotificationService } from '../../../service/notification.service';
import { UserModel } from '../../profile/user.model';
import {
  Attendance,
  AttendanceType,
  SelfAttendanceForm,
  AttendanceSummary
} from '../../../interface/attendance-state';

@Component({
  selector: 'app-my-attendance',
  templateUrl: './my-attendance.component.html',
  styleUrls: ['./my-attendance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyAttendanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Current user data
  currentUser: UserModel | null = null;
  currentEmployeeId: number | null = null;

  // Attendance data
  attendances: Attendance[] = [];
  summary: AttendanceSummary = { totalPresent: 0, totalAbsent: 0, totalHalfDay: 0, totalLeave: 0 };

  // Calendar state
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  daysInMonth: number[] = [];

  // UI state
  loading = false;
  error: string | null = null;
  showAttendanceModal = false;
  selectedDate: string = '';
  existingAttendance: Attendance | null = null;

  // Form
  attendanceForm!: FormGroup;
  formLoading = false;
  formError: string | null = null;

  // Attendance types for dropdown
  attendanceTypes = [
    { value: AttendanceType.FULL_DAY_PRESENT, label: 'Full Day Present', icon: '✓' },
    { value: AttendanceType.HALF_DAY_PRESENT, label: 'Half Day Present', icon: '◐' },
    { value: AttendanceType.FULL_DAY_ABSENCE, label: 'Full Day Absence', icon: '✗' },
    { value: AttendanceType.LATE_ARRIVAL, label: 'Late Arrival', icon: '⏰' },
    { value: AttendanceType.EARLY_DEPARTURE, label: 'Early Departure', icon: '⏱' },
    { value: AttendanceType.ON_LEAVE, label: 'On Leave', icon: 'L' }
  ];

  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  years: number[] = [];

  readonly AttendanceType = AttendanceType;

  // Query parameter for opening specific date
  private pendingDateToOpen: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private attendanceService: AttendanceService,
    private userService: UserService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeYears();
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check for date query parameter (from calendar click)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['date']) {
        this.pendingDateToOpen = params['date'];
        // Parse the date and set the month/year accordingly
        const date = new Date(params['date']);
        if (!isNaN(date.getTime())) {
          this.selectedMonth = date.getMonth() + 1;
          this.selectedYear = date.getFullYear();
        }
      }
    });
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear; i++) {
      this.years.push(i);
    }
  }

  private initializeForm(): void {
    this.attendanceForm = this.fb.group({
      attendanceDate: ['', Validators.required],
      attendanceType: [AttendanceType.FULL_DAY_PRESENT, Validators.required],
      reason: [''],
      checkInTime: [''],
      checkOutTime: ['']
    });
  }

  private loadCurrentUser(): void {
    this.loading = true;
    this.userService.profile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.currentUser = response.data.user;

          if (!this.currentUser || !this.currentUser.id) {
            this.error = 'User profile not found';
            this.loading = false;
            this.cdr.markForCheck();
            return;
          }

          this.currentEmployeeId = this.currentUser.id;
          this.loadMonthlyAttendance();
        },
        error: (error) => {
          console.error('Error loading user:', error);
          this.error = 'Failed to load user information';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadMonthlyAttendance(): void {
    if (!this.currentEmployeeId) return;

    this.loading = true;
    this.calculateDaysInMonth();

    this.attendanceService.getMyMonthlyAttendance(this.selectedYear, this.selectedMonth)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading monthly attendance:', error);
          this.error = 'Failed to load attendance data';
          return of({ data: { attendances: [], summary: { totalPresent: 0, totalAbsent: 0, totalHalfDay: 0, totalLeave: 0 } } });
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(response => {
        this.attendances = response.data?.attendances || [];
        this.summary = response.data?.summary || { totalPresent: 0, totalAbsent: 0, totalHalfDay: 0, totalLeave: 0 };

        // Open modal for pending date (from query parameter)
        if (this.pendingDateToOpen) {
          const date = new Date(this.pendingDateToOpen);
          if (!isNaN(date.getTime())) {
            // Use setTimeout to allow the view to render first
            setTimeout(() => {
              this.openAttendanceModal(date.getDate());
            }, 100);
          }
          this.pendingDateToOpen = null; // Clear the pending date
        }

        this.cdr.markForCheck();
      });
  }

  private calculateDaysInMonth(): void {
    const daysCount = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    this.daysInMonth = Array.from({ length: daysCount }, (_, i) => i + 1);
  }

  // Calendar navigation
  onMonthChange(month: number): void {
    this.selectedMonth = month;
    this.loadMonthlyAttendance();
  }

  onYearChange(year: number): void {
    this.selectedYear = year;
    this.loadMonthlyAttendance();
  }

  previousMonth(): void {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.loadMonthlyAttendance();
  }

  nextMonth(): void {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.loadMonthlyAttendance();
  }

  goToToday(): void {
    const today = new Date();
    this.selectedMonth = today.getMonth() + 1;
    this.selectedYear = today.getFullYear();
    this.loadMonthlyAttendance();
  }

  // Get attendance for a specific day
  getAttendanceForDay(day: number): Attendance | null {
    const dateStr = this.formatDateForComparison(this.selectedYear, this.selectedMonth, day);
    return this.attendances.find(a => a.attendanceDate === dateStr) || null;
  }

  getAttendanceIcon(type: AttendanceType | null): string {
    if (!type) return '';
    return this.attendanceService.getAttendanceTypeIcon(type);
  }

  getAttendanceClass(type: AttendanceType | null): string {
    if (!type) return 'no-record';
    return this.attendanceService.getAttendanceTypeClass(type);
  }

  // Modal operations
  openAttendanceModal(day: number): void {
    // Prevent future dates beyond today
    const selectedDate = new Date(this.selectedYear, this.selectedMonth - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      this.notificationService.onError('Cannot mark attendance for future dates');
      return;
    }

    this.selectedDate = this.formatDateForComparison(this.selectedYear, this.selectedMonth, day);
    this.existingAttendance = this.getAttendanceForDay(day);

    // Reset form
    this.attendanceForm.reset({
      attendanceDate: this.selectedDate,
      attendanceType: AttendanceType.FULL_DAY_PRESENT,
      reason: '',
      checkInTime: '',
      checkOutTime: ''
    });

    // If existing attendance, patch form
    if (this.existingAttendance) {
      this.attendanceForm.patchValue({
        attendanceDate: this.existingAttendance.attendanceDate,
        attendanceType: this.existingAttendance.attendanceType,
        reason: this.existingAttendance.reason || '',
        checkInTime: this.formatDateTime(this.existingAttendance.checkInTime),
        checkOutTime: this.formatDateTime(this.existingAttendance.checkOutTime)
      });
    }

    this.showAttendanceModal = true;
    this.formError = null;
    this.cdr.markForCheck();
  }

  closeAttendanceModal(): void {
    this.showAttendanceModal = false;
    this.selectedDate = '';
    this.existingAttendance = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  submitAttendance(): void {
    if (this.attendanceForm.invalid) {
      Object.keys(this.attendanceForm.controls).forEach(key => {
        this.attendanceForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.formLoading = true;
    this.formError = null;

    const formValue = this.attendanceForm.value;
    const selfForm: SelfAttendanceForm = {
      attendanceDate: formValue.attendanceDate,
      attendanceType: formValue.attendanceType,
      reason: formValue.reason || undefined,
      checkInTime: formValue.checkInTime ? new Date(formValue.checkInTime).toISOString() : undefined,
      checkOutTime: formValue.checkOutTime ? new Date(formValue.checkOutTime).toISOString() : undefined
    };

    const operation = this.existingAttendance
      ? this.attendanceService.updateMyAttendance(this.selectedDate, selfForm)
      : this.attendanceService.createMyAttendance(selfForm);

    operation
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.formError = error.error?.message || 'Failed to save attendance';
          return of(null);
        }),
        finalize(() => {
          this.formLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(response => {
        if (response) {
          this.notificationService.onSuccess(
            this.existingAttendance ? 'Attendance updated successfully' : 'Attendance recorded successfully'
          );
          this.closeAttendanceModal();
          this.loadMonthlyAttendance();
        }
      });
  }

  // Mark today's attendance quickly
  markTodayAttendance(type: AttendanceType): void {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const selfForm: SelfAttendanceForm = {
      attendanceDate: todayStr,
      attendanceType: type,
      checkInTime: type === AttendanceType.FULL_DAY_PRESENT ? new Date().toISOString() : undefined
    };

    this.loading = true;
    this.attendanceService.createMyAttendance(selfForm)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          // If attendance exists, try to update
          if (error.error?.message?.includes('already exists')) {
            return this.attendanceService.updateMyAttendance(todayStr, selfForm);
          }
          this.notificationService.onError(error.error?.message || 'Failed to mark attendance');
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(response => {
        if (response) {
          this.notificationService.onSuccess('Today\'s attendance marked successfully');
          this.loadMonthlyAttendance();
        }
      });
  }

  // Helper methods
  private formatDateForComparison(year: number, month: number, day: number): string {
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  }

  private formatDateTime(dateTime: string | null | undefined): string {
    if (!dateTime) return '';
    return dateTime.substring(0, 16);
  }

  getMonthName(month: number): string {
    return this.months.find(m => m.value === month)?.label || '';
  }

  isToday(day: number): boolean {
    const today = new Date();
    return (
      day === today.getDate() &&
      this.selectedMonth === today.getMonth() + 1 &&
      this.selectedYear === today.getFullYear()
    );
  }

  isWeekend(day: number): boolean {
    const date = new Date(this.selectedYear, this.selectedMonth - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  isFutureDate(day: number): boolean {
    const date = new Date(this.selectedYear, this.selectedMonth - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }

  getUserFullName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
  }

  getDepartmentName(): string {
    if (this.currentUser?.departmentName) return this.currentUser.departmentName;
    const role = this.currentUser?.roleName;
    if (role === 'ROLE_ADMIN' || role === 'ROLE_SYSADMIN') return 'Administration';
    return 'Not assigned';
  }

  getDesignation(): string {
    if (this.currentUser?.designationTitle) return this.currentUser.designationTitle;
    const role = this.currentUser?.roleName;
    if (role === 'ROLE_SYSADMIN') return 'System Administrator';
    if (role === 'ROLE_ADMIN') return 'Administrator';
    return 'Not assigned';
  }

  getEmployeeCode(): string {
    if (this.currentUser?.employeeId) return this.currentUser.employeeId;
    const role = this.currentUser?.roleName;
    if (role === 'ROLE_ADMIN' || role === 'ROLE_SYSADMIN') return 'Admin';
    return 'N/A';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.attendanceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Get the day of week (0-6) for the first day of the month
  getFirstDayOffset(): number {
    const firstDay = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    return firstDay.getDay();
  }

  // Check if a time value is valid and can be displayed
  hasValidTime(time: string | null | undefined): boolean {
    return time !== null && time !== undefined && time !== '' && time !== 'undefined';
  }
}
