// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SuperadminService } from '../superadmin.service';
import { NotificationService } from '../../../service/notification.service';

interface ReportType {
  key: string;
  label: string;
  icon: string;
  iconClass: string;
  description: string;
  params: (year: number, month: number) => any;
}

@Component({
  standalone: false,
  selector: 'app-superadmin-reports',
  templateUrl: './superadmin-reports.component.html',
  styleUrls: ['./superadmin-reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminReportsComponent implements OnInit {
  companies: any[] = [];
  selectedCompany: any = null;
  loading = false;
  downloading: string | null = null;
  companyFilter = '';

  get filteredCompanies(): any[] {
    const q = this.companyFilter.trim().toLowerCase();
    return q ? this.companies.filter(c =>
      (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q)
    ) : this.companies;
  }

  selectedYear  = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;

  years  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  months = [
    { value: 1, label: 'January' }, { value: 2,  label: 'February' },
    { value: 3, label: 'March'   }, { value: 4,  label: 'April'    },
    { value: 5, label: 'May'     }, { value: 6,  label: 'June'     },
    { value: 7, label: 'July'    }, { value: 8,  label: 'August'   },
    { value: 9, label: 'September'}, { value: 10, label: 'October'  },
    { value: 11, label: 'November'}, { value: 12, label: 'December' }
  ];

  readonly reportTypes: ReportType[] = [
    {
      key: 'payroll',
      label: 'Payroll Summary',
      icon: 'bi-cash-stack',
      iconClass: 'rep-green',
      description: 'Monthly payroll register — gross salary, deductions, net pay per employee.',
      params: (y, m) => ({ year: y, month: m })
    },
    {
      key: 'financial',
      label: 'Financial Report (P&L)',
      icon: 'bi-bar-chart-line-fill',
      iconClass: 'rep-blue',
      description: 'Income statement — income, COGS, operating expenses, net profit/loss.',
      params: (y, m) => ({ year: y, startMonth: m, endMonth: m })
    },
    {
      key: 'leave',
      label: 'Leave Summary',
      icon: 'bi-calendar2-check-fill',
      iconClass: 'rep-orange',
      description: 'Leave applications, approvals, balances and utilisation by employee.',
      params: (y, _m) => ({ year: y })
    },
    {
      key: 'expense-claims',
      label: 'Expense Claims',
      icon: 'bi-receipt',
      iconClass: 'rep-purple',
      description: 'Employee expense claims — status, amounts, approvals.',
      params: (y, m) => ({ year: y, month: m })
    },
    {
      key: 'attendance',
      label: 'Attendance Report',
      icon: 'bi-person-check-fill',
      iconClass: 'rep-teal',
      description: 'Monthly attendance records — present, absent, late, overtime.',
      params: (y, m) => ({ year: y, month: m })
    },
    {
      key: 'combined',
      label: 'Combined Platform Report',
      icon: 'bi-file-earmark-zip-fill',
      iconClass: 'rep-dark',
      description: 'Full company overview — all modules combined into one spreadsheet.',
      params: (y, m) => ({ year: y, month: m })
    }
  ];

  constructor(
    private superadminService: SuperadminService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading = true;
    this.superadminService.getCompanies(0, 100).subscribe({
      next: res => {
        this.companies = res.data?.companies?.content ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  selectCompany(company: any): void {
    this.selectedCompany = company;
  }

  download(type: ReportType): void {
    if (!this.selectedCompany) {
      this.notification.onError('Please select a company first.');
      return;
    }
    this.downloading = type.key;
    const params = type.params(this.selectedYear, this.selectedMonth);
    this.superadminService.downloadCompanyReport(this.selectedCompany.id, type.key, params).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedCompany.code}-${type.key}-${this.selectedYear}-${String(this.selectedMonth).padStart(2,'0')}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloading = null;
        this.cdr.markForCheck();
        this.notification.onDefault(`${type.label} downloaded`);
      },
      error: () => {
        this.downloading = null;
        this.cdr.markForCheck();
        this.notification.onError('Report generation failed. The company may have no data for the selected period.');
      }
    });
  }

  downloadAll(): void {
    if (!this.selectedCompany) {
      this.notification.onError('Please select a company first.');
      return;
    }
    this.reportTypes.forEach(t => this.download(t));
  }

  trackById = (index: number, item: any) => item.id;
  trackByValue = (index: number, value: any) => value;
}
