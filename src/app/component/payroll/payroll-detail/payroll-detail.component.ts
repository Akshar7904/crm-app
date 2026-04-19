// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PayrollService } from 'src/app/service/payroll.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { UserService } from 'src/app/service/user.service';
import { CompanyService } from 'src/app/service/company.service';
import { Payroll } from 'src/app/interface/payroll';
import { Employee } from "../../employee/employee.model";

@Component({
  standalone: false,
  selector: 'app-payroll-detail',
  templateUrl: './payroll-detail.component.html',
  styleUrls: ['./payroll-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollDetailComponent implements OnInit {

  private readonly server = environment.apiUrl + '/api/v1';

  payroll: Payroll | null = null;
  employee: Employee | null = null;
  company: any = null;
  isLoading = true;
  error: string | null = null;
  isAdmin = false;
  currentUserId: number | null = null;

  constructor(
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private userService: UserService,
    public companyService: CompanyService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    if (id) {
      this.checkUserRoleAndLoadPayroll(id);
    }
    this.companyService.getMyCompany$().subscribe({
      next: (res) => { this.company = res?.data?.company; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  /**
   * Check if user has admin role to determine which endpoint to use
   */
  private checkUserRoleAndLoadPayroll(payrollId: number): void {
    this.userService.profile$().subscribe({
      next: (response) => {
        const user = response?.data?.user;
        this.currentUserId = user?.id || null;
        this.isAdmin = ['ROLE_SYSADMIN', 'ROLE_ADMIN', 'SYSADMIN', 'ADMIN'].includes(user?.roleName);
        this.loadPayroll(payrollId);
      },
      error: () => {
        // If profile fails, try self-service endpoint (safest option)
        this.isAdmin = false;
        this.loadPayroll(payrollId);
      }
    });
  }

  loadPayroll(id: number): void {
    // Use self-service endpoint for regular employees, admin endpoint for admins
    const payrollRequest$ = this.isAdmin
      ? this.payrollService.getPayroll(id)
      : this.payrollService.getMyPayroll(id);

    payrollRequest$.subscribe({
      next: response => {
        this.payroll = response.data.payroll;
        if (this.payroll?.employeeId) {
          this.loadEmployee(this.payroll.employeeId);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        // If admin endpoint fails, try self-service as fallback
        if (this.isAdmin && err.status === 500) {
          console.log('Admin endpoint failed, trying self-service...');
          this.payrollService.getMyPayroll(id).subscribe({
            next: response => {
              this.payroll = response.data.payroll;
              if (this.payroll?.employeeId) {
                this.loadEmployee(this.payroll.employeeId);
              }
              this.isLoading = false;
              this.cdr.markForCheck();
            },
            error: fallbackErr => {
              this.error = fallbackErr.error?.reason || fallbackErr.error?.message || 'Failed to load payroll';
              this.isLoading = false;
              this.cdr.markForCheck();
            }
          });
        } else {
          this.error = err.error?.reason || err.error?.message || 'Failed to load payroll';
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      }
    });
  }

  loadEmployee(employeeId: number): void {
    this.employeeService.employee$(employeeId).subscribe({
      next: response => {
        this.employee = response.data.employee;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Failed to load employee:', err);
      }
    });
  }

  back(): void {
    this.location.back();
  }

  edit(): void {
    this.router.navigate(['/payroll/edit', this.payroll?.id]);
  }

  print(): void {
    window.print();
  }

  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA');
  }

  formatDateTime(dateTime: string): string {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  downloadPayslip(payrollId?: number): void {
    const id = payrollId || this.payroll?.id;
    if (!id) return;

    // window.open() bypasses the Angular interceptor (no Auth header → 401).
    // Use HttpClient so the TokenInterceptor adds the Bearer token.
    const endpoint = this.isAdmin
      ? `${this.server}/payroll/payslip/download/${id}`
      : `${this.server}/payroll/my-payslip/download/${id}`;

    this.http.get(endpoint, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const period = this.payroll?.payPeriodEnd
          ? new Date(this.payroll.payPeriodEnd).toISOString().slice(0, 7)
          : id;
        a.download = `Payslip_${period}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Failed to download payslip:', err)
    });
  }

  initiatePayment(): void {
    if (!confirm(`Pay ${this.formatCurrency(this.payroll.netSalary)} via PayFast? A new window will open.`)) {
      return;
    }

    this.payrollService.initiatePayment(this.payroll.id).subscribe({
      next: response => {
        const { paymentUrl, formData } = response.data;

        // Create hidden form and submit to PayFast in new window
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentUrl;
        form.target = '_blank';

        for (const [key, value] of Object.entries(formData)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        // Reload after delay to check for ITN status update
        setTimeout(() => this.loadPayroll(this.payroll.id), 5000);
      },
      error: err => {
        alert(`Payment failed: ${err.error?.message || err.message}`);
      }
    });
  }

  checkPaymentStatus(): void {
    this.payrollService.checkPaymentStatus(this.payroll.id).subscribe({
      next: response => {
        alert(`Payment status: ${response.data.status}`);
        this.loadPayroll(this.payroll.id);
      },
      error: err => {
        alert(`Failed to check status: ${err.error?.message || err.message}`);
      }
    });
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'PROCESSING': return 'bg-info';
      case 'SUCCESS': return 'bg-success';
      case 'FAILED': return 'bg-danger';
      case 'REVERSED': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'bg-secondary';
      case 'PROCESSED': return 'bg-info';
      case 'PAID': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  // Helper methods for payslip display
  formatAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '0.00';
    }
    return amount.toFixed(2);
  }

  getPayPeriod(): string {
    if (!this.payroll?.payPeriodEnd) return 'N/A';
    const date = new Date(this.payroll.payPeriodEnd);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  get isIntern(): boolean {
    return this.employee?.employmentType?.toUpperCase() === 'INTERN';
  }

  maskAccountNumber(accountNumber: string | null | undefined): string {
    if (!accountNumber || accountNumber.length < 4) {
      return '****';
    }
    const length = accountNumber.length;
    return '*'.repeat(length - 4) + accountNumber.substring(length - 4);
  }
}
