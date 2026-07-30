// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
// employee-leave.component.ts
// ✅ UPDATED: Uses /api/v1/employee/me for self-service access
// No special permissions needed - employees can access their own data

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataState } from '../../../enum/datastate.enum';
import { LeaveService } from '../../../service/leave.service';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';
import { UserModel } from '../../profile/user.model';
import {
  Leave,
  LeaveBalance,
  LeaveType,
  LeaveStatus,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LeaveRequest
} from '../../../interface/leave-state';

@Component({
  standalone: false,
  selector: 'app-employee-leave',
  templateUrl: './employee-leave.component.html',
  styleUrls: ['./employee-leave.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeLeaveComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly employeeServer: string = environment.apiUrl + '/api/v1/employee';

  currentUser: UserModel | null = null;
  currentEmployeeId: number | null = null;
  noEmployeeRecord: boolean = false;

  // State
  leaves: Leave[] = [];
  leaveBalances: LeaveBalance[] = [];
  dataState = DataState;
  currentDataState: DataState = DataState.LOADED;
  error: string | null = null;

  // Forms
  leaveForm: FormGroup;
  showLeaveForm: boolean = false;
  editMode: boolean = false;
  currentLeaveId: number | null = null;

  // Doctor's note file
  selectedDoctorNoteFile: File | null = null;

  // Filter and pagination
  activeTab: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  currentYear: number = new Date().getFullYear();

  // Enums for template
  leaveTypes = Object.values(LeaveType);
  leaveTypeLabels = LEAVE_TYPE_LABELS;
  leaveStatusLabels = LEAVE_STATUS_LABELS;
  LeaveStatus = LeaveStatus;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private leaveService: LeaveService,
    private notificationService: NotificationService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.leaveForm = this.createLeaveForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createLeaveForm(): FormGroup {
    return this.formBuilder.group({
      leaveType: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: [''],
      remarks: [''],
      doctorNoteAttached: [false]
    });
  }

  private loadCurrentUser(): void {
    this.userService.profile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profileResponse: any) => {
          const user = profileResponse?.data?.user;
          if (!user) {
            this.notificationService.onError('Failed to identify current user');
            return;
          }
          this.currentUser = user;
          const roleName = user.roleName || '';

          if (roleName === 'ROLE_SYSADMIN') {
            // SYSADMIN may or may not have an employee record — try by-user lookup
            this.http.get<any>(`${this.employeeServer}/by-user/${user.id}`)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response: any) => {
                  const employee = response.data?.employee;
                  if (employee?.id) {
                    this.currentEmployeeId = employee.id;
                    this.subscribeToState();
                    this.loadEmployeeLeaves();
                    this.loadLeaveBalances();
                  } else {
                    this.noEmployeeRecord = true;
                  }
                },
                error: () => {
                  // No employee record linked to this SYSADMIN account
                  this.noEmployeeRecord = true;
                }
              });
            return;
          }

          // All other roles — use the /me endpoint
          this.http.get<any>(`${this.employeeServer}/me`)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (response: any) => {
                const employee = response.data?.employee;
                if (!employee?.id) {
                  this.noEmployeeRecord = true;
                  return;
                }
                this.currentEmployeeId = employee.id;
                this.subscribeToState();
                this.loadEmployeeLeaves();
                this.loadLeaveBalances();
              },
              error: () => {
                this.noEmployeeRecord = true;
              }
            });
        },
        error: () => {
          this.notificationService.onError('Failed to identify current user');
        }
      });
  }

  private subscribeToState(): void {
    // Not used — leaves and balances are managed directly to avoid
    // the shared LeaveService BehaviorSubject overwriting both datasets
    // when each call resets state to LOADING then LOADED with only partial data.
  }

  private loadEmployeeLeaves(): void {
    if (!this.currentEmployeeId) return;
    this.currentDataState = DataState.LOADING;

    this.leaveService.getLeavesByEmployee(this.currentEmployeeId, 0, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (leaves) => {
          this.leaves = leaves;
          this.currentDataState = DataState.LOADED;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('❌ Error loading leaves:', error);
          this.currentDataState = DataState.ERROR;
          this.notificationService.onError('Failed to load leaves');
          this.cdr.markForCheck();
        }
      });
  }

  private loadLeaveBalances(): void {
    if (!this.currentEmployeeId) return;

    this.leaveService.getLeaveBalances(this.currentEmployeeId, this.currentYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (balances) => {
          this.leaveBalances = balances;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('❌ Error loading leave balances:', error);
          this.cdr.markForCheck();
        }
      });
  }

  // ==================== FORM ACTIONS ====================

  openLeaveForm(): void {
    if (!this.currentEmployeeId) {
      this.notificationService.onError('Employee information not loaded. Please refresh the page.');
      return;
    }

    // Check if profile is complete (skip for admin roles)
    const isAdmin = ['ROLE_SYSADMIN', 'ROLE_ADMIN', 'SYSADMIN', 'ADMIN'].includes(this.currentUser?.roleName || '');
    if (!isAdmin && (!this.currentUser?.departmentId || !this.currentUser?.designationId)) {
      this.notificationService.onError(
        'Please complete your employee profile (Department & Designation required)'
      );
      return;
    }

    this.showLeaveForm = true;
    this.editMode = false;
    this.leaveForm.reset();
  }

  editLeave(leave: Leave): void {
    if (leave.status !== LeaveStatus.PENDING) {
      this.notificationService.onError('Only pending leave requests can be edited');
      return;
    }

    this.showLeaveForm = true;
    this.editMode = true;
    this.currentLeaveId = leave.id || null;

    this.leaveForm.patchValue({
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      remarks: leave.remarks,
      doctorNoteAttached: leave.doctorNoteAttached
    });
    this.selectedDoctorNoteFile = null;
  }

  closeLeaveForm(): void {
    this.showLeaveForm = false;
    this.editMode = false;
    this.currentLeaveId = null;
    this.selectedDoctorNoteFile = null;
    this.leaveForm.reset();
  }

  calculatedBusinessDays: number = 0;

  private nextWeekday(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00'); // noon to avoid timezone shift
    const day = d.getDay();
    if (day === 6) d.setDate(d.getDate() + 2); // Saturday → Monday
    if (day === 0) d.setDate(d.getDate() + 1); // Sunday → Monday
    return d.toISOString().slice(0, 10);
  }

  onDateChange(): void {
    let startVal = this.leaveForm.get('startDate')?.value;
    let endVal = this.leaveForm.get('endDate')?.value;

    // Auto-bump weekend dates to next Monday
    if (startVal) {
      const adjusted = this.nextWeekday(startVal);
      if (adjusted !== startVal) {
        this.leaveForm.get('startDate')?.setValue(adjusted, { emitEvent: false });
        startVal = adjusted;
      }
    }
    if (endVal) {
      const adjusted = this.nextWeekday(endVal);
      if (adjusted !== endVal) {
        this.leaveForm.get('endDate')?.setValue(adjusted, { emitEvent: false });
        endVal = adjusted;
      }
    }

    if (startVal && endVal) {
      this.calculatedBusinessDays = this.leaveService.calculateBusinessDays(
        new Date(startVal + 'T12:00:00'),
        new Date(endVal + 'T12:00:00')
      );
    } else {
      this.calculatedBusinessDays = 0;
    }
  }

  submitLeaveRequest(): void {
    if (!this.currentEmployeeId) {
      this.notificationService.onError('Employee information not found. Please refresh the page.');
      return;
    }

    if (this.leaveForm.invalid) {
      Object.keys(this.leaveForm.controls).forEach(key => {
        this.leaveForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.leaveForm.value;
    const startDate = new Date(formValue.startDate);
    const endDate = new Date(formValue.endDate);

    if (endDate < startDate) {
      this.notificationService.onError('End date cannot be before start date');
      return;
    }

    const numberOfDays = this.leaveService.calculateBusinessDays(startDate, endDate);

    const request: LeaveRequest = {
      employeeId: this.currentEmployeeId,
      leaveType: formValue.leaveType,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      numberOfDays,
      reason: formValue.reason,
      remarks: formValue.remarks,
      doctorNoteAttached: formValue.doctorNoteAttached && !!this.selectedDoctorNoteFile
    };

    if (this.editMode && this.currentLeaveId) {
      this.leaveService.updateLeaveRequest(this.currentLeaveId, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (leave: any) => {
            this.uploadDoctorNoteIfNeeded(leave.id!, 'Leave request updated successfully');
          },
          error: (error) => {
            this.notificationService.onError(error.error?.message || 'Failed to update leave request');
          }
        });
    } else {
      this.leaveService.createLeaveRequest(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (leave: any) => {
            this.uploadDoctorNoteIfNeeded(leave.id!, 'Leave request submitted successfully');
          },
          error: (error) => {
            this.notificationService.onError(error.error?.message || 'Failed to submit leave request');
          }
        });
    }
  }

  /**
   * Upload doctor's note file after leave creation/update, if a file was selected
   */
  private uploadDoctorNoteIfNeeded(leaveId: number, successMessage: string): void {
    if (this.selectedDoctorNoteFile && this.leaveForm.get('doctorNoteAttached')?.value) {
      this.leaveService.uploadDoctorNote(leaveId, this.selectedDoctorNoteFile)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.onSuccess(successMessage);
            this.closeLeaveForm();
            this.loadEmployeeLeaves();
            this.loadLeaveBalances();
          },
          error: (error) => {
            this.notificationService.onError('Leave saved but failed to upload doctor\'s note: ' + error.message);
            this.closeLeaveForm();
            this.loadEmployeeLeaves();
            this.loadLeaveBalances();
          }
        });
    } else {
      this.notificationService.onSuccess(successMessage);
      this.closeLeaveForm();
      this.loadEmployeeLeaves();
      this.loadLeaveBalances();
    }
  }

  /**
   * Handle doctor's note file selection
   */
  onDoctorNoteFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.onError('File size must be less than 5MB');
        input.value = '';
        this.selectedDoctorNoteFile = null;
        return;
      }

      this.selectedDoctorNoteFile = file;
    }
  }

  cancelLeave(leave: Leave): void {
    if (!leave.id || !this.currentEmployeeId) return;

    if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.APPROVED) {
      this.notificationService.onError('Only pending or approved leaves can be cancelled');
      return;
    }

    if (confirm('Are you sure you want to cancel this leave request?')) {
      this.leaveService.cancelLeave(leave.id, this.currentEmployeeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.onSuccess('Leave request cancelled successfully');
            this.loadEmployeeLeaves();
            this.loadLeaveBalances();
          },
          error: (error) => {
            this.notificationService.onError(error.error?.message || 'Failed to cancel leave request');
          }
        });
    }
  }

  // ==================== FILTERING ====================

  get filteredLeaves(): Leave[] {
    switch (this.activeTab) {
      case 'pending':
        return this.leaves.filter(l => l.status === LeaveStatus.PENDING);
      case 'approved':
        return this.leaves.filter(l => l.status === LeaveStatus.APPROVED);
      case 'rejected':
        return this.leaves.filter(l => l.status === LeaveStatus.REJECTED);
      default:
        return this.leaves;
    }
  }

  setActiveTab(tab: 'all' | 'pending' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
  }

  // ==================== HELPER METHODS ====================

  getStatusClass(status: LeaveStatus): string {
    switch (status) {
      case LeaveStatus.PENDING:
        return 'badge-soft badge-soft-warning';
      case LeaveStatus.APPROVED:
        return 'badge-soft badge-soft-success';
      case LeaveStatus.REJECTED:
        return 'badge-soft badge-soft-danger';
      case LeaveStatus.CANCELLED:
        return 'badge-soft badge-soft-muted';
      default:
        return 'badge-soft badge-soft-muted';
    }
  }

  getAvailableDays(leaveType: LeaveType): number {
    const balance = this.leaveBalances.find(b => b.leaveType === leaveType);
    return balance ? balance.available : 0;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  canEditOrCancel(leave: Leave): boolean {
    return leave.status === LeaveStatus.PENDING || leave.status === LeaveStatus.APPROVED;
  }

  viewDoctorNote(leave: Leave): void {
    if (!leave.id) return;
    const url = `${environment.apiUrl}/api/v1/leave/${leave.id}/doctor-note`;
    this.http.get(url, { responseType: 'blob' }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 10000);
      },
      error: () => {
        alert('Unable to load attachment. It may not have been uploaded yet.');
      }
    });
  }

  /**
   * Get user's full name for display
   */
  getUserFullName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
  }

  /**
   * Get user's department name
   */
  getDepartmentName(): string {
    return this.currentUser?.departmentName || 'Not assigned';
  }

  /**
   * Get user's designation
   */
  getDesignation(): string {
    return this.currentUser?.designationTitle || 'Not assigned';
  }

  /**
   * Get user's employee ID (e.g., LKC0001)
   */
  getEmployeeCode(): string {
    return this.currentUser?.employeeId || 'N/A';
  }

  trackById(index: number, item: any): any { return item?.id ?? index; }
  trackByValue(index: number, value: any): any { return value ?? index; }
  trackByIndex(index: number, _item: any): number { return index; }
}
