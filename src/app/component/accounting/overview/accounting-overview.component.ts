// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BillService } from '../services/bill.service';
import { CustomerService } from '../../../service/customer.service';
import { ExpensesService } from '../../expenses/services/expenses.service';
import { Bill } from '../models/bill.model';
import { InvoiceModel } from '../../invoice/invoice.model';

@Component({
  standalone: false,
  selector: 'app-accounting-overview',
  templateUrl: './accounting-overview.component.html',
  styleUrls: ['./accounting-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingOverviewComponent implements OnInit {

  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;

  summary: any = null;
  billStats: any = null;
  recentBills: Bill[] = [];
  recentInvoices: InvoiceModel[] = [];
  invoiceStats: any = null;

  loading = false;
  loadingBills = false;
  loadingInvoices = false;

  readonly years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  readonly months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  constructor(
    private billService: BillService,
    private customerService: CustomerService,
    private expensesService: ExpensesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSummary();
    this.loadRecentBills();
    this.loadRecentInvoices();
  }

  onPeriodChange(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.expensesService.getSummary(this.selectedYear, this.selectedMonth).subscribe({
      next: (res: any) => {
        this.summary = res.data?.summary;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  loadRecentBills(): void {
    this.loadingBills = true;
    this.cdr.markForCheck();
    this.billService.bills$(0, 5).subscribe({
      next: (res: any) => {
        this.recentBills = res.data?.page?.content ?? [];
        this.billStats = res.data?.stats;
        this.loadingBills = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingBills = false; this.cdr.markForCheck(); }
    });
  }

  loadRecentInvoices(): void {
    this.loadingInvoices = true;
    this.cdr.markForCheck();
    this.customerService.invoices$(0).subscribe({
      next: (res: any) => {
        const all = res.data?.page?.content ?? [];
        this.recentInvoices = all.slice(0, 5);
        this.loadingInvoices = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingInvoices = false; this.cdr.markForCheck(); }
    });
  }

  get totalRevenue(): number { return this.summary?.totalIncome ?? 0; }
  get grossProfit(): number { return this.summary?.grossProfit ?? 0; }
  get netProfit(): number { return this.summary?.netProfit ?? 0; }
  get apOutstanding(): number { return this.summary?.apOutstanding ?? (this.billStats?.outstanding ?? 0); }
  get claimsOutstanding(): number { return this.summary?.claimsOutstanding ?? 0; }
  get totalAP(): number { return this.apOutstanding + this.claimsOutstanding; }
  get overdueCount(): number { return this.billStats?.overdue ?? 0; }
  get isProfit(): boolean { return this.netProfit >= 0; }

  formatCurrency(val: number | undefined): string {
    return `R ${(val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  }

  getBillStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'badge-soft-secondary', RECEIVED: 'badge-soft-info',
      DUE: 'badge-soft-warning', PAID: 'badge-soft-success', OVERDUE: 'badge-soft-danger'
    };
    return map[status] ?? 'badge-soft-secondary';
  }

  getBillStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Draft', RECEIVED: 'Received', DUE: 'Due', PAID: 'Paid', OVERDUE: 'Overdue'
    };
    return map[status] ?? status;
  }

  getInvoiceStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'badge-soft-secondary', SENT: 'badge-soft-info',
      PAID: 'badge-soft-success', CANCELLED: 'badge-soft-danger'
    };
    return map[status] ?? 'badge-soft-secondary';
  }

  getInvoiceStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Draft', SENT: 'Sent', PAID: 'Paid', CANCELLED: 'Cancelled'
    };
    return map[status] ?? status;
  }
}
