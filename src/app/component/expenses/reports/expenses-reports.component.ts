// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExpensesService } from '../services/expenses.service';
import { NotificationService } from '../../../service/notification.service';
import Chart from 'chart.js/auto';

@Component({
  standalone: false,
  selector: 'app-expenses-reports',
  templateUrl: './expenses-reports.component.html',
  styleUrls: ['./expenses-reports.component.scss']
})
export class ExpensesReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private barChart: Chart | null = null;

  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  selectedStartMonth = 1;
  selectedEndMonth = new Date().getMonth() + 1;

  years = Array.from({ length: 5 }, (_, i) => this.currentYear - i);
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  loading = false;
  exporting = false;

  constructor(
    private expensesService: ExpensesService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadTrendChart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.barChart?.destroy();
  }

  loadTrendChart(): void {
    this.loading = true;
    this.expensesService.getMonthlyTrend(this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          const trend = res.data.trend;
          setTimeout(() => this.buildBarChart(trend), 100);
        },
        error: () => { this.loading = false; }
      });
  }

  private buildBarChart(trend: any[]): void {
    this.barChart?.destroy();
    // Retry up to 5 times in case Angular hasn't rendered the canvas yet
    let attempts = 0;
    const tryBuild = () => {
      const ctx = document.getElementById('yearBarChart') as HTMLCanvasElement;
      if (!ctx) {
        if (++attempts < 5) setTimeout(tryBuild, 80);
        return;
      }
      this.buildChartOnCanvas(ctx, trend);
    };
    tryBuild();
  }

  private buildChartOnCanvas(ctx: HTMLCanvasElement, trend: any[]): void {

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: trend.map(t => t.monthName),
        datasets: [
          {
            label: 'Income',
            data: trend.map(t => t.income),
            backgroundColor: 'rgba(44,190,78,0.7)'
          },
          {
            label: 'Expenses',
            data: trend.map(t => t.expenses),
            backgroundColor: 'rgba(226,85,99,0.7)'
          },
          {
            label: 'Net Profit',
            data: trend.map(t => t.netProfit),
            backgroundColor: 'rgba(55,95,160,0.7)'
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

  exportExcel(): void {
    this.exporting = true;
    this.expensesService.downloadIncomeStatement(
      this.selectedYear, this.selectedStartMonth, this.selectedEndMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          this.exporting = false;
          // If the server returned an error body (JSON) instead of xlsx, surface it
          if (blob.type === 'application/json' || blob.type === 'text/plain') {
            blob.text().then(text => {
              try {
                const err = JSON.parse(text);
                this.notification.onError(err.message || 'Failed to generate report');
              } catch {
                this.notification.onError(text || 'Failed to generate report');
              }
            });
            return;
          }
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `income-statement-${this.selectedYear}-${this.selectedStartMonth}-${this.selectedEndMonth}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.onSuccess('Report downloaded successfully');
        },
        error: (err) => {
          this.exporting = false;
          // err.error is a Blob when responseType is 'blob'
          if (err.error instanceof Blob) {
            err.error.text().then((text: string) => {
              try {
                const parsed = JSON.parse(text);
                this.notification.onError(parsed.message || 'Failed to download report');
              } catch {
                this.notification.onError('Failed to download report');
              }
            });
          } else {
            this.notification.onError(err?.error?.message || 'Failed to download report');
          }
        }
      });
  }

  onYearChange(): void {
    this.loadTrendChart();
  }
}
