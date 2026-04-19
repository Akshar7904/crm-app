// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillService } from '../services/bill.service';
import { Bill, BillStats, BillStatus } from '../models/bill.model';
import { NotificationService } from '../../../service/notification.service';
import { VendorService } from '../../expenses/services/vendor.service';
import { ChartOfAccountService } from '../../expenses/services/chart-of-account.service';
import { ExpenseClaimService } from '../../../service/expense-claim.service';
import { ExpenseClaim, ExpenseClaimStatus } from '../../../interface/expense-claim.model';
import { BankingService } from '../services/banking.service';
import { BankAccount } from '../models/banking.model';

@Component({
  standalone: false,
  selector: 'app-bill-list',
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillListComponent implements OnInit {

  bills: Bill[] = [];
  stats: BillStats = { total: 0, draft: 0, unpaid: 0, paid: 0, overdue: 0, outstanding: 0 };
  bankAccounts: BankAccount[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  loading = false;
  submitting = false;
  searchTerm = '';

  showModal = false;
  showPayModal = false;
  isEditMode = false;
  editingId: number | null = null;
  payingBill: Bill | null = null;
  showViewModal = false;
  viewingBill: Bill | null = null;

  // AP Tabs
  activeTab: 'bills' | 'claims' = 'bills';
  apClaims: ExpenseClaim[] = [];
  apClaimsLoading = false;

  billForm: FormGroup;
  payForm: FormGroup;

  vendors: any[] = [];
  accounts: any[] = [];

  readonly statuses: BillStatus[] = ['DRAFT', 'RECEIVED', 'DUE', 'PAID', 'OVERDUE'];
  readonly paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'CHEQUE', label: 'Cheque' }
  ];

  constructor(
    private billService: BillService,
    private vendorService: VendorService,
    private accountService: ChartOfAccountService,
    private expenseClaimService: ExpenseClaimService,
    private bankingService: BankingService,
    private fb: FormBuilder,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.billForm = this.fb.group({
      vendorId: [null],
      accountId: [null],
      description: ['', Validators.required],
      issueDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      status: ['RECEIVED', Validators.required],
      subtotal: [0, [Validators.required, Validators.min(0)]],
      vatRate: [15.0, [Validators.required, Validators.min(0)]],
      vatAmount: [0],
      total: [0],
      notes: ['']
    });

    this.payForm = this.fb.group({
      paymentMethod: ['BANK_TRANSFER', Validators.required],
      bankAccountId: [null]
    });

    // Auto-calculate VAT and total
    this.billForm.get('subtotal')?.valueChanges.subscribe(() => this.recalculate());
    this.billForm.get('vatRate')?.valueChanges.subscribe(() => this.recalculate());
  }

  ngOnInit(): void {
    this.loadBills();
    this.loadVendors();
    this.loadAccounts();
    this.loadApClaims();
    this.loadBankAccounts();
  }

  loadBankAccounts(): void {
    this.bankingService.getActiveAccounts$().subscribe({
      next: (res: any) => { this.bankAccounts = res?.data?.accounts ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  loadVendors(): void {
    this.vendorService.getActive().subscribe({
      next: (res: any) => {
        this.vendors = res.data?.vendors ?? res ?? [];
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  loadApClaims(): void {
    this.apClaimsLoading = true;
    this.cdr.markForCheck();
    this.expenseClaimService.expenseClaimsByStatus$(ExpenseClaimStatus.APPROVED, 0, 200).subscribe({
      next: (res: any) => {
        this.apClaims = res.data?.page?.content ?? [];
        this.apClaimsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.apClaimsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get apClaimsTotal(): number {
    return this.apClaims.reduce((sum, c) => sum + (c.totalAmount ?? 0), 0);
  }

  get totalOutstanding(): number {
    return (this.stats.outstanding ?? 0) + this.apClaimsTotal;
  }

  loadAccounts(): void {
    this.accountService.getAllActive().subscribe({
      next: (res: any) => {
        this.accounts = res.data?.accounts ?? res ?? [];
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  recalculate(): void {
    const subtotal = +this.billForm.get('subtotal')?.value || 0;
    const vatRate = +this.billForm.get('vatRate')?.value || 0;
    const vatAmount = +(subtotal * vatRate / 100).toFixed(2);
    const total = +(subtotal + vatAmount).toFixed(2);
    this.billForm.patchValue({ vatAmount, total }, { emitEvent: false });
  }

  loadBills(): void {
    this.loading = true;
    this.cdr.markForCheck();
    const obs$ = this.searchTerm
      ? this.billService.search$(this.searchTerm, this.currentPage, this.pageSize)
      : this.billService.bills$(this.currentPage, this.pageSize);

    obs$.subscribe({
      next: (res: any) => {
        const pageData = res.data?.page;
        this.bills = pageData?.content ?? [];
        this.totalPages = pageData?.totalPages ?? 0;
        this.totalElements = pageData?.totalElements ?? 0;
        if (res.data?.stats) this.stats = res.data.stats;
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

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 0;
    this.loadBills();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadBills();
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingId = null;
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    this.billForm.reset({ status: 'RECEIVED', vatRate: 15.0, subtotal: 0, vatAmount: 0, total: 0, issueDate: today, dueDate: due });
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openEdit(bill: Bill): void {
    this.isEditMode = true;
    this.editingId = bill.id ?? null;
    this.billForm.patchValue({
      vendorId: bill.vendor?.id ?? null,
      accountId: bill.account?.id ?? null,
      description: bill.description,
      issueDate: bill.issueDate,
      dueDate: bill.dueDate,
      status: bill.status,
      subtotal: bill.subtotal,
      vatRate: bill.vatRate,
      vatAmount: bill.vatAmount,
      total: bill.total,
      notes: bill.notes
    });
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.showPayModal = false;
    this.payingBill = null;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.billForm.invalid || this.submitting) return;
    this.submitting = true;
    const value = this.billForm.getRawValue();
    const payload: any = {
      ...value,
      vendor: value.vendorId ? { id: value.vendorId } : null,
      account: value.accountId ? { id: value.accountId } : null
    };
    if (this.isEditMode && this.editingId) payload.id = this.editingId;

    const obs$ = this.isEditMode
      ? this.billService.update$(payload)
      : this.billService.create$(payload);

    obs$.subscribe({
      next: () => {
        this.notification.onSuccess(this.isEditMode ? 'Bill updated' : 'Bill created');
        this.submitting = false;
        this.closeModal();
        this.loadBills();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  openPayModal(bill: Bill): void {
    this.payingBill = bill;
    this.payForm.reset({ paymentMethod: 'BANK_TRANSFER' });
    this.showPayModal = true;
    this.cdr.markForCheck();
  }

  onMarkPaid(): void {
    if (!this.payingBill || this.submitting) return;
    this.submitting = true;
    const method = this.payForm.get('paymentMethod')?.value;
    const bankAccountId = this.payForm.get('bankAccountId')?.value || undefined;
    this.billService.markPaid$(this.payingBill.id!, method, bankAccountId).subscribe({
      next: () => {
        this.notification.onSuccess(`Bill ${this.payingBill!.billNumber} marked as paid`);
        this.submitting = false;
        this.closeModal();
        this.loadBills();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteBill(bill: Bill): void {
    if (!confirm(`Delete bill ${bill.billNumber}? This cannot be undone.`)) return;
    this.billService.delete$(bill.id!).subscribe({
      next: () => {
        this.notification.onSuccess('Bill deleted');
        this.loadBills();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  viewBill(bill: Bill): void {
    this.viewingBill = bill;
    this.showViewModal = true;
    this.cdr.markForCheck();
  }

  closeBillViewModal(): void {
    this.showViewModal = false;
    this.viewingBill = null;
    this.cdr.markForCheck();
  }

  getStatusLabel(status: BillStatus): string {
    const map: Record<BillStatus, string> = {
      DRAFT: 'Draft',
      RECEIVED: 'Received',
      DUE: 'Due',
      PAID: 'Paid',
      OVERDUE: 'Overdue'
    };
    return map[status] ?? status;
  }

  getStatusClass(status: BillStatus): string {
    const map: Record<BillStatus, string> = {
      DRAFT: 'badge-soft-secondary',
      RECEIVED: 'badge-soft-info',
      DUE: 'badge-soft-warning',
      PAID: 'badge-soft-success',
      OVERDUE: 'badge-soft-danger'
    };
    return map[status] ?? 'badge-soft-secondary';
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}
