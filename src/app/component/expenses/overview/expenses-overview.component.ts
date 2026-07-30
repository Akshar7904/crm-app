// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExpensesService } from '../services/expenses.service';
import { NotificationService } from '../../../service/notification.service';
import Chart from 'chart.js/auto';

@Component({
  standalone: false,
  selector: 'app-expenses-overview',
  templateUrl: './expenses-overview.component.html',
  styleUrls: ['./expenses-overview.component.scss']
})
export class ExpensesOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  selectedYear = this.currentYear;
  selectedMonth = this.currentMonth;

  summary: any = null;
  profitLoss: any = null;
  loading = false;
  loadingPL = false;

  years = Array.from({ length: 5 }, (_, i) => this.currentYear - i);
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  private trendChart: Chart | null = null;
  private donutChart: Chart | null = null;

  constructor(
    private expensesService: ExpensesService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadTrendChart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.trendChart?.destroy();
    this.donutChart?.destroy();
  }

  loadData(): void {
    this.loading = true;
    this.expensesService.getSummary(this.selectedYear, this.selectedMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.summary = res.data.summary;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.notification.onError('Failed to load financial summary');
        }
      });

    this.loadingPL = true;
    this.expensesService.getIncomeStatement(this.selectedYear, this.selectedMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.profitLoss = res.data.profitLoss;
          this.loadingPL = false;
          setTimeout(() => this.buildDonutChart(), 100);
        },
        error: () => {
          this.loadingPL = false;
        }
      });
  }

  onPeriodChange(): void {
    this.loadData();
    this.loadTrendChart();
  }

  loadTrendChart(): void {
    this.expensesService.getMonthlyTrend(this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const trend = res.data.trend;
          setTimeout(() => this.buildTrendChart(trend), 100);
        }
      });
  }

  private buildTrendChart(trend: any[]): void {
    this.trendChart?.destroy();
    const ctx = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trend.map(t => t.monthName),
        datasets: [
          {
            label: 'Income',
            data: trend.map(t => t.income),
            borderColor: '#2cbe4e',
            backgroundColor: 'rgba(44,190,78,0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Expenses',
            data: trend.map(t => t.expenses),
            borderColor: '#e25563',
            backgroundColor: 'rgba(226,85,99,0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private buildDonutChart(): void {
    this.donutChart?.destroy();
    if (!this.profitLoss?.operatingExpenseLines) return;
    const ctx = document.getElementById('expenseDonut') as HTMLCanvasElement;
    if (!ctx) return;

    const lines = this.profitLoss.operatingExpenseLines.filter((l: any) => !l.bold && l.amount > 0);
    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: lines.map((l: any) => l.label),
        datasets: [{
          data: lines.map((l: any) => l.amount),
          backgroundColor: ['#375fa0','#2cbe4e','#e25563','#f7b731','#45aaf2','#a55eea','#fd9644','#26de81','#fc5c65']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'right' } } }
    });
  }

  isProfit(): boolean {
    return this.summary?.netProfit >= 0;
  }

  formatCurrency(val: number): string {
    return `R ${(val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  }
}
