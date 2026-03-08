import { environment } from '@env/environment';
// admin-leave.component.ts
// Updated to fetch admin/manager information from authenticated user using correct endpoint

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
  standalone: false,
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
  allLeaves: Leave[] = [];           // Full unfiltered dataset
  selectedLeave: Leave | null = null;
  dataState = DataState;
  currentDataState: DataState = DataState.LOADED;
  error: string | null = null;
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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.currentUser = response.data.user;

          if (!this.currentUser || !this.currentUser.id) {
            this.notificationService.onError('User profile not found');
            return;
          }

          // SYSADMIN has no Employee record — skip the lookup and load directly
          if (this.currentUser.roleName === 'ROLE_SYSADMIN') {
            console.log('SYSADMIN detected — skipping employee lookup');
            this.loadAllData();
            return;
          }

          // For other admin/manager roles, fetch the linked Employee record
          this.http.get<CustomHttpResponse<{ employee: any }>>(
            `${this.employeeServer}/by-user/${this.currentUser.id}`
          ).pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (employeeResponse: any) => {
                const employee = employeeResponse.data.employee;
                if (employee && employee.id) {
                  this.currentEmployeeId = employee.id;
                }
                this.loadAllData();
              },
              error: () => {
                this.loadAllData();
              }
            });
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          this.notificationService.onError('Failed to load user profile');
        }
      });
  }

  private loadAllData(): void {
    this.currentDataState = DataState.LOADING;
    this.leaveService.getAllLeaves(0, 500)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (leaves: Leave[]) => {
          this.allLeaves = leaves;
          this.currentDataState = DataState.LOADED;
          this.error = null;
        },
        error: (err) => {
          this.currentDataState = DataState.ERROR;
          this.error = err?.message || 'Failed to load leave requests';
        }
      });

    this.leaveService.getUpcomingLeaves(30)
      .pipe(takeUntil(this.destroy$))
      .subscribe((leaves: Leave[]) => this.upcomingLeaves = leaves);
  }

  // ─── Computed counts per tab
  get pendingCount(): number { return this.allLeaves.filter(l => l.status === LeaveStatus.PENDING).length; }
  get approvedCount(): number { return this.allLeaves.filter(l => l.status === LeaveStatus.APPROVED).length; }
  get rejectedCount(): number { return this.allLeaves.filter(l => l.status === LeaveStatus.REJECTED).length; }
  get upcomingCount(): number { return this.upcomingLeaves.length; }

  // ─── Tab
  setActiveTab(tab: 'all' | 'pending' | 'approved' | 'rejected' | 'upcoming'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.selectedStatus = 'all';
    this.selectedType = 'all';
  }

  // ─── Filter / search (all client-side)
  onSearch(): void { /* triggers filteredLeaves getter */ }

  applyFilters(): void { /* triggers filteredLeaves getter */ }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.selectedType = 'all';
    this.searchQuery = '';
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
    if (!this.selectedLeave || !this.selectedLeave.id) {
      this.notificationService.onError('Missing required information');
      return;
    }

    if (this.approvalAction === 'reject' && this.approvalForm.get('rejectionReason')?.invalid) {
      this.notificationService.onError('Please provide a rejection reason');
      return;
    }

    const approverId = this.currentEmployeeId ?? (this.currentUser?.id as unknown as number);

    const approval: LeaveApproval = {
      leaveId: this.selectedLeave.id,
      status: this.approvalAction === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
      approvedBy: approverId,
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
          this.loadAllData();
        },
        error: (error) => {
          this.notificationService.onError(
            error.error?.message || `Failed to ${this.approvalAction} leave`
          );
        }
      });
  }

  quickApprove(leave: Leave): void {
    if (!leave.id) return;

    if (confirm(`Are you sure you want to approve this leave request for ${leave.employeeName}?`)) {
      const approverId = this.currentEmployeeId ?? (this.currentUser?.id as unknown as number);
      const approval: LeaveApproval = {
        leaveId: leave.id,
        status: LeaveStatus.APPROVED,
        approvedBy: approverId
      };

      this.leaveService.approveLeave(approval)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.onSuccess('Leave approved successfully');
            this.loadAllData();
          },
          error: (error) => {
            this.notificationService.onError(
              error.error?.message || 'Failed to approve leave'
            );
          }
        });
    }
  }

  // ─── Filtered leaves (fully client-side)
  get filteredLeaves(): Leave[] {
    let result = [...this.allLeaves];

    // Tab filter
    switch (this.activeTab) {
      case 'pending':   result = result.filter(l => l.status === LeaveStatus.PENDING); break;
      case 'approved':  result = result.filter(l => l.status === LeaveStatus.APPROVED); break;
      case 'rejected':  result = result.filter(l => l.status === LeaveStatus.REJECTED); break;
      case 'upcoming':  result = this.upcomingLeaves; break;
      // 'all': no tab filter
    }

    // Status dropdown (only meaningful on 'all' tab)
    if (this.selectedStatus !== 'all') {
      result = result.filter(l => l.status === this.selectedStatus);
    }

    // Type dropdown
    if (this.selectedType !== 'all') {
      result = result.filter(l => l.leaveType === this.selectedType);
    }

    // Search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(l =>
        l.employeeName?.toLowerCase().includes(q) ||
        l.employeeEmail?.toLowerCase().includes(q)
      );
    }

    return result;
  }

  get activeTabLabel(): string {
    const labels: Record<string, string> = {
      pending: 'pending', approved: 'approved', rejected: 'rejected',
      upcoming: 'upcoming', all: ''
    };
    return labels[this.activeTab] || '';
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

  exportToExcel(): void {
    console.log('Export to Excel - to be implemented');
  }
}
