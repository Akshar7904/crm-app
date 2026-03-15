// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BudgetService } from '../services/budget.service';

@Component({
  standalone: false,
  selector: 'app-budget-vs-actual',
  templateUrl: './budget-vs-actual.component.html',
  styleUrls: ['./budget-vs-actual.component.scss']
})
export class BudgetVsActualComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  years = Array.from({ length: 5 }, (_, i) => this.currentYear - i);

  summary: any = null;
  loading = false;

  constructor(private budgetService: BudgetService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    this.summary = null;
    this.budgetService.getYearSummary(this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.summary = res.data?.summary || null;
        },
        error: () => { this.loading = false; }
      });
  }

  onYearChange(): void {
    this.load();
  }

  progressPct(actual: number, budget: number): number {
    if (!budget || budget === 0) return actual > 0 ? 100 : 0;
    return Math.min((actual / budget) * 100, 150);
  }

  progressClass(pct: number, isIncome: boolean): string {
    if (isIncome) return pct >= 90 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-danger';
    return pct <= 90 ? 'bg-success' : pct <= 110 ? 'bg-warning' : 'bg-danger';
  }

  fmt(val: number): string {
    if (val === null || val === undefined) return 'R 0';
    const abs = Math.abs(val);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return (val < 0 ? '-' : '') + 'R ' + formatted;
  }

  fmtPct(val: number): string {
    if (val === null || val === undefined || val === 0) return '0%';
    return (val > 0 ? '+' : '') + (+val).toFixed(1) + '%';
  }

  variancePct(actual: number, budget: number): number {
    if (!budget || budget === 0) return 0;
    return ((actual - budget) / budget) * 100;
  }
}
