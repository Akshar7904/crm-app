// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChildren, QueryList, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { SuperadminService } from '../superadmin.service';

Chart.register(...registerables);

@Component({
  standalone: false,
  selector: 'app-superadmin-analytics',
  templateUrl: './superadmin-analytics.component.html',
  styleUrls: ['./superadmin-analytics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChildren('chartCanvas') chartCanvases!: QueryList<ElementRef>;

  stats: any = null;
  perCompany: any[] = [];
  loading = true;
  year  = new Date().getFullYear();
  month = 0; // 0 = full year

  private charts: Chart[] = [];
  private viewReady = false;
  private dataReady = false;

  readonly YEARS  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  readonly MONTHS = [
    { v: 0, l: 'Full Year' },
    { v: 1, l: 'January' }, { v: 2, l: 'February' }, { v: 3, l: 'March' },
    { v: 4, l: 'April'   }, { v: 5, l: 'May'      }, { v: 6, l: 'June'  },
    { v: 7, l: 'July'    }, { v: 8, l: 'August'   }, { v: 9, l: 'September' },
    { v: 10, l: 'October' }, { v: 11, l: 'November' }, { v: 12, l: 'December' }
  ];

  // Chart palettes per company
  readonly PALETTE = [
    { border: '#2c7be5', bg: 'rgba(44,123,229,.18)' },
    { border: '#00d97e', bg: 'rgba(0,217,126,.18)'  },
    { border: '#f6c343', bg: 'rgba(246,195,67,.18)' },
    { border: '#e63757', bg: 'rgba(230,55,87,.18)'  },
    { border: '#7b5ea7', bg: 'rgba(123,94,167,.18)' },
    { border: '#20c997', bg: 'rgba(32,201,151,.18)' }
  ];

  constructor(
    private superadminService: SuperadminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void  { this.loadData(); }
  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryBuild();
  }

  loadData(): void {
    this.loading = true;
    this.dataReady = false;
    this.superadminService.getStats().subscribe({
      next: res => { this.stats = res.data; this.cdr.markForCheck(); this.tryBuild(); },
      error: () => {}
    });
    this.superadminService.getPerCompanyAnalytics(this.year, this.month).subscribe({
      next: res => {
        this.perCompany = res.data?.companies ?? [];
        this.loading = false;
        this.dataReady = true;
        this.cdr.markForCheck();
        this.tryBuild();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  refresh(): void { this.loadData(); }

  private tryBuild(): void {
    if (!this.viewReady || !this.dataReady || !this.perCompany.length) return;
    // Destroy existing
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    // Small delay to let DOM stabilize after *ngFor renders
    setTimeout(() => this.buildAllCharts(), 50);
  }

  private buildAllCharts(): void {
    const canvases = this.chartCanvases.toArray();
    if (!canvases.length) return;

    // Chart 0: Employees per company (bar)
    if (canvases[0]) this.charts.push(new Chart(canvases[0].nativeElement, this.employeesBarCfg()));
    // Chart 1: Active vs Inactive clients (grouped bar)
    if (canvases[1]) this.charts.push(new Chart(canvases[1].nativeElement, this.clientsGroupedBarCfg()));
    // Chart 2: Invoice status distribution pie (stacked across companies)
    if (canvases[2]) this.charts.push(new Chart(canvases[2].nativeElement, this.invoiceStatusPieCfg()));
    // Chart 3: Finance overview per company (horizontal bar)
    if (canvases[3]) this.charts.push(new Chart(canvases[3].nativeElement, this.financeBarCfg()));
    // Chart 4: Attendance present vs absent (donut per company stacked)
    if (canvases[4]) this.charts.push(new Chart(canvases[4].nativeElement, this.attendanceCfg()));
    // Chart 5: Net profit per company (bar — positive=green / negative=red)
    if (canvases[5]) this.charts.push(new Chart(canvases[5].nativeElement, this.netProfitCfg()));
  }

  private labels(): string[] { return this.perCompany.map(c => c.companyName || c.companyCode); }

  private employeesBarCfg(): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: this.labels(),
        datasets: [{
          label: 'Employees',
          data: this.perCompany.map(c => c.employeeCount ?? 0),
          backgroundColor: this.PALETTE.map(p => p.bg),
          borderColor:     this.PALETTE.map(p => p.border),
          borderWidth: 2, borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false },
          title: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
      }
    };
  }

  private clientsGroupedBarCfg(): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: this.labels(),
        datasets: [
          {
            label: 'Active Clients',
            data: this.perCompany.map(c => c.activeClients ?? 0),
            backgroundColor: 'rgba(0,217,126,.7)',
            borderColor: '#00d97e', borderWidth: 1.5, borderRadius: 6
          },
          {
            label: 'Inactive Clients',
            data: this.perCompany.map(c => c.inactiveClients ?? 0),
            backgroundColor: 'rgba(230,55,87,.6)',
            borderColor: '#e63757', borderWidth: 1.5, borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, stacked: false }, x: { grid: { display: false } } }
      }
    };
  }

  private invoiceStatusPieCfg(): ChartConfiguration {
    // Aggregate all companies
    const totals: Record<string, number> = { Paid: 0, Sent: 0, Draft: 0, Overdue: 0, Partial: 0, Cancelled: 0 };
    this.perCompany.forEach(c => {
      totals['Paid']      += c.invoices?.paid      ?? 0;
      totals['Sent']      += c.invoices?.sent      ?? 0;
      totals['Draft']     += c.invoices?.draft     ?? 0;
      totals['Overdue']   += c.invoices?.overdue   ?? 0;
      totals['Partial']   += c.invoices?.partial   ?? 0;
      totals['Cancelled'] += c.invoices?.cancelled ?? 0;
    });
    return {
      type: 'pie',
      data: {
        labels: Object.keys(totals),
        datasets: [{
          data: Object.values(totals),
          backgroundColor: ['#00d97e','#2c7be5','#6c757d','#e63757','#f6c343','#adb5bd'],
          borderWidth: 2
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    };
  }

  private financeBarCfg(): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: this.labels(),
        datasets: [
          {
            label: 'Invoice Income (R)',
            data: this.perCompany.map(c => c.finance?.invoiceIncome ?? 0),
            backgroundColor: 'rgba(44,123,229,.75)',
            borderColor: '#2c7be5', borderWidth: 1.5, borderRadius: 6
          },
          {
            label: 'Payroll Cost (R)',
            data: this.perCompany.map(c => c.finance?.payrollCost ?? 0),
            backgroundColor: 'rgba(246,195,67,.75)',
            borderColor: '#f6c343', borderWidth: 1.5, borderRadius: 6
          },
          {
            label: 'Expenses (R)',
            data: this.perCompany.map(c => c.finance?.expenses ?? 0),
            backgroundColor: 'rgba(230,55,87,.6)',
            borderColor: '#e63757', borderWidth: 1.5, borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v: any) => 'R ' + Number(v).toLocaleString() }
          },
          x: { grid: { display: false } }
        }
      }
    };
  }

  private attendanceCfg(): ChartConfiguration {
    return {
      type: 'doughnut',
      data: {
        labels: this.perCompany.map(c => c.companyCode),
        datasets: [
          {
            label: 'Present',
            data: this.perCompany.map(c => c.attendance?.present ?? 0),
            backgroundColor: this.PALETTE.map(p => p.border),
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const co = this.perCompany[ctx.dataIndex];
                const total = co?.attendance?.total ?? 1;
                const pct = total ? Math.round((ctx.parsed / total) * 100) : 0;
                return ` ${ctx.label}: ${ctx.parsed} present (${pct}%)`;
              }
            }
          }
        }
      }
    };
  }

  private netProfitCfg(): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: this.labels(),
        datasets: [{
          label: 'Net Profit / Loss (R)',
          data: this.perCompany.map(c => c.finance?.netProfit ?? 0),
          backgroundColor: this.perCompany.map(c =>
            (c.finance?.netProfit ?? 0) >= 0 ? 'rgba(0,217,126,.75)' : 'rgba(230,55,87,.65)'),
          borderColor: this.perCompany.map(c =>
            (c.finance?.netProfit ?? 0) >= 0 ? '#00d97e' : '#e63757'),
          borderWidth: 2, borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { callback: (v: any) => 'R ' + Number(v).toLocaleString() } },
          y: { grid: { display: false } }
        }
      }
    };
  }

  // Summary helpers for KPI figures
  get totalEmployees()    { return this.perCompany.reduce((s, c) => s + (c.employeeCount ?? 0), 0); }
  get totalActiveClients(){ return this.perCompany.reduce((s, c) => s + (c.activeClients ?? 0), 0); }
  get totalPaidInvoices() { return this.perCompany.reduce((s, c) => s + (c.invoices?.paid ?? 0), 0); }
  get totalNetProfit()    { return this.perCompany.reduce((s, c) => s + (c.finance?.netProfit ?? 0), 0); }

  currency(v: number): string {
    return 'R ' + (v ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }

  trackByIndex = (index: number) => index;
  trackByValue = (index: number, value: any) => value;
}
