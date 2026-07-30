// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { VatReturnService } from '../services/vat-return.service';
import { NotificationService } from '../../../service/notification.service';
import { VatReturn, VatCalculation, VatStats, VatReturnStatus } from '../models/vat-return.model';

@Component({
  standalone: false,
  selector: 'app-vat-returns',
  templateUrl: './vat-returns.component.html',
  styleUrls: ['./vat-returns.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VatReturnsComponent implements OnInit {

  returns: VatReturn[] = [];
  stats: VatStats = { total: 0, draft: 0, filed: 0, paid: 0, overdue: 0 };
  loading = false;
  submitting = false;

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 20;
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }

  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  calculation: VatCalculation | null = null;
  calculating = false;
  showCalculator = false;
  showViewModal = false;
  viewingReturn: VatReturn | null = null;

  readonly months = [
    { value: 1, label: 'January' },  { value: 2, label: 'February' },
    { value: 3, label: 'March' },    { value: 4, label: 'April' },
    { value: 5, label: 'May' },      { value: 6, label: 'June' },
    { value: 7, label: 'July' },     { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  readonly years: number[] = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(
    private vatReturnService: VatReturnService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReturns();
  }

  loadReturns(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.vatReturnService.list$(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        const page = res.data?.page;
        this.returns = page?.content ?? [];
        this.totalPages = page?.totalPages ?? 0;
        this.totalElements = page?.totalElements ?? 0;
        this.stats = res.data?.stats ?? this.stats;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  calculate(): void {
    this.calculating = true;
    this.calculation = null;
    this.cdr.markForCheck();
    this.vatReturnService.calculate$(this.selectedYear, this.selectedMonth).subscribe({
      next: (res: any) => {
        this.calculation = res.data?.calculation ?? null;
        this.calculating = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.calculating = false;
        this.cdr.markForCheck();
      }
    });
  }

  saveReturn(): void {
    if (!this.calculation || this.submitting) return;
    this.submitting = true;
    this.cdr.markForCheck();

    const payload = {
      periodYear: this.calculation.year,
      periodMonth: this.calculation.month,
      outputVat: this.calculation.outputVat,
      inputVatBills: this.calculation.inputVatBills,
      inputVatExpenses: this.calculation.inputVatExpenses,
      totalInputVat: this.calculation.totalInputVat,
      netVatPayable: this.calculation.netVatPayable,
      totalSalesExclVat: this.calculation.totalSalesExclVat,
      totalPurchasesExclVat: this.calculation.totalPurchasesExclVat
    };

    this.vatReturnService.save$(payload).subscribe({
      next: () => {
        this.notification.onSuccess(`VAT return for ${this.calculation?.periodLabel} saved`);
        this.submitting = false;
        this.showCalculator = false;
        this.calculation = null;
        this.loadReturns();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  fileReturn(vr: VatReturn): void {
    if (!vr.id || this.submitting) return;
    if (!confirm(`File VAT return ${vr.returnReference} with SARS? This cannot be undone.`)) return;
    this.submitting = true;
    this.cdr.markForCheck();
    this.vatReturnService.file$(vr.id).subscribe({
      next: () => {
        this.notification.onSuccess(`${vr.returnReference} filed with SARS`);
        this.submitting = false;
        this.loadReturns();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  markPaid(vr: VatReturn): void {
    if (!vr.id || this.submitting) return;
    this.submitting = true;
    this.cdr.markForCheck();
    this.vatReturnService.markPaid$(vr.id).subscribe({
      next: () => {
        this.notification.onSuccess(`${vr.returnReference} marked as paid`);
        this.submitting = false;
        this.loadReturns();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteReturn(vr: VatReturn): void {
    if (!vr.id || !confirm(`Delete draft VAT return ${vr.returnReference}?`)) return;
    this.vatReturnService.delete$(vr.id).subscribe({
      next: () => {
        this.notification.onSuccess('VAT return deleted');
        this.loadReturns();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadReturns();
  }

  viewReturn(vr: VatReturn): void {
    this.viewingReturn = vr;
    this.showViewModal = true;
    this.cdr.markForCheck();
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewingReturn = null;
    this.cdr.markForCheck();
  }

  getMonthLabel(month: number | undefined): string {
    return this.months.find(m => m.value === month)?.label ?? String(month ?? '');
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'R 0.00';
    return 'R ' + Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  isPayable(amount: number | undefined): boolean {
    return (amount ?? 0) > 0;
  }

  isRefund(amount: number | undefined): boolean {
    return (amount ?? 0) < 0;
  }

  absAmount(amount: number | undefined): number {
    return Math.abs(amount ?? 0);
  }

  getStatusClass(status: VatReturnStatus | undefined): string {
    const map: Record<VatReturnStatus, string> = {
      DRAFT:   'badge-soft-secondary',
      FILED:   'badge-soft-primary',
      PAID:    'badge-soft-success',
      OVERDUE: 'badge-soft-danger'
    };
    return status ? (map[status] ?? 'badge-soft-secondary') : 'badge-soft-secondary';
  }

  getStatusLabel(status: VatReturnStatus | undefined): string {
    const map: Record<VatReturnStatus, string> = {
      DRAFT: 'Draft', FILED: 'Filed', PAID: 'Paid', OVERDUE: 'Overdue'
    };
    return status ? (map[status] ?? status) : '—';
  }
}
