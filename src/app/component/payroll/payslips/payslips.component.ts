// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PayrollService } from 'src/app/service/payroll.service';
import { Payroll } from 'src/app/interface/payroll';

@Component({
  standalone: false,
  selector: 'app-payslips',
  templateUrl: './payslips.component.html',
  styleUrls: ['./payslips.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayslipsComponent implements OnInit {
  private readonly server = environment.apiUrl + '/api/v1';

  // ── Payslips table ─────────────────────────────────────────────────────────
  payrolls: Payroll[] = [];
  isLoading = true;
  selectedStatus = '';

  // ── Email trigger state ────────────────────────────────────────────────────
  triggerYear: number  = new Date().getFullYear();
  triggerMonth: number = new Date().getMonth() + 1;

  /** Eligible (PROCESSED/PAID) payrolls for the selected period */
  periodPayrolls: Payroll[] = [];
  isLoadingPeriod = false;
  periodLoaded = false;

  /** Set of payroll IDs the admin has ticked */
  selectedIds = new Set<number>();

  isSending = false;
  triggerMessage: string | null = null;
  triggerSuccess = false;

  readonly months = [
    { value: 1,  label: 'January'   }, { value: 2,  label: 'February'  },
    { value: 3,  label: 'March'     }, { value: 4,  label: 'April'     },
    { value: 5,  label: 'May'       }, { value: 6,  label: 'June'      },
    { value: 7,  label: 'July'      }, { value: 8,  label: 'August'    },
    { value: 9,  label: 'September' }, { value: 10, label: 'October'   },
    { value: 11, label: 'November'  }, { value: 12, label: 'December'  }
  ];

  constructor(
    private payrollService: PayrollService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPayrolls();
  }

  // ── Payslips table ─────────────────────────────────────────────────────────

  loadPayrolls(): void {
    this.isLoading = true;
    const request$ = this.selectedStatus
      ? this.payrollService.getPayrollsByStatus(this.selectedStatus)
      : this.payrollService.getPayrolls(0, 100);

    request$.subscribe({
      next: response => {
        const data = response?.data as any;
        if (data?.content)        this.payrolls = data.content;
        else if (data?.payrolls)  this.payrolls = data.payrolls;
        else if (Array.isArray(data)) this.payrolls = data;
        else                      this.payrolls = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  onStatusChange(): void { this.loadPayrolls(); }

  // ── Period employee loader ─────────────────────────────────────────────────

  /** Called when month or year changes — resets the loaded list */
  onPeriodChange(): void {
    this.periodPayrolls = [];
    this.selectedIds.clear();
    this.periodLoaded = false;
    this.triggerMessage = null;
  }

  loadPeriodPayrolls(): void {
    this.isLoadingPeriod = true;
    this.triggerMessage  = null;
    this.selectedIds.clear();

    const start = `${this.triggerYear}-${String(this.triggerMonth).padStart(2, '0')}-01`;
    const end   = this.lastDay(this.triggerYear, this.triggerMonth);

    this.payrollService.getPayrollsByPeriod(start, end).subscribe({
      next: response => {
        const all: Payroll[] = (response as any)?.data?.payrolls ?? [];
        // Only PROCESSED or PAID can receive emails
        this.periodPayrolls = all.filter(
          p => p.status === 'PROCESSED' || p.status === 'PAID'
        );
        // Pre-select all by default
        this.periodPayrolls.forEach(p => this.selectedIds.add(p.id!));
        this.periodLoaded     = true;
        this.isLoadingPeriod  = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingPeriod = false;
        this.periodLoaded    = true;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Selection helpers ──────────────────────────────────────────────────────

  toggle(payrollId: number): void {
    if (this.selectedIds.has(payrollId)) this.selectedIds.delete(payrollId);
    else                                  this.selectedIds.add(payrollId);
  }

  isSelected(payrollId: number): boolean { return this.selectedIds.has(payrollId); }

  selectAll():   void { this.periodPayrolls.forEach(p => this.selectedIds.add(p.id!));    this.cdr.markForCheck(); }
  deselectAll(): void { this.selectedIds.clear();                                          this.cdr.markForCheck(); }

  get allSelected():  boolean { return this.periodPayrolls.length > 0 && this.selectedIds.size === this.periodPayrolls.length; }
  get noneSelected(): boolean { return this.selectedIds.size === 0; }

  // ── Send ───────────────────────────────────────────────────────────────────

  sendToSelected(): void {
    if (this.noneSelected) return;
    this.isSending = true;
    this.triggerMessage = null;

    const ids = Array.from(this.selectedIds);
    this.payrollService.triggerPayslipEmailsForSelected(ids).subscribe({
      next: response => {
        this.triggerSuccess = true;
        this.triggerMessage = response.message ?? `${ids.length} payslip email(s) sent.`;
        this.isSending = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.triggerSuccess = false;
        this.triggerMessage = err?.error?.message ?? 'Failed to send. Check the server logs.';
        this.isSending = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Formatting helpers ─────────────────────────────────────────────────────

  formatCurrency(amount: number): string {
    if (amount == null) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA');
  }

  downloadPayslip(payrollId: number, employeeName: string): void {
    this.http.get(`${this.server}/payroll/payslip/download/${payrollId}`, {
      responseType: 'blob'
    }).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `Payslip_${employeeName?.replace(/\s+/g, '_') || payrollId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: err => console.error('Failed to download payslip:', err)
    });
  }

  private lastDay(year: number, month: number): string {
    const d = new Date(year, month, 0); // day 0 of next month = last day of this month
    return `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  trackById = (index: number, item: any) => item.id;
  trackByValue = (index: number, value: any) => value;
}
