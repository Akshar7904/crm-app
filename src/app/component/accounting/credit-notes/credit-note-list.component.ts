// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreditNoteService } from '../services/credit-note.service';
import { CreditNote, CreditNoteStats, CreditNoteStatus } from '../models/credit-note.model';
import { NotificationService } from '../../../service/notification.service';
import { CustomerService } from '../../../service/customer.service';
import { CustomerModel } from '../../customer/customer.model';

@Component({
  standalone: false,
  selector: 'app-credit-note-list',
  templateUrl: './credit-note-list.component.html',
  styleUrls: ['./credit-note-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditNoteListComponent implements OnInit {

  creditNotes: CreditNote[] = [];
  stats: CreditNoteStats = {
    totalCreditNotes: 0,
    draftCreditNotes: 0,
    issuedCreditNotes: 0,
    appliedCreditNotes: 0,
    voidedCreditNotes: 0,
    openValue: 0
  };

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  loading = false;
  submitting = false;
  searchTerm = '';
  statusFilter: CreditNoteStatus | '' = '';

  showModal = false;
  showViewModal = false;
  viewingCN: CreditNote | null = null;
  isEditMode = false;
  editingId: number | null = null;

  customers: CustomerModel[] = [];
  customerInvoices: any[] = [];
  loadingInvoices = false;

  creditNoteForm: FormGroup;

  readonly statusTabs: Array<{ value: CreditNoteStatus | ''; label: string }> = [
    { value: '', label: 'All' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ISSUED', label: 'Issued' },
    { value: 'APPLIED', label: 'Applied' },
    { value: 'VOIDED', label: 'Voided' }
  ];

  constructor(
    private creditNoteService: CreditNoteService,
    private customerService: CustomerService,
    private fb: FormBuilder,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.creditNoteForm = this.fb.group({
      customerId: [null, [Validators.required, Validators.min(1)]],
      invoiceId: [null],
      issueDate: ['', Validators.required],
      reason: ['', Validators.required],
      subtotal: [0, [Validators.required, Validators.min(0)]],
      vatRate: [15.0, [Validators.required, Validators.min(0)]],
      vatAmount: [0],
      total: [0],
      notes: ['']
    });

    // Auto-calculate VAT and total when subtotal or vatRate changes
    this.creditNoteForm.get('subtotal')?.valueChanges.subscribe(() => this.recalculate());
    this.creditNoteForm.get('vatRate')?.valueChanges.subscribe(() => this.recalculate());

    // Load invoices when customer selection changes
    this.creditNoteForm.get('customerId')?.valueChanges.subscribe(id => {
      this.customerInvoices = [];
      this.creditNoteForm.patchValue({ invoiceId: null }, { emitEvent: false });
      if (id) this.loadCustomerInvoices(id);
    });
  }

  ngOnInit(): void {
    this.loadCreditNotes();
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.newInvoice$().subscribe({
      next: (res: any) => {
        this.customers = res.data?.customers ?? [];
        this.cdr.markForCheck();
      },
      error: () => { /* non-critical */ }
    });
  }

  loadCustomerInvoices(customerId: number): void {
    this.loadingInvoices = true;
    this.cdr.markForCheck();
    this.customerService.invoicesByCustomer$(customerId).subscribe({
      next: (res: any) => {
        this.customerInvoices = res.data?.invoices ?? [];
        this.loadingInvoices = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingInvoices = false;
        this.cdr.markForCheck();
      }
    });
  }

  recalculate(): void {
    const subtotal = +this.creditNoteForm.get('subtotal')?.value || 0;
    const vatRate = +this.creditNoteForm.get('vatRate')?.value || 0;
    const vatAmount = +(subtotal * vatRate / 100).toFixed(2);
    const total = +(subtotal + vatAmount).toFixed(2);
    this.creditNoteForm.patchValue({ vatAmount, total }, { emitEvent: false });
  }

  loadCreditNotes(): void {
    this.loading = true;
    this.cdr.markForCheck();

    let obs$;
    if (this.searchTerm) {
      obs$ = this.creditNoteService.search$(this.searchTerm, this.currentPage, this.pageSize);
    } else if (this.statusFilter) {
      obs$ = this.creditNoteService.byStatus$(this.statusFilter, this.currentPage, this.pageSize);
    } else {
      obs$ = this.creditNoteService.list$(this.currentPage, this.pageSize);
    }

    obs$.subscribe({
      next: (res: any) => {
        const pageData = res.data?.page;
        this.creditNotes = pageData?.content ?? [];
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
    this.statusFilter = '';
    this.currentPage = 0;
    this.loadCreditNotes();
  }

  onStatusFilter(status: CreditNoteStatus | ''): void {
    this.statusFilter = status;
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadCreditNotes();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCreditNotes();
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.customerInvoices = [];
    const today = new Date().toISOString().split('T')[0];
    this.creditNoteForm.reset({
      customerId: null,
      invoiceId: null,
      issueDate: today,
      reason: '',
      subtotal: 0,
      vatRate: 15.0,
      vatAmount: 0,
      total: 0,
      notes: ''
    });
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openEdit(cn: CreditNote): void {
    this.isEditMode = true;
    this.editingId = cn.id ?? null;
    this.customerInvoices = [];
    const customerId = cn.customer?.id ?? cn.customerId;
    if (customerId) this.loadCustomerInvoices(customerId);
    this.creditNoteForm.patchValue({
      customerId,
      invoiceId: cn.invoiceId ?? null,
      issueDate: cn.issueDate,
      reason: cn.reason,
      subtotal: cn.subtotal,
      vatRate: cn.vatRate,
      vatAmount: cn.vatAmount,
      total: cn.total,
      notes: cn.notes
    });
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.creditNoteForm.invalid || this.submitting) return;
    this.submitting = true;
    const value = this.creditNoteForm.getRawValue();
    const payload: any = {
      ...value,
      customer: value.customerId ? { id: value.customerId } : null
    };
    if (this.isEditMode && this.editingId) payload.id = this.editingId;

    const obs$ = this.isEditMode
      ? this.creditNoteService.update$(payload)
      : this.creditNoteService.create$(payload);

    obs$.subscribe({
      next: () => {
        this.notification.onSuccess(this.isEditMode ? 'Credit note updated' : 'Credit note created');
        this.submitting = false;
        this.closeModal();
        this.loadCreditNotes();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  issueCreditNote(cn: CreditNote): void {
    if (!cn.id) return;
    this.creditNoteService.issue$(cn.id).subscribe({
      next: () => {
        this.notification.onSuccess(`Credit note ${cn.creditNoteNumber} issued`);
        this.loadCreditNotes();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  applyCreditNote(cn: CreditNote): void {
    if (!cn.id) return;
    this.creditNoteService.apply$(cn.id).subscribe({
      next: () => {
        this.notification.onSuccess(`Credit note ${cn.creditNoteNumber} applied to invoice`);
        this.loadCreditNotes();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  voidCreditNote(cn: CreditNote): void {
    if (!cn.id) return;
    if (!confirm(`Void credit note ${cn.creditNoteNumber}? This cannot be undone.`)) return;
    this.creditNoteService.void$(cn.id).subscribe({
      next: () => {
        this.notification.onSuccess(`Credit note ${cn.creditNoteNumber} voided`);
        this.loadCreditNotes();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  deleteCreditNote(cn: CreditNote): void {
    if (!cn.id) return;
    if (!confirm(`Delete credit note ${cn.creditNoteNumber}? This cannot be undone.`)) return;
    this.creditNoteService.delete$(cn.id).subscribe({
      next: () => {
        this.notification.onSuccess('Credit note deleted');
        this.loadCreditNotes();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  viewCreditNote(cn: CreditNote): void {
    this.viewingCN = cn;
    this.showViewModal = true;
    this.cdr.markForCheck();
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewingCN = null;
    this.cdr.markForCheck();
  }

  getStatusClass(status: CreditNoteStatus | undefined): string {
    if (!status) return 'badge-soft-secondary';
    const map: Record<CreditNoteStatus, string> = {
      DRAFT: 'badge-soft-secondary',
      ISSUED: 'badge-soft-primary',
      APPLIED: 'badge-soft-success',
      VOIDED: 'badge-soft-danger'
    };
    return map[status] ?? 'badge-soft-secondary';
  }

  getStatusLabel(status: CreditNoteStatus | undefined): string {
    if (!status) return '—';
    const map: Record<CreditNoteStatus, string> = {
      DRAFT: 'Draft',
      ISSUED: 'Issued',
      APPLIED: 'Applied',
      VOIDED: 'Voided'
    };
    return map[status] ?? status;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}
