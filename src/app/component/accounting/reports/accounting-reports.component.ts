// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BillService } from '../services/bill.service';
import { ExpensesService } from '../../expenses/services/expenses.service';
import { NotificationService } from '../../../service/notification.service';
import { Bill } from '../models/bill.model';

export interface AgingBucket {
  label: string;
  range: string;
  bills: Bill[];
  total: number;
  colorClass: string;
}

@Component({
  standalone: false,
  selector: 'app-accounting-reports',
  templateUrl: './accounting-reports.component.html',
  styleUrls: ['./accounting-reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingReportsComponent implements OnInit {

  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;

  allBills: Bill[] = [];
  profitLoss: any = null;
  summary: any = null;

  loading = false;
  loadingPL = false;
  exporting = false;

  activeReport: 'aging' | 'pl' = 'aging';

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
    private expensesService: ExpensesService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAgingData();
    this.loadPLData();
  }

  onPeriodChange(): void {
    this.loadPLData();
  }

  loadAgingData(): void {
    this.loading = true;
    this.cdr.markForCheck();
    // Load all unpaid bills for aging analysis
    this.billService.bills$(0, 500).subscribe({
      next: (res: any) => {
        this.allBills = (res.data?.page?.content ?? []).filter((b: Bill) => b.status !== 'PAID');
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  loadPLData(): void {
    this.loadingPL = true;
    this.cdr.markForCheck();
    this.expensesService.getIncomeStatement(this.selectedYear, this.selectedMonth).subscribe({
      next: (res: any) => {
        this.profitLoss = res.data?.profitLoss;
        this.loadingPL = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingPL = false; this.cdr.markForCheck(); }
    });
    this.expensesService.getSummary(this.selectedYear, this.selectedMonth).subscribe({
      next: (res: any) => { this.summary = res.data?.summary; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  get agingBuckets(): AgingBucket[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets: AgingBucket[] = [
      { label: 'Not Yet Due', range: 'Current', bills: [], total: 0, colorClass: 'success' },
      { label: '1 – 30 Days', range: 'Past Due', bills: [], total: 0, colorClass: 'warning' },
      { label: '31 – 60 Days', range: 'Past Due', bills: [], total: 0, colorClass: 'orange' },
      { label: '61 – 90 Days', range: 'Past Due', bills: [], total: 0, colorClass: 'danger' },
      { label: '90+ Days', range: 'Critical', bills: [], total: 0, colorClass: 'dark-danger' }
    ];

    for (const bill of this.allBills) {
      const due = new Date(bill.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - due.getTime()) / 86400000);

      let idx: number;
      if (diffDays <= 0)      idx = 0;
      else if (diffDays <= 30) idx = 1;
      else if (diffDays <= 60) idx = 2;
      else if (diffDays <= 90) idx = 3;
      else                     idx = 4;

      buckets[idx].bills.push(bill);
      buckets[idx].total += bill.total || 0;
    }

    return buckets;
  }

  get totalUnpaidAP(): number {
    return this.allBills.reduce((s, b) => s + (b.total || 0), 0);
  }

  get overdueAP(): number {
    return this.agingBuckets.slice(1).reduce((s, b) => s + b.total, 0);
  }

  exportPL(): void {
    this.exporting = true;
    this.cdr.markForCheck();
    this.expensesService.downloadIncomeStatement(this.selectedYear, this.selectedMonth, this.selectedMonth)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Income_Statement_${this.selectedYear}_${String(this.selectedMonth).padStart(2,'0')}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.exporting = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.notification.onError(err);
          this.exporting = false;
          this.cdr.markForCheck();
        }
      });
  }

  printReport(): void {
    window.print();
  }

  formatCurrency(val: number | undefined): string {
    return `R ${(val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  }

  get isProfit(): boolean { return (this.profitLoss?.netProfit ?? 0) >= 0; }
}
