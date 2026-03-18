// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
// admin-leave.component.ts
// Updated to fetch admin/manager information from authenticated user using correct endpoint

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
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
  LeaveBalance,
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
  styleUrls: ['./admin-leave.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  activeTab: 'all' | 'pending' | 'approved' | 'rejected' | 'upcoming' | 'allocate' = 'pending';
  searchQuery: string = '';
  selectedStatus: LeaveStatus | 'all' = 'all';
  selectedType: LeaveType | 'all' = 'all';

  // Enums for template
  leaveTypes = Object.values(LeaveType);
  leaveStatuses = Object.values(LeaveStatus);
  leaveTypeLabels = LEAVE_TYPE_LABELS;
  leaveStatusLabels = LEAVE_STATUS_LABELS;
  LeaveStatus = LeaveStatus;

  // ─── Leave Allocation
  // hireYear filter: show employees who started working in this year
  allocationYear: number = new Date().getFullYear();
  allBalances: LeaveBalance[] = [];
  groupedBalances: { employeeName: string; employeeId: number; balances: LeaveBalance[] }[] = [];
  allocationLoading: boolean = false;
  savingBalanceId: string = ''; // key: employeeId-leaveType
  showAllEmployees: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private leaveService: LeaveService,
    private userService: UserService,
    private notificationService: NotificationService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
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
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.currentDataState = DataState.ERROR;
          this.error = err?.message || 'Failed to load leave requests';
          this.cdr.markForCheck();
        }
      });

    this.leaveService.getUpcomingLeaves(30)
      .pipe(takeUntil(this.destroy$))
      .subscribe((leaves: Leave[]) => { this.upcomingLeaves = leaves; this.cdr.markForCheck(); });
  }

  // ─── Computed counts per tab
  get pendingCount(): number { return this.allLeaves.filter(l => l.status === LeaveStatus.PENDING).length; }
  get approvedCount(): number { return this.allLeaves.filter(l => l.status === LeaveStatus.APPROVED).length; }
  get rejectedCount(): number { return this.allLeaves.filter(l => l.status === LeaveStatus.REJECTED).length; }
  get upcomingCount(): number { return this.upcomingLeaves.length; }

  // ─── Tab
  setActiveTab(tab: 'all' | 'pending' | 'approved' | 'rejected' | 'upcoming' | 'allocate'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.selectedStatus = 'all';
    this.selectedType = 'all';
    if (tab === 'allocate') {
      this.loadAllocationData();
    }
  }

  loadAllocationData(): void {
    this.allocationLoading = true;
    this.leaveService.getAllBalancesForHireYear(this.allocationYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (balances: LeaveBalance[]) => {
          this.allBalances = balances;
          this.allocationLoading = false;
          this.buildGroupedBalances();
        },
        error: () => {
          this.allocationLoading = false;
          this.notificationService.onError('Failed to load leave balances');
        }
      });
  }

  private buildGroupedBalances(): void {
    const grouped = new Map<number, { employeeName: string; employeeId: number; balances: LeaveBalance[] }>();
    for (const b of this.allBalances) {
      if (!grouped.has(b.employeeId)) {
        grouped.set(b.employeeId, { employeeName: b.employeeName || 'Unknown', employeeId: b.employeeId, balances: [] });
      }
      grouped.get(b.employeeId)!.balances.push(b);
    }
    this.groupedBalances = Array.from(grouped.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    this.cdr.markForCheck();
  }

  saveEntitlement(balance: LeaveBalance): void {
    if (!balance.employeeId || !balance.leaveType) return;
    const key = `${balance.employeeId}-${balance.leaveType}`;
    this.savingBalanceId = key;
    // balance.year is the actual DB record year (e.g. 2026); allocationYear is the hire-year filter
    const balanceYear = balance.year || new Date().getFullYear();
    this.leaveService.updateLeaveEntitlement(
      balance.employeeId, balance.leaveType as string, balanceYear, balance.totalEntitled
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.savingBalanceId = '';
        this.notificationService.onSuccess('Leave entitlement updated');
        // Reload from DB so the table shows the authoritative available/entitled values
        this.loadAllocationData();
      },
      error: (error: any) => {
        this.savingBalanceId = '';
        this.notificationService.onError(error?.error?.message || 'Failed to update entitlement');
      }
    });
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
    if (this.activeTab === 'allocate') return [];
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
      upcoming: 'upcoming', all: '', allocate: ''
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

  viewDoctorNote(leave: Leave): void {
    if (!leave.id) return;
    const url = `${this.leaveServer}/${leave.id}/doctor-note`;
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

  exportToExcel(): void {
    console.log('Export to Excel - to be implemented');
  }

  downloadReport(): void {
    this.leaveService.downloadReport$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `leave-report-${new Date().toISOString().split('T')[0]}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => this.notificationService.onError('Failed to download leave report')
      });
  }

  toggleShowAll(): void {
    this.showAllEmployees = !this.showAllEmployees;
    if (this.showAllEmployees) {
      this.loadAllBalances();
    } else {
      this.loadAllocationData();
    }
  }

  loadAllBalances(): void {
    this.allocationLoading = true;
    const year = new Date().getFullYear();
    this.leaveService.getAllBalancesForYear$(year)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.allBalances = response.data || [];
          this.allocationLoading = false;
          this.buildGroupedBalances();
        },
        error: () => {
          this.allocationLoading = false;
          this.notificationService.onError('Failed to load all leave balances');
        }
      });
  }

  trackById(index: number, item: any): any { return item?.id ?? index; }
  trackByValue(index: number, value: any): any { return value ?? index; }
  trackByEmployeeId(index: number, item: any): any { return item?.employeeId ?? index; }
  trackByBalance(index: number, item: any): any { return item?.id ?? item?.leaveType ?? index; }
}
