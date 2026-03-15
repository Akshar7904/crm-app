// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, BehaviorSubject, map, startWith, catchError, of, Subject, takeUntil } from 'rxjs';
import { DataState } from '../../../enum/datastate.enum';
import { CustomHttpResponse, Page } from '../../../interface/appstates';
import { ExpenseClaim, ExpenseClaimStatus, ExpenseClaimApprovalForm } from '../../../interface/expense-claim.model';
import { State } from '../../../interface/state';
import { ExpenseClaimService } from '../../../service/expense-claim.service';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';
import { UserModel } from '../../profile/user.model';

@Component({
  standalone: false,
  selector: 'app-admin-expense-claims',
  templateUrl: './admin-expense-claims.component.html',
  styleUrls: ['./admin-expense-claims.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminExpenseClaimsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  expenseClaimsState$: Observable<State<CustomHttpResponse<{
    user: UserModel;
    page: Page<ExpenseClaim>;
    pendingCount?: number
  }>>>;

  private dataSubject = new BehaviorSubject<CustomHttpResponse<{
    user: UserModel;
    page: Page<ExpenseClaim>;
    pendingCount?: number
  }>>(null);

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private currentPageSubject = new BehaviorSubject<number>(0);
  private showApprovalModalSubject = new BehaviorSubject<boolean>(false);
  private showDetailModalSubject = new BehaviorSubject<boolean>(false);

  isLoading$ = this.isLoadingSubject.asObservable();
  currentPage$ = this.currentPageSubject.asObservable();
  showApprovalModal$ = this.showApprovalModalSubject.asObservable();
  showDetailModal$ = this.showDetailModalSubject.asObservable();

  readonly DataState = DataState;
  readonly ExpenseClaimStatus = ExpenseClaimStatus;

  currentUser: UserModel | null = null;
  currentEmployeeId: number | null = null;
  isSysAdmin = false;
  approvalForm: FormGroup;
  selectedClaim: ExpenseClaim | null = null;
  approvalAction: 'approve' | 'reject' = 'approve';
  activeTab: 'all' | 'pending' | 'approved' | 'rejected' | 'paid' = 'pending';
  searchQuery: string = '';
  filterStatus: ExpenseClaimStatus | 'all' = 'all';

  constructor(
    private formBuilder: FormBuilder,
    private expenseClaimService: ExpenseClaimService,
    private notificationService: NotificationService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.approvalForm = this.formBuilder.group({
      remarks: [''],
      rejectionReason: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentUserAndEmployee();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load current user profile and set approver ID.
   * Admin/SysAdmin users use their user ID directly — no extra employee lookup needed.
   */
  private loadCurrentUserAndEmployee(): void {
    this.userService.profile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.currentUser = response.data.user;
          if (!this.currentUser?.id) {
            this.notificationService.onError('Unable to load user profile.');
            return;
          }
          this.isSysAdmin = (this.currentUser as any).roleName === 'ROLE_SYSADMIN';
          // Use user ID as approver ID (same as employee ID in unified users table)
          this.currentEmployeeId = this.currentUser.id;
          this.loadExpenseClaims();
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          this.notificationService.onError('Failed to load employee information');
        }
      });
  }

  private loadExpenseClaims(page: number = 0, size: number = 20): void {
    this.expenseClaimsState$ = this.expenseClaimService.expenseClaims$(page, size).pipe(
      map(response => {
        this.dataSubject.next(response);
        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADING }),
      catchError((error: string) => {
        this.notificationService.onError(error);
        return of({ dataState: DataState.ERROR, error });
      })
    );
  }

  private loadClaimsByStatus(status: ExpenseClaimStatus, page: number = 0, size: number = 20): void {
    this.expenseClaimsState$ = this.expenseClaimService.expenseClaimsByStatus$(status, page, size).pipe(
      map(response => {
        this.dataSubject.next(response);
        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADING }),
      catchError((error: string) => {
        this.notificationService.onError(error);
        return of({ dataState: DataState.ERROR, error });
      })
    );
  }

  onFilterChange(): void {
    if (this.filterStatus === 'all') {
      this.setActiveTab('all');
    } else {
      this.loadClaimsByStatus(this.filterStatus as ExpenseClaimStatus);
    }
  }

  onSearch(): void {
    if (!this.searchQuery?.trim()) {
      this.loadExpenseClaims();
      return;
    }

    this.expenseClaimsState$ = this.expenseClaimService.searchExpenseClaims$(
      this.searchQuery,
      this.currentPageSubject.value
    ).pipe(
      map(response => {
        this.dataSubject.next(response);
        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADING }),
      catchError((error: string) => {
        this.notificationService.onError(error);
        return of({ dataState: DataState.ERROR, error });
      })
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadExpenseClaims();
  }

  setActiveTab(tab: 'all' | 'pending' | 'approved' | 'rejected' | 'paid'): void {
    this.activeTab = tab;
    this.currentPageSubject.next(0);
    this.searchQuery = '';

    const statusMap = {
      all: null,
      pending: ExpenseClaimStatus.PENDING,
      approved: ExpenseClaimStatus.APPROVED,
      rejected: ExpenseClaimStatus.REJECTED,
      paid: ExpenseClaimStatus.PAID
    };

    if (statusMap[tab]) {
      this.loadClaimsByStatus(statusMap[tab]);
    } else {
      this.loadExpenseClaims();
    }
  }

  getClaims = (): ExpenseClaim[] => {
    return this.dataSubject.value?.data?.page?.content || [];
  };

  getTotalPages = (): number => {
    return this.dataSubject.value?.data?.page?.totalPages || 0;
  };

  getPendingCount = (): number => {
    return this.dataSubject.value?.data?.pendingCount || 0;
  };

  goToPage(pageNumber: number, size: number = 20): void {
    this.currentPageSubject.next(pageNumber);

    if (this.activeTab === 'all') {
      this.loadExpenseClaims(pageNumber, size);
    } else {
      const statusMap = {
        pending: ExpenseClaimStatus.PENDING,
        approved: ExpenseClaimStatus.APPROVED,
        rejected: ExpenseClaimStatus.REJECTED,
        paid: ExpenseClaimStatus.PAID
      };
      this.loadClaimsByStatus(statusMap[this.activeTab], pageNumber, size);
    }
  }

  viewClaimDetails(claim: ExpenseClaim): void {
    if (!claim.id) return;

    this.expenseClaimService.expenseClaim$(claim.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.selectedClaim = response.data.expenseClaim;
          this.showDetailModalSubject.next(true);
        },
        error: () => this.notificationService.onError('Failed to load claim details')
      });
  }

  closeDetailModal(): void {
    this.showDetailModalSubject.next(false);
    this.selectedClaim = null;
  }

  openApprovalModal(claim: ExpenseClaim, action: 'approve' | 'reject'): void {
    if (!this.currentEmployeeId) {
      this.notificationService.onError('Employee information not loaded');
      return;
    }

    if (claim.status !== ExpenseClaimStatus.PENDING) {
      this.notificationService.onError('Only pending claims can be approved or rejected');
      return;
    }

    this.selectedClaim = claim;
    this.approvalAction = action;
    this.approvalForm.reset();

    const rejectionField = this.approvalForm.get('rejectionReason');
    if (action === 'reject') {
      rejectionField?.setValidators([Validators.required]);
    } else {
      rejectionField?.clearValidators();
    }
    rejectionField?.updateValueAndValidity();

    this.showApprovalModalSubject.next(true);
  }

  closeApprovalModal(): void {
    this.showApprovalModalSubject.next(false);
    this.selectedClaim = null;
    this.approvalForm.reset();
  }

  submitApproval(): void {
    if (!this.selectedClaim?.id || !this.currentEmployeeId) {
      this.notificationService.onError('Missing required information');
      return;
    }

    if (this.approvalAction === 'reject' && this.approvalForm.get('rejectionReason')?.invalid) {
      this.notificationService.onError('Please provide a rejection reason');
      return;
    }

    const approvalData: ExpenseClaimApprovalForm = {
      expenseClaimId: this.selectedClaim.id,
      approvedBy: this.currentEmployeeId,
      remarks: this.approvalForm.value.remarks,
      rejectionReason: this.approvalForm.value.rejectionReason
    };

    this.isLoadingSubject.next(true);

    const operation$ = this.approvalAction === 'approve'
      ? this.expenseClaimService.approveExpenseClaim$(approvalData)
      : this.expenseClaimService.rejectExpenseClaim$(approvalData);

    operation$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.notificationService.onSuccess(response.message);
        this.closeApprovalModal();
        this.isLoadingSubject.next(false);
        // Refresh the claims list by reloading the appropriate tab
        this.refreshClaimsList();
      },
      error: (error) => {
        this.notificationService.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Refresh the claims list based on the active tab
   * Uses the same load methods and forces detection AFTER observable reassignment
   */
  private refreshClaimsList(): void {
    const currentPage = this.currentPageSubject.value;

    if (this.activeTab === 'all') {
      this.loadExpenseClaims(currentPage);
    } else {
      const statusMap: Record<string, ExpenseClaimStatus> = {
        pending: ExpenseClaimStatus.PENDING,
        approved: ExpenseClaimStatus.APPROVED,
        rejected: ExpenseClaimStatus.REJECTED,
        paid: ExpenseClaimStatus.PAID
      };
      this.loadClaimsByStatus(statusMap[this.activeTab], currentPage);
    }

    // Force change detection AFTER the observable has been reassigned
    this.cdr.detectChanges();
  }

  quickApprove(claim: ExpenseClaim): void {
    if (!claim.id || !this.currentEmployeeId || claim.status !== ExpenseClaimStatus.PENDING) return;

    if (confirm(`Are you sure you want to approve this claim for ${claim.employeeName}?`)) {
      this.expenseClaimService.approveExpenseClaim$({
        expenseClaimId: claim.id,
        approvedBy: this.currentEmployeeId
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.notificationService.onSuccess(response.message);
            this.refreshClaimsList();
          },
          error: (error) => this.notificationService.onError(error)
        });
    }
  }

  markAsPaid(claim: ExpenseClaim): void {
    if (!claim.id || !this.currentEmployeeId || claim.status !== ExpenseClaimStatus.APPROVED) return;

    if (confirm('Are you sure you want to mark this claim as paid?')) {
      this.expenseClaimService.markAsPaid$(claim.id, this.currentEmployeeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.notificationService.onSuccess(response.message);
            this.refreshClaimsList();
          },
          error: (error) => this.notificationService.onError(error)
        });
    }
  }

  downloadReport(employeeId?: number, status?: ExpenseClaimStatus): void {
    this.expenseClaimService.downloadReport$(employeeId, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `expense-claims-report-${new Date().toISOString().split('T')[0]}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.notificationService.onSuccess('Report downloaded successfully');
        },
        error: () => this.notificationService.onError('Failed to download report')
      });
  }

  getStatusClass(status: ExpenseClaimStatus): string {
    const classes = {
      [ExpenseClaimStatus.PENDING]:   'badge-pending',
      [ExpenseClaimStatus.APPROVED]:  'badge-approved',
      [ExpenseClaimStatus.REJECTED]:  'badge-rejected',
      [ExpenseClaimStatus.PAID]:      'badge-paid',
      [ExpenseClaimStatus.CANCELLED]: 'badge-cancelled'
    };
    return classes[status] || 'badge-cancelled';
  }

  getTotalElements(): number {
    return this.dataSubject.value?.data?.page?.totalElements || 0;
  }

  getVisibleTotal(): number {
    return this.getClaims().reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return amount ? `R ${amount.toFixed(2)}` : 'R 0.00';
  }

  canApprove(claim: ExpenseClaim): boolean {
    return claim.status === ExpenseClaimStatus.PENDING;
  }

  canMarkAsPaid(claim: ExpenseClaim): boolean {
    return claim.status === ExpenseClaimStatus.APPROVED;
  }

  canDelete(claim: ExpenseClaim): boolean {
    return this.isSysAdmin ||
      claim.status === ExpenseClaimStatus.PENDING ||
      claim.status === ExpenseClaimStatus.CANCELLED;
  }

  deleteClaim(claim: ExpenseClaim): void {
    if (!claim.id) return;
    if (!confirm(`Delete this expense claim (${claim.claimNumber})? This cannot be undone.`)) return;
    this.expenseClaimService.deleteExpenseClaim$(claim.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.onSuccess('Expense claim deleted');
          this.refreshClaimsList();
        },
        error: (err) => this.notificationService.onError(err?.error?.message || 'Failed to delete claim')
      });
  }
}
