import { environment } from '@env/environment';
// admin-leave.component.ts
// Updated to fetch admin/manager information from authenticated user using correct endpoint

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { DataState } from "../../../enum/datastate.enum";
import { LeaveService } from "../../../service/leave.service";
import { UserService } from '../../../service/user.service';
import { NotificationService } from '../../../service/notification.service';
import { CustomHttpResponse } from '../../../interface/appstates';
import { UserModel } from '../../profile/user.model';
import {
  Leave,
  LeaveStatus,
  LeaveType,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LeaveApproval
} from "../../../interface/leave-state";

@Component({
  selector: 'app-admin-leave',
  templateUrl: './admin-leave.component.html',
  styleUrls: ['./admin-leave.component.scss']
})
export class AdminLeaveComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly leaveServer: string = environment.apiUrl + '/api/v1/leave';
  private readonly employeeServer: string = environment.apiUrl + '/api/v1/employee';

  // Current admin/manager user and employee info
  currentUser: UserModel | null = null;
  currentEmployeeId: number | null = null;

  // State
  leaves: Leave[] = [];
  allLeaves: Leave[] = [];
  selectedLeave: Leave | null = null;
  dataState = DataState;
  currentDataState: DataState = DataState.LOADED;
  error: string | null = null;
  pendingCount: number = 0;
  upcomingLeaves: Leave[] = [];

  // Forms
  approvalForm: FormGroup;
  showApprovalModal: boolean = false;
  approvalAction: 'approve' | 'reject' = 'approve';

  // Filters
  activeTab: 'all' | 'pending' | 'approved' | 'rejected' | 'upcoming' = 'pending';
  searchQuery: string = '';
  selectedStatus: LeaveStatus | 'all' = 'all';
  selectedType: LeaveType | 'all' = 'all';

  // Pagination
  currentPage: number = 0;
  pageSize: number = 20;
  totalElements: number = 0;
  totalPages: number = 0;

  // Enums for template
  leaveTypes = Object.values(LeaveType);
  leaveStatuses = Object.values(LeaveStatus);
  leaveTypeLabels = LEAVE_TYPE_LABELS;
  leaveStatusLabels = LEAVE_STATUS_LABELS;
  LeaveStatus = LeaveStatus;

  constructor(
    private formBuilder: FormBuilder,
    private leaveService: LeaveService,
    private userService: UserService,
    private notificationService: NotificationService,
    private http: HttpClient
  ) {
    this.approvalForm = this.createApprovalForm();
  }

  ngOnInit(): void {
    this.loadCurrentUserAndEmployee();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createApprovalForm(): FormGroup {
    return this.formBuilder.group({
      remarks: [''],
      rejectionReason: ['']
    });
  }

  /**
   * Load current authenticated user and fetch their employee record
   */
  private loadCurrentUserAndEmployee(): void {
    this.userService.profile$()
      .pipe(
        switchMap((response) => {
          this.currentUser = response.data.user;

          if (!this.currentUser || !this.currentUser.id) {
            throw new Error('User profile not found');
          }

          // Fetch employee by user ID - CORRECTED ENDPOINT
          return this.http.get<CustomHttpResponse<{ employee: any }>>(
            `${this.employeeServer}/by-user/${this.currentUser.id}`
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (employeeResponse) => {
          const employee = employeeResponse.data.employee;
          if (employee && employee.id) {
            this.currentEmployeeId = employee.id;
            console.log('Admin/Manager Employee ID loaded:', this.currentEmployeeId);
            this.subscribeToState();
            this.loadPendingLeaves();
            this.loadStatistics();
          } else {
            this.notificationService.onError('Employee record not found. Please contact system admin.');
          }
        },
        error: (error) => {
          console.error('Error loading user/employee:', error);
          this.notificationService.onError('Failed to load employee information');
        }
      });
  }

  private subscribeToState(): void {
    this.leaveService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentDataState = state.dataState;
        this.leaves = state.leaves || [];
        this.allLeaves = state.leaves || [];
        this.error = state.error || null;
      });
  }

  private loadStatistics(): void {
    this.leaveService.getPendingCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.pendingCount = count);

    this.leaveService.getUpcomingLeaves(30)
      .pipe(takeUntil(this.destroy$))
      .subscribe(leaves => this.upcomingLeaves = leaves);
  }

  // Load methods
  private loadPendingLeaves(): void {
    this.leaveService.getLeavesByStatus(LeaveStatus.PENDING, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private loadAllLeaves(): void {
    this.leaveService.getAllLeaves(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  // Tab actions
  setActiveTab(tab: 'all' | 'pending' | 'approved' | 'rejected' | 'upcoming'): void {
    this.activeTab = tab;
    this.currentPage = 0;
    this.searchQuery = '';

    switch (tab) {
      case 'all':
        this.loadAllLeaves();
        break;
      case 'pending':
        this.leaveService.getLeavesByStatus(LeaveStatus.PENDING, this.currentPage, this.pageSize)
          .pipe(takeUntil(this.destroy$))
          .subscribe();
        break;
      case 'approved':
        this.leaveService.getLeavesByStatus(LeaveStatus.APPROVED, this.currentPage, this.pageSize)
          .pipe(takeUntil(this.destroy$))
          .subscribe();
        break;
      case 'rejected':
        this.leaveService.getLeavesByStatus(LeaveStatus.REJECTED, this.currentPage, this.pageSize)
          .pipe(takeUntil(this.destroy$))
          .subscribe();
        break;
      case 'upcoming':
        this.leaves = this.upcomingLeaves;
        break;
    }
  }

  // Search and filter
  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.loadPendingLeaves();
      return;
    }

    this.leaveService.searchLeaves(this.searchQuery, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  applyFilters(): void {
    let filtered = [...this.allLeaves];

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(l => l.status === this.selectedStatus);
    }

    if (this.selectedType !== 'all') {
      filtered = filtered.filter(l => l.leaveType === this.selectedType);
    }

    this.leaves = filtered;
  }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.selectedType = 'all';
    this.searchQuery = '';
    this.loadPendingLeaves();
  }

  // Approval actions
  viewLeaveDetails(leave: Leave): void {
    this.selectedLeave = leave;
    if (leave.id) {
      this.leaveService.getLeaveById(leave.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  openApprovalModal(leave: Leave, action: 'approve' | 'reject'): void {
    if (!this.currentEmployeeId) {
      this.notificationService.onError('Employee information not loaded. Please refresh the page.');
      return;
    }

    this.selectedLeave = leave;
    this.approvalAction = action;
    this.showApprovalModal = true;
    this.approvalForm.reset();

    if (action === 'approve') {
      this.approvalForm.get('rejectionReason')?.clearValidators();
    } else {
      this.approvalForm.get('rejectionReason')?.setValidators([Validators.required]);
    }
    this.approvalForm.get('rejectionReason')?.updateValueAndValidity();
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.selectedLeave = null;
    this.approvalForm.reset();
  }

  submitApproval(): void {
    if (!this.selectedLeave || !this.selectedLeave.id || !this.currentEmployeeId) {
      this.notificationService.onError('Missing required information');
      return;
    }

    if (this.approvalAction === 'reject' && this.approvalForm.get('rejectionReason')?.invalid) {
      this.notificationService.onError('Please provide a rejection reason');
      return;
    }

    const approval: LeaveApproval = {
      leaveId: this.selectedLeave.id,
      status: this.approvalAction === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
      approvedBy: this.currentEmployeeId,
      remarks: this.approvalForm.value.remarks,
      rejectionReason: this.approvalForm.value.rejectionReason
    };

    const action$ = this.approvalAction === 'approve'
      ? this.leaveService.approveLeave(approval)
      : this.leaveService.rejectLeave(approval);

    action$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.onSuccess(
            `Leave ${this.approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`
          );
          this.closeApprovalModal();
          this.loadPendingLeaves();
          this.loadStatistics();
        },
        error: (error) => {
          this.notificationService.onError(
            error.error?.message || `Failed to ${this.approvalAction} leave`
          );
        }
      });
  }

  quickApprove(leave: Leave): void {
    if (!leave.id || !this.currentEmployeeId) return;

    if (confirm(`Are you sure you want to approve this leave request for ${leave.employeeName}?`)) {
      const approval: LeaveApproval = {
        leaveId: leave.id,
        status: LeaveStatus.APPROVED,
        approvedBy: this.currentEmployeeId
      };

      this.leaveService.approveLeave(approval)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.onSuccess('Leave approved successfully');
            this.loadPendingLeaves();
            this.loadStatistics();
          },
          error: (error) => {
            this.notificationService.onError(
              error.error?.message || 'Failed to approve leave'
            );
          }
        });
    }
  }

  // Helper methods
  get filteredLeaves(): Leave[] {
    return this.leaves;
  }

  getStatusClass(status: LeaveStatus): string {
    switch (status) {
      case LeaveStatus.PENDING:
        return 'status-pending';
      case LeaveStatus.APPROVED:
        return 'status-approved';
      case LeaveStatus.REJECTED:
        return 'status-rejected';
      case LeaveStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getLeaveTypeClass(type: LeaveType): string {
    switch (type) {
      case LeaveType.ANNUAL:
        return 'type-annual';
      case LeaveType.SICK:
        return 'type-sick';
      case LeaveType.FAMILY_RESPONSIBILITY:
        return 'type-family';
      default:
        return 'type-other';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.leaveService.calculateBusinessDays(start, end);
  }

  canApprove(leave: Leave): boolean {
    return leave.status === LeaveStatus.PENDING;
  }

  getDoctorNoteDownloadUrl(leave: Leave): string {
    if (leave.id && leave.doctorNoteUrl) {
      // If the URL is a relative backend path, prefix with API base
      if (leave.doctorNoteUrl.startsWith('/api/')) {
        return '' + leave.doctorNoteUrl;
      }
      return leave.doctorNoteUrl;
    }
    return '';
  }

  // Export functionality
  exportToExcel(): void {
    console.log('Export to Excel - to be implemented');
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadPendingLeaves();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadPendingLeaves();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPendingLeaves();
  }
}
