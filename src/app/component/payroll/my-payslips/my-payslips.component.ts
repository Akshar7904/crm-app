// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PayrollService } from 'src/app/service/payroll.service';
import { Payroll } from 'src/app/interface/payroll';
import { CustomHttpResponse } from 'src/app/interface/appstates';
import { UserModel } from '../../profile/user.model';

@Component({
  standalone: false,
  selector: 'app-my-payslips',
  templateUrl: './my-payslips.component.html',
  styleUrls: ['./my-payslips.component.scss']
})
export class MyPayslipsComponent implements OnInit {
  private readonly server = environment.apiUrl + '/api/v1';

  payrolls: Payroll[] = [];
  isLoading = true;
  currentUser: UserModel | null = null;

  constructor(
    private payrollService: PayrollService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPayrolls();
  }

  /**
   * Load current user's payrolls using self-service endpoint
   * ✅ Uses /api/v1/payroll/my-payrolls - no special permissions needed
   */
  loadPayrolls(): void {
    this.isLoading = true;

    // Use the new self-service endpoint - employees can access their own payrolls
    this.payrollService.getMyPayrolls().subscribe({
      next: response => {
        this.payrolls = response.data?.payrolls || [];
        this.isLoading = false;
        console.log('✅ My payrolls loaded:', this.payrolls.length, 'records');
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('❌ Error loading my payrolls:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA');
  }

  formatAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '0.00';
    }
    return amount.toFixed(2);
  }

  getPayPeriod(payroll: Payroll): string {
    if (!payroll?.payPeriodEnd) return 'N/A';
    const date = new Date(payroll.payPeriodEnd);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID': return 'badge-soft-paid';
      case 'PROCESSED': return 'badge-soft-processed';
      case 'DRAFT': return 'badge-soft-draft';
      case 'CANCELLED': return 'badge-soft-cancelled';
      default: return 'badge-soft-draft';
    }
  }

  downloadPayslip(payrollId: number): void {
    this.http.get(`${this.server}/payroll/my-payslip/download/${payrollId}`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payslip_${payrollId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Failed to download payslip:', err);
      }
    });
  }
}
