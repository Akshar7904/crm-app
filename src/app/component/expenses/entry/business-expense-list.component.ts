// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BusinessExpenseService } from '../services/business-expense.service';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';

@Component({
  standalone: false,
  selector: 'app-business-expense-list',
  templateUrl: './business-expense-list.component.html',
  styleUrls: ['./business-expense-list.component.scss']
})
export class BusinessExpenseListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  expenses: any[] = [];
  loading = false;
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 20;
  selectedStatus = '';
  isSysAdmin = false;

  statusOptions = ['', 'DRAFT', 'APPROVED', 'VOID'];

  constructor(
    private businessExpenseService: BusinessExpenseService,
    private userService: UserService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.userService.profile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isSysAdmin = res.data.user?.roleName === 'ROLE_SYSADMIN';
          this.loadExpenses();
        },
        error: () => this.loadExpenses()
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadExpenses(): void {
    this.loading = true;
    this.businessExpenseService.getAll(this.currentPage, this.pageSize, this.selectedStatus || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const d = res?.data;
          // Handle paginated Spring Page object or flat list
          if (d?.page) {
            this.expenses = d.page.content ?? [];
            this.totalElements = d.page.totalElements ?? 0;
            this.totalPages = d.page.totalPages ?? 0;
          } else if (d?.expenses) {
            this.expenses = d.expenses;
            this.totalElements = d.expenses.length;
            this.totalPages = 1;
          } else if (d?.content) {
            this.expenses = d.content;
            this.totalElements = d.totalElements ?? d.content.length;
            this.totalPages = d.totalPages ?? 1;
          } else if (Array.isArray(d)) {
            this.expenses = d;
            this.totalElements = d.length;
            this.totalPages = 1;
          } else {
            this.expenses = [];
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.notification.onError('Failed to load expenses');
        }
      });
  }

  onStatusChange(): void {
    this.currentPage = 0;
    this.loadExpenses();
  }

  approve(id: number): void {
    if (!confirm('Approve this expense?')) return;
    this.businessExpenseService.approve(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.notification.onSuccess('Expense approved'); this.loadExpenses(); },
        error: () => this.notification.onError('Failed to approve expense')
      });
  }

  voidExpense(id: number): void {
    if (!confirm('Void this expense?')) return;
    this.businessExpenseService.void(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.notification.onSuccess('Expense voided'); this.loadExpenses(); },
        error: () => this.notification.onError('Failed to void expense')
      });
  }

  delete(id: number): void {
    if (!confirm('Delete this draft expense?')) return;
    this.businessExpenseService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.notification.onSuccess('Expense deleted'); this.loadExpenses(); },
        error: () => this.notification.onError('Failed to delete expense')
      });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.loadExpenses(); }
  }

  prevPage(): void {
    if (this.currentPage > 0) { this.currentPage--; this.loadExpenses(); }
  }

  getStatusClass(status: string): string {
    const map: any = { DRAFT: 'badge-draft', APPROVED: 'badge-approved', VOID: 'badge-void' };
    return map[status] || 'badge-secondary';
  }

  formatCurrency(val: number): string {
    return `R ${(val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  }
}
