// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { PayrollService } from '../../../service/payroll.service';
import { DataState } from '../../../enum/datastate.enum';
import { Payroll } from '../../../interface/payroll';
import { CustomHttpResponse, Page } from '../../../interface/appstates';
import { State } from '../../../interface/state';

@Component({
  standalone: false,
  selector: 'app-payroll-list',
  templateUrl: './payroll-list.component.html',
  styleUrls: ['./payroll-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollListComponent implements OnInit {

  payrollState$!: Observable<State<CustomHttpResponse<Page<Payroll>>>>;
  readonly DataState = DataState;

  currentPage = 0;
  pageSize = 10;
  selectedStatus = 'ALL';

  showDeleteModal = false;
  showStatusModal = false;
  selectedPayroll: Payroll | null = null;
  statusAction: 'approve' | 'paid' | 'cancel' = 'approve';
  isProcessingPayment: number | null = null;

  constructor(
    private payrollService: PayrollService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    console.log('💼 PayrollListComponent constructor called');
  }

  ngOnInit(): void {
    console.log('💼 PayrollListComponent ngOnInit called');
    this.loadPayrolls();
  }

  /** Load payrolls */
  loadPayrolls(page: number = 0): void {
    console.log(`💼 PayrollListComponent.loadPayrolls() - page: ${page}, status: ${this.selectedStatus}`);
    this.currentPage = page;

    let request$ = this.selectedStatus === 'ALL'
      ? this.payrollService.getPayrolls(page, this.pageSize)
      : this.payrollService.getPayrollsByStatus(this.selectedStatus);

    this.payrollState$ = request$.pipe(
      map((response) => {
        console.log('💼 PayrollListComponent received response:', response);
        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADING }),
      catchError(error => {
        console.error('💼 PayrollListComponent error:', error);
        return of({
          dataState: DataState.ERROR,
          error: error.error?.message || error.message || 'Failed to load payrolls'
        });
      })
    );

    this.cdr.markForCheck();
  }

  /** Filter by status */
  filterByStatus(status: string): void {
    console.log(`💼 PayrollListComponent.filterByStatus(${status})`);
    this.selectedStatus = status;
    this.loadPayrolls(0);
  }

  /** Pagination */
  onPageChange(page: number): void {
    console.log(`💼 PayrollListComponent.onPageChange(${page})`);
    if (page >= 0) {
      this.loadPayrolls(page);
    }
  }

  /** View payroll */
  viewPayroll(payroll: Payroll): void {
    console.log('💼 PayrollListComponent.viewPayroll():', payroll);
    this.router.navigate(['/payroll/detail', payroll.id]);
  }

  /** Edit payroll */
  editPayroll(payroll: Payroll): void {
    console.log('💼 PayrollListComponent.editPayroll():', payroll);
    this.router.navigate(['/payroll/edit', payroll.id]);
  }

  /** Status modal actions */
  openStatusModal(payroll: Payroll, action: 'approve' | 'paid' | 'cancel'): void {
    console.log(`💼 PayrollListComponent.openStatusModal() - action: ${action}`, payroll);
    this.selectedPayroll = payroll;
    this.statusAction = action;
    this.showStatusModal = true;
    this.cdr.markForCheck();
  }

  closeStatusModal(): void {
    console.log('💼 PayrollListComponent.closeStatusModal()');
    this.showStatusModal = false;
    this.selectedPayroll = null;
    this.cdr.markForCheck();
  }

  confirmStatusChange(): void {
    console.log(`💼 PayrollListComponent.confirmStatusChange() - action: ${this.statusAction}`);
    if (!this.selectedPayroll?.id) return;

    let request$;
    switch (this.statusAction) {
      case 'approve':
        request$ = this.payrollService.approvePayroll(this.selectedPayroll.id);
        break;
      case 'paid':
        request$ = this.payrollService.markAsPaid(this.selectedPayroll.id);
        break;
      case 'cancel':
        request$ = this.payrollService.cancelPayroll(this.selectedPayroll.id);
        break;
    }

    request$?.subscribe({
      next: (response) => {
        console.log('💼 Status change successful:', response);
        this.closeStatusModal();
        this.loadPayrolls(this.currentPage);
      },
      error: err => {
        console.error('💼 Status update error:', err);
        alert(`Failed to update payroll status: ${err.error?.message || err.message}`);
      }
    });
  }

  /** Payment actions */
  initiatePayment(payrollId: number): void {
    if (!confirm('Pay this employee via PayFast? A new window will open.')) {
      return;
    }

    this.isProcessingPayment = payrollId;
    this.cdr.markForCheck();

    this.payrollService.initiatePayment(payrollId).subscribe({
      next: response => {
        const { paymentUrl, formData } = response.data;

        // Create a hidden form and submit it to PayFast in a new window
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

        this.isProcessingPayment = null;
        this.cdr.markForCheck();

        // Reload payrolls after a delay to check for ITN status update
        setTimeout(() => this.loadPayrolls(this.currentPage), 5000);
      },
      error: err => {
        this.isProcessingPayment = null;
        alert(`Payment failed: ${err.error?.message || err.message}`);
        this.cdr.markForCheck();
      }
    });
  }

  checkPaymentStatus(payrollId: number): void {
    this.payrollService.checkPaymentStatus(payrollId).subscribe({
      next: response => {
        alert(`Payment status: ${response.data.status}`);
        this.loadPayrolls(this.currentPage);
      },
      error: err => {
        alert(`Failed to check status: ${err.error?.message || err.message}`);
      }
    });
  }

  /** Download payslip */
  downloadPayslip(payrollId: number): void {
    console.log('💼 Downloading payslip for payroll:', payrollId);

    this.payrollService.downloadPayslip$(payrollId).subscribe({
      next: (event: HttpEvent<Blob>) => {
        if (event.type === HttpEventType.Response && event.body) {
          const fileName = event.headers?.get('File-Name') || `payslip-${payrollId}.pdf`;
          const contentType = event.headers?.get('Content-Type') || 'application/pdf';

          saveAs(new File([event.body], fileName, { type: contentType }));
          console.log('💼 Payslip downloaded successfully');
        }
      },
      error: err => {
        console.error('💼 Error downloading payslip:', err);
        alert(`Failed to download payslip: ${err.error?.message || err.message}`);
      }
    });
  }

  /** Check if employee has bank details for payment */
  hasBankDetails(payroll: Payroll): boolean {
    // This would check if the employee has bank details set up
    // You might need to extend the Payroll interface or make an additional check
    return payroll.paymentMethod === 'BANK_TRANSFER';
  }

  /** Helper methods for safe data access */
  getPayrolls(state: State<CustomHttpResponse<Page<Payroll>>>): Payroll[] {
    const data: any = state.appData?.data;
    return data?.content || data?.payrolls || [];
  }

  getTotalPages(state: State<CustomHttpResponse<Page<Payroll>>>): number {
    return state.appData?.data?.totalPages || 0;
  }

  getTotalElements(state: State<CustomHttpResponse<Page<Payroll>>>): number {
    return state.appData?.data?.totalElements || 0;
  }

  /** Helpers for template */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'badge-soft-draft';
      case 'PROCESSED': return 'badge-soft-processed';
      case 'PAID': return 'badge-soft-paid';
      case 'CANCELLED': return 'badge-soft-cancelled';
      case 'APPROVED': return 'badge-soft-approved';
      default: return 'badge-soft-draft';
    }
  }

  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA');
  }

  /** Recalculate payroll */
  recalculate(payrollId: number): void {
    console.log(`💼 PayrollListComponent.recalculate(${payrollId})`);
    if (!confirm('Recalculate this payroll?')) {
      return;
    }

    this.payrollService.recalculatePayroll(payrollId).subscribe({
      next: (response) => {
        console.log('💼 Recalculation successful:', response);
        this.loadPayrolls(this.currentPage);
      },
      error: err => {
        console.error('💼 Recalculation error:', err);
        alert(`Failed to recalculate payroll: ${err.error?.message || err.message}`);
      }
    });
  }

  /** Delete payroll */
  openDeleteModal(payroll: Payroll): void {
    console.log('💼 PayrollListComponent.openDeleteModal()', payroll);
    this.selectedPayroll = payroll;
    this.showDeleteModal = true;
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void {
    console.log('💼 PayrollListComponent.closeDeleteModal()');
    this.showDeleteModal = false;
    this.selectedPayroll = null;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    console.log('💼 PayrollListComponent.confirmDelete()');
    if (!this.selectedPayroll?.id) return;

    this.payrollService.deletePayroll(this.selectedPayroll.id).subscribe({
      next: (response) => {
        console.log('💼 Delete successful:', response);
        this.closeDeleteModal();
        this.loadPayrolls(this.currentPage);
      },
      error: err => {
        console.error('💼 Delete error:', err);
        alert(`Failed to delete payroll: ${err.error?.message || err.message}`);
        this.closeDeleteModal();
      }
    });
  }
}
