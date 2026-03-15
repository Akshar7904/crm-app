// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

// employee-expense-claims.component.ts
// ✅ UPDATED: Simplified to use UserModel directly (no separate employee fetch)
// Since User and Employee are now merged, user.id IS the employee ID

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable, BehaviorSubject, map, startWith, catchError, of, switchMap, Subject, takeUntil } from 'rxjs';
import { DataState } from '../../../enum/datastate.enum';
import { CustomHttpResponse, Page } from '../../../interface/appstates';
import { ExpenseClaim, ExpenseItem, ExpenseClaimStatus } from '../../../interface/expense-claim.model';
import { State } from '../../../interface/state';
import { ExpenseClaimService } from '../../../service/expense-claim.service';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UserModel } from '../../profile/user.model';

@Component({
  standalone: false,
  selector: 'app-employee-expense-claims',
  templateUrl: './employee-expense-claims.component.html',
  styleUrls: ['./employee-expense-claims.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeExpenseClaimsComponent implements OnInit, OnDestroy {
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
  private showModalSubject = new BehaviorSubject<boolean>(false);

  isLoading$ = this.isLoadingSubject.asObservable();
  currentPage$ = this.currentPageSubject.asObservable();
  showModal$ = this.showModalSubject.asObservable();

  readonly DataState = DataState;
  readonly ExpenseClaimStatus = ExpenseClaimStatus;

  // ✅ SIMPLIFIED: Only need current user (which has employee data)
  currentUser: UserModel | null = null;
  currentEmployeeId: number | null = null;
  newClaim: ExpenseClaim = this.initializeNewClaim();
  editingClaim: ExpenseClaim | null = null;
  private shouldOpenModal = false;

  constructor(
    private expenseClaimService: ExpenseClaimService,
    private notificationService: NotificationService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Check if navigating to /new route - should auto-open create modal
    this.shouldOpenModal = this.router.url.includes('/new');
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ SIMPLIFIED: Load user profile once (now includes employee data)
   * No need to fetch employee separately - user.id IS the employee ID
   */
  private loadCurrentUser(): void {
    this.userService.profile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.currentUser = response.data.user;

          if (!this.currentUser || !this.currentUser.id) {
            this.notificationService.onError('User profile not found');
            return;
          }

          // ✅ User ID = Employee ID (tables are merged)
          this.currentEmployeeId = this.currentUser.id;

          console.log('✅ User loaded:', {
            userId: this.currentUser.id,
            employeeId: this.currentUser.employeeId, // LKC0001, etc.
            name: `${this.currentUser.firstName} ${this.currentUser.lastName}`
          });

          // Load expense claims
          this.loadExpenseClaims();

          // Auto-open create modal if navigated to /new route
          if (this.shouldOpenModal) {
            setTimeout(() => {
              this.openCreateModal();
              this.shouldOpenModal = false;
            }, 100);
          }
        },
        error: (error) => {
          console.error('❌ Error loading user:', error);
          this.notificationService.onError('Failed to load user information');
        }
      });
  }

  /**
   * ✅ Use currentEmployeeId (which is currentUser.id)
   */
  private loadExpenseClaims(page: number = 0, size: number = 10): void {
    if (!this.currentEmployeeId) return;

    this.expenseClaimsState$ = this.expenseClaimService.expenseClaimsByEmployee$(
      this.currentEmployeeId,
      page,
      size
    ).pipe(
      map(response => {
        this.dataSubject.next(response);
        console.log('✅ Expense claims loaded:', response.data?.page?.content?.length || 0, 'claims');
        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADING }),
      catchError((error: string) => {
        console.error('❌ Error loading expense claims:', error);
        this.notificationService.onError(error);
        return of({ dataState: DataState.ERROR, error });
      })
    );
  }

  // ==================== PAGINATION ====================

  getClaims = (): ExpenseClaim[] => {
    return this.dataSubject.value?.data?.page?.content || [];
  };

  getTotalPages = (): number => {
    return this.dataSubject.value?.data?.page?.totalPages || 0;
  };

  getCurrentPage = (): number => {
    return this.dataSubject.value?.data?.page?.number || 0;
  };

  getPendingCount = (): number => {
    return this.dataSubject.value?.data?.pendingCount || 0;
  };

  goToPage(pageNumber: number, size: number = 10): void {
    if (!this.currentEmployeeId) return;

    this.currentPageSubject.next(pageNumber);
    this.expenseClaimsState$ = this.expenseClaimService.expenseClaimsByEmployee$(
      this.currentEmployeeId,
      pageNumber,
      size
    ).pipe(
      map(response => {
        this.dataSubject.next(response);
        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
      catchError((error: string) => {
        this.notificationService.onError(error);
        return of({ dataState: DataState.LOADED, error, appData: this.dataSubject.value });
      })
    );
  }

  goToNextOrPreviousPage(direction?: string, size: number = 10): void {
    const currentPage = this.currentPageSubject.value;
    const newPage = direction === 'forward' ? currentPage + 1 : currentPage - 1;

    if (newPage >= 0 && newPage < this.getTotalPages()) {
      this.goToPage(newPage, size);
    }
  }

  // ==================== CLAIM MANAGEMENT ====================

  private initializeNewClaim(): ExpenseClaim {
    return {
      employeeId: this.currentEmployeeId,
      claimDate: new Date().toISOString().split('T')[0],
      purpose: '',
      expenseItems: [this.createEmptyExpenseItem()]
    };
  }

  private createEmptyExpenseItem(): ExpenseItem {
    return {
      expenseDate: new Date().toISOString().split('T')[0],
      payTo: '',
      description: '',
      amount: 0,
      receiptAttached: false
    };
  }

  openCreateModal(): void {
    if (!this.currentEmployeeId) {
      this.notificationService.onError('Employee information not loaded');
      return;
    }
    this.newClaim = this.initializeNewClaim();
    this.editingClaim = null;
    this.showModalSubject.next(true);
  }

  openEditModal(claim: ExpenseClaim): void {
    if (claim.status === ExpenseClaimStatus.PENDING) {
      this.editingClaim = {
        ...claim,
        expenseItems: claim.expenseItems.map(item => ({ ...item }))
      };
      this.showModalSubject.next(true);
    } else {
      this.notificationService.onError('Only pending claims can be edited');
    }
  }

  closeModal(): void {
    this.showModalSubject.next(false);
    this.editingClaim = null;
  }

  addExpenseItem(): void {
    const claim = this.editingClaim || this.newClaim;
    if (!claim.expenseItems) claim.expenseItems = [];
    claim.expenseItems.push(this.createEmptyExpenseItem());
  }

  removeExpenseItem(index: number): void {
    const claim = this.editingClaim || this.newClaim;
    if (claim.expenseItems && claim.expenseItems.length > 1) {
      claim.expenseItems.splice(index, 1);
    } else {
      this.notificationService.onError('At least one expense item is required');
    }
  }

  calculateTotal(): number {
    const claim = this.editingClaim || this.newClaim;
    if (!claim.expenseItems || claim.expenseItems.length === 0) return 0;
    return claim.expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  onSubmit(): void {
    if (!this.currentEmployeeId) {
      this.notificationService.onError('Employee information not found');
      return;
    }

    const claim = this.editingClaim || this.newClaim;
    claim.employeeId = this.currentEmployeeId;

    if (!claim.claimDate || !claim.expenseItems || claim.expenseItems.length === 0) {
      this.notificationService.onError('Please fill in all required fields');
      return;
    }

    const invalidItems = claim.expenseItems.some(item =>
      !item.expenseDate || !item.payTo || !item.description || !item.amount || item.amount <= 0
    );

    if (invalidItems) {
      this.notificationService.onError('Please fill in all expense item details');
      return;
    }

    this.isLoadingSubject.next(true);

    const operation$ = this.editingClaim && this.editingClaim.id
      ? this.expenseClaimService.updateExpenseClaim$(this.editingClaim.id, claim)
      : this.expenseClaimService.createExpenseClaim$(claim);

    operation$.pipe(
      switchMap((response) => {
        this.notificationService.onSuccess(response.message);
        this.closeModal();
        return this.expenseClaimService.expenseClaimsByEmployee$(
          this.currentEmployeeId,
          this.currentPageSubject.value
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.dataSubject.next(response);
        // ✅ FIXED: Create new observable to trigger async pipe update
        this.expenseClaimsState$ = of({ dataState: DataState.LOADED, appData: response });
        this.isLoadingSubject.next(false);
        // Force change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.notificationService.onError(error);
        this.isLoadingSubject.next(false);
        this.cdr.markForCheck();
      }
    });
  }

  cancelClaim(claim: ExpenseClaim): void {
    if (!this.currentEmployeeId || !claim.id) return;

    if (confirm('Are you sure you want to cancel this claim?')) {
      this.isLoadingSubject.next(true);

      this.expenseClaimService.cancelExpenseClaim$(claim.id, this.currentEmployeeId)
        .pipe(
          switchMap((response) => {
            this.notificationService.onSuccess(response.message);
            return this.expenseClaimService.expenseClaimsByEmployee$(
              this.currentEmployeeId,
              this.currentPageSubject.value
            );
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response) => {
            this.dataSubject.next(response);
            // ✅ FIXED: Create new observable to trigger async pipe update
            this.expenseClaimsState$ = of({ dataState: DataState.LOADED, appData: response });
            this.isLoadingSubject.next(false);
            // Force change detection
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.notificationService.onError(error);
            this.isLoadingSubject.next(false);
            this.cdr.markForCheck();
          }
        });
    }
  }

  viewClaimDetails(claim: ExpenseClaim): void {
    if (!claim.id) return;

    this.expenseClaimService.expenseClaim$(claim.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Claim details:', response.data.expenseClaim);
        },
        error: (error) => {
          this.notificationService.onError('Failed to load claim details');
        }
      });
  }

  downloadMyReport(): void {
    if (!this.currentEmployeeId) return;

    this.expenseClaimService.downloadReport$(this.currentEmployeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `expense-claims-${this.currentUser?.employeeId || 'employee'}-${new Date().toISOString().split('T')[0]}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.notificationService.onSuccess('Report downloaded successfully');
        },
        error: (error) => {
          this.notificationService.onError('Failed to download report');
        }
      });
  }

  // ==================== HELPER METHODS ====================

  getStatusClass(status: ExpenseClaimStatus): string {
    switch (status) {
      case ExpenseClaimStatus.PENDING: return 'badge-soft-pending';
      case ExpenseClaimStatus.APPROVED: return 'badge-soft-approved';
      case ExpenseClaimStatus.REJECTED: return 'badge-soft-rejected';
      case ExpenseClaimStatus.PAID: return 'badge-soft-paid';
      case ExpenseClaimStatus.CANCELLED: return 'badge-soft-cancelled';
      default: return 'badge-soft-cancelled';
    }
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
    if (!amount) return 'R 0.00';
    return `R ${amount.toFixed(2)}`;
  }

  /**
   * Get user's full name for display
   */
  getUserFullName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
  }

  /**
   * Get user's employee ID (e.g., LKC0001)
   */
  getEmployeeCode(): string {
    return this.currentUser?.employeeId || 'N/A';
  }
}
