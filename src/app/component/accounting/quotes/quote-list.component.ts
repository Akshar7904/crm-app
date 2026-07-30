// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuoteService } from '../services/quote.service';
import { Quote, QuoteStats, QuoteStatus } from '../models/quote.model';
import { NotificationService } from '../../../service/notification.service';
import { CustomerService } from '../../../service/customer.service';
import { CustomerModel } from '../../customer/customer.model';

@Component({
  standalone: false,
  selector: 'app-quote-list',
  templateUrl: './quote-list.component.html',
  styleUrls: ['./quote-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuoteListComponent implements OnInit {

  quotes: Quote[] = [];
  stats: QuoteStats = {
    totalQuotes: 0,
    draftQuotes: 0,
    sentQuotes: 0,
    acceptedQuotes: 0,
    convertedQuotes: 0,
    openQuotesValue: 0,
    conversionRate: 0
  };

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  loading = false;
  submitting = false;
  searchTerm = '';
  statusFilter: QuoteStatus | '' = '';

  showModal = false;
  isEditMode = false;
  editingId: number | null = null;

  showConvertModal = false;
  convertingQuote: Quote | null = null;

  customers: CustomerModel[] = [];

  quoteForm: FormGroup;

  readonly statusTabs: Array<{ value: QuoteStatus | ''; label: string }> = [
    { value: '', label: 'All' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SENT', label: 'Sent' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'CONVERTED', label: 'Converted' }
  ];

  constructor(
    private quoteService: QuoteService,
    private customerService: CustomerService,
    private fb: FormBuilder,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.quoteForm = this.fb.group({
      customerId: [null, [Validators.required, Validators.min(1)]],
      issueDate: ['', Validators.required],
      validUntil: ['', Validators.required],
      services: ['', Validators.required],
      subtotal: [0, [Validators.required, Validators.min(0)]],
      vatRate: [15.0, [Validators.required, Validators.min(0)]],
      vatAmount: [0],
      discount: [0, [Validators.min(0)]],
      total: [0],
      notes: ['']
    });

    // Auto-calculate VAT and total when subtotal, vatRate, or discount changes
    this.quoteForm.get('subtotal')?.valueChanges.subscribe(() => this.recalculate());
    this.quoteForm.get('vatRate')?.valueChanges.subscribe(() => this.recalculate());
    this.quoteForm.get('discount')?.valueChanges.subscribe(() => this.recalculate());

    // Auto-set validUntil to issueDate + 30 days when issueDate changes
    this.quoteForm.get('issueDate')?.valueChanges.subscribe((val: string) => {
      if (val && !this.isEditMode) {
        const validUntil = new Date(new Date(val).getTime() + 30 * 86400000).toISOString().split('T')[0];
        this.quoteForm.patchValue({ validUntil }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadQuotes();
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.newInvoice$().subscribe({
      next: (res: any) => {
        this.customers = res.data?.customers ?? [];
        this.cdr.markForCheck();
      },
      error: () => { /* non-critical — form still usable */ }
    });
  }

  recalculate(): void {
    const subtotal = +this.quoteForm.get('subtotal')?.value || 0;
    const vatRate = +this.quoteForm.get('vatRate')?.value || 0;
    const discount = +this.quoteForm.get('discount')?.value || 0;
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const vatAmount = +(discountedSubtotal * vatRate / 100).toFixed(2);
    const total = +(discountedSubtotal + vatAmount).toFixed(2);
    this.quoteForm.patchValue({ vatAmount, total }, { emitEvent: false });
  }

  loadQuotes(): void {
    this.loading = true;
    this.cdr.markForCheck();

    let obs$;
    if (this.searchTerm) {
      obs$ = this.quoteService.search$(this.searchTerm, this.currentPage, this.pageSize);
    } else if (this.statusFilter) {
      obs$ = this.quoteService.byStatus$(this.statusFilter, this.currentPage, this.pageSize);
    } else {
      obs$ = this.quoteService.quotes$(this.currentPage, this.pageSize);
    }

    obs$.subscribe({
      next: (res: any) => {
        const pageData = res.data?.page;
        this.quotes = pageData?.content ?? [];
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
    this.loadQuotes();
  }

  onStatusFilter(status: QuoteStatus | ''): void {
    this.statusFilter = status;
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadQuotes();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadQuotes();
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingId = null;
    const today = new Date().toISOString().split('T')[0];
    const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    this.quoteForm.reset({
      customerId: null,
      issueDate: today,
      validUntil,
      services: '',
      subtotal: 0,
      vatRate: 15.0,
      vatAmount: 0,
      discount: 0,
      total: 0,
      notes: ''
    });
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openEdit(quote: Quote): void {
    this.isEditMode = true;
    this.editingId = quote.id ?? null;
    this.quoteForm.patchValue({
      customerId: quote.customer?.id ?? quote.customerId,
      issueDate: quote.issueDate,
      validUntil: quote.validUntil,
      services: quote.services,
      subtotal: quote.subtotal,
      vatRate: quote.vatRate,
      vatAmount: quote.vatAmount,
      discount: quote.discount ?? 0,
      total: quote.total,
      notes: quote.notes
    });
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.showConvertModal = false;
    this.convertingQuote = null;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.quoteForm.invalid || this.submitting) return;
    this.submitting = true;
    const value = this.quoteForm.getRawValue();
    const payload: any = {
      ...value,
      customer: value.customerId ? { id: value.customerId } : null
    };
    if (this.isEditMode && this.editingId) payload.id = this.editingId;

    const obs$ = this.isEditMode
      ? this.quoteService.update$(payload)
      : this.quoteService.create$(payload);

    obs$.subscribe({
      next: () => {
        this.notification.onSuccess(this.isEditMode ? 'Quote updated' : 'Quote created');
        this.submitting = false;
        this.closeModal();
        this.loadQuotes();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  markSent(quote: Quote): void {
    if (!quote.id) return;
    this.quoteService.markSent$(quote.id).subscribe({
      next: () => {
        this.notification.onSuccess(`Quote ${quote.quoteNumber} marked as sent`);
        this.loadQuotes();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  acceptQuote(quote: Quote): void {
    if (!quote.id) return;
    this.quoteService.accept$(quote.id).subscribe({
      next: () => {
        this.notification.onSuccess(`Quote ${quote.quoteNumber} accepted`);
        this.loadQuotes();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  rejectQuote(quote: Quote): void {
    if (!quote.id) return;
    this.quoteService.reject$(quote.id).subscribe({
      next: () => {
        this.notification.onSuccess(`Quote ${quote.quoteNumber} rejected`);
        this.loadQuotes();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  openConvertModal(quote: Quote): void {
    this.convertingQuote = quote;
    this.showConvertModal = true;
    this.cdr.markForCheck();
  }

  confirmConvert(): void {
    if (!this.convertingQuote?.id || this.submitting) return;
    this.submitting = true;
    this.quoteService.convert$(this.convertingQuote.id).subscribe({
      next: (res: any) => {
        const invoiceId = res.data?.invoiceId ?? res.data?.id ?? '';
        const msg = invoiceId
          ? `Quote converted to Invoice #${invoiceId}`
          : `Quote ${this.convertingQuote!.quoteNumber} converted to Invoice`;
        this.notification.onSuccess(msg);
        this.submitting = false;
        this.closeModal();
        this.loadQuotes();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteQuote(quote: Quote): void {
    if (!confirm(`Delete quote ${quote.quoteNumber}? This cannot be undone.`)) return;
    this.quoteService.delete$(quote.id!).subscribe({
      next: () => {
        this.notification.onSuccess('Quote deleted');
        this.loadQuotes();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  getStatusClass(status: QuoteStatus | undefined): string {
    if (!status) return 'badge-soft-secondary';
    const map: Record<QuoteStatus, string> = {
      DRAFT: 'badge-soft-secondary',
      SENT: 'badge-soft-primary',
      ACCEPTED: 'badge-soft-success',
      REJECTED: 'badge-soft-danger',
      EXPIRED: 'badge-soft-warning',
      CONVERTED: 'badge-soft-info'
    };
    return map[status] ?? 'badge-soft-secondary';
  }

  getStatusLabel(status: QuoteStatus | undefined): string {
    if (!status) return '—';
    const map: Record<QuoteStatus, string> = {
      DRAFT: 'Draft',
      SENT: 'Sent',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
      EXPIRED: 'Expired',
      CONVERTED: 'Converted'
    };
    return map[status] ?? status;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get openQuotesCount(): number {
    return (this.stats.sentQuotes || 0) + (this.stats.acceptedQuotes || 0);
  }
}
