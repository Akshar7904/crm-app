// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExpensesService } from '../services/expenses.service';
import { UserService } from '../../../service/user.service';
import { NotificationService } from '../../../service/notification.service';
import { BankingService } from '../../accounting/services/banking.service';

@Component({
  standalone: false,
  selector: 'app-expenses-claims',
  templateUrl: './expenses-claims.component.html',
  styleUrls: ['./expenses-claims.component.scss']
})
export class ExpensesClaimsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  claims: any[] = [];
  loading = false;
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 20;
  selectedStatus = 'ALL';
  isAdmin = false;
  searchQuery = '';
  currentUserId: number | null = null;

  // Pay modal
  showPayModal = false;
  payTargetId: number | null = null;
  payPaymentMethod: 'CASH' | 'BANK_TRANSFER' = 'CASH';
  payBankAccountId: number | null = null;
  bankAccounts: any[] = [];

  // Approve/Reject modals
  showApproveModal = false;
  showRejectModal = false;
  actionTargetId: number | null = null;
  rejectReason = '';

  constructor(
    private expensesService: ExpensesService,
    private userService: UserService,
    private notification: NotificationService,
    private bankingService: BankingService
  ) {}

  ngOnInit(): void {
    this.userService.profile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const role = res.data.user?.roleName;
          this.isAdmin = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_MANAGER'].includes(role);
          this.currentUserId = res.data.user?.id ?? null;
          this.loadClaims();
        }
      });
    this.bankingService.getActiveAccounts$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => { this.bankAccounts = res?.data?.accounts ?? res ?? []; },
        error: () => {}
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClaims(): void {
    this.loading = true;
    const obs = (this.isAdmin && this.selectedStatus === 'ALL')
      ? this.expensesService.getAdminClaims(this.currentPage, this.pageSize)
      : this.expensesService.getClaimsByStatus(this.selectedStatus, this.currentPage, this.pageSize);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const d = res?.data;
        const page = d?.page ?? d;
        this.claims = page?.content ?? (Array.isArray(d) ? d : []);
        this.totalElements = page?.totalElements ?? this.claims.length;
        this.totalPages = page?.totalPages ?? 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notification.onError('Failed to load expense claims');
      }
    });
  }

  setStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 0;
    this.searchQuery = '';
    this.loadClaims();
  }

  onSearch(): void {
    // client-side filter against already loaded page
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.loadClaims(); }
  }

  prevPage(): void {
    if (this.currentPage > 0) { this.currentPage--; this.loadClaims(); }
  }

  get filteredClaims(): any[] {
    if (!this.searchQuery.trim()) return this.claims;
    const q = this.searchQuery.toLowerCase();
    return this.claims.filter(c =>
      (c.claimNumber || '').toLowerCase().includes(q) ||
      (c.employeeName || '').toLowerCase().includes(q) ||
      (c.purpose || '').toLowerCase().includes(q)
    );
  }

  get pendingCount(): number  { return this.claims.filter(c => c.status === 'PENDING').length; }
  get approvedCount(): number { return this.claims.filter(c => c.status === 'APPROVED').length; }
  get paidCount(): number     { return this.claims.filter(c => c.status === 'PAID').length; }

  // -------- Approve --------
  openApproveModal(id: number): void {
    this.actionTargetId = id;
    this.showApproveModal = true;
  }

  closeApproveModal(): void {
    this.showApproveModal = false;
    this.actionTargetId = null;
  }

  confirmApprove(): void {
    if (!this.actionTargetId || !this.currentUserId) return;
    this.expensesService.approveClaim({ expenseClaimId: this.actionTargetId, approvedBy: this.currentUserId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.notification.onSuccess('Claim approved'); this.closeApproveModal(); this.loadClaims(); },
        error: (err: any) => this.notification.onError(err?.error?.message || 'Failed to approve claim')
      });
  }

  // -------- Reject --------
  openRejectModal(id: number): void {
    this.actionTargetId = id;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.actionTargetId = null;
  }

  confirmReject(): void {
    if (!this.actionTargetId || !this.currentUserId) return;
    this.expensesService.rejectClaim({ expenseClaimId: this.actionTargetId, approvedBy: this.currentUserId, rejectionReason: this.rejectReason })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.notification.onSuccess('Claim rejected'); this.closeRejectModal(); this.loadClaims(); },
        error: (err: any) => this.notification.onError(err?.error?.message || 'Failed to reject claim')
      });
  }

  // -------- Mark Paid --------
  openPayModal(id: number): void {
    this.payTargetId = id;
    this.payPaymentMethod = 'CASH';
    this.payBankAccountId = null;
    this.showPayModal = true;
  }

  closePayModal(): void {
    this.showPayModal = false;
    this.payTargetId = null;
  }

  confirmPay(): void {
    if (!this.payTargetId || !this.currentUserId) return;
    this.expensesService.markClaimPaid(
      this.payTargetId,
      this.currentUserId,
      this.payPaymentMethod,
      this.payPaymentMethod === 'BANK_TRANSFER' && this.payBankAccountId ? this.payBankAccountId : undefined
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const msg = this.payPaymentMethod === 'BANK_TRANSFER' && this.payBankAccountId
            ? 'Claim paid and banking transaction recorded'
            : 'Claim marked as paid (cash)';
          this.notification.onSuccess(msg);
          this.closePayModal();
          this.loadClaims();
        },
        error: (err: any) => this.notification.onError(err?.error?.message || 'Failed to mark claim as paid')
      });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getStatusClass(status: string): string {
    const map: any = {
      PENDING: 'badge-pending', APPROVED: 'badge-approved',
      PAID: 'badge-paid', REJECTED: 'badge-rejected', CANCELLED: 'badge-cancelled'
    };
    return map[status] || '';
  }

  formatCurrency(val: number): string {
    return `R ${(val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  }
}
