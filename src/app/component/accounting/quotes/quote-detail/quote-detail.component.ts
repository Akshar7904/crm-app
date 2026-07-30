// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuoteService } from '../../services/quote.service';
import { Quote, QuoteStatus } from '../../models/quote.model';
import { NotificationService } from '../../../../service/notification.service';
import { CompanyService } from '../../../../service/company.service';

@Component({
  standalone: false,
  selector: 'app-quote-detail',
  templateUrl: './quote-detail.component.html',
  styleUrls: ['./quote-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuoteDetailComponent implements OnInit {

  company: any = null;
  quote: Quote | null = null;
  loading = false;
  submitting = false;
  isEditMode = false;

  // Edit form model
  editQuote: any = {};
  editSubtotal = 0;
  editVatRate = 15;
  editVatAmount = 0;
  editDiscount = 0;
  editTotal = 0;

  private quoteId!: number;

  constructor(
    private quoteService: QuoteService,
    private notification: NotificationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.quoteId = +this.activatedRoute.snapshot.params['id'];
    this.companyService.getMyCompany$().subscribe({
      next: (res) => { this.company = res?.data?.company; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.loadQuote();
  }

  loadQuote(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.quoteService.quote$(this.quoteId).subscribe({
      next: (res: any) => {
        this.quote = res.data?.quote ?? null;
        this.loading = false;
        if (this.quote) {
          this.initEditQuote(this.quote);
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private initEditQuote(quote: Quote): void {
    this.editQuote = {
      ...quote,
      issueDate: quote.issueDate,
      validUntil: quote.validUntil,
      services: quote.services ?? '',
      notes: quote.notes ?? ''
    };
    this.editSubtotal = this.roundToTwo(quote.subtotal ?? 0);
    this.editVatRate = quote.vatRate ?? 15;
    this.editDiscount = this.roundToTwo(quote.discount ?? 0);
    this.recalculate();
  }

  recalculate(): void {
    const discountedSubtotal = Math.max(0, this.editSubtotal - this.editDiscount);
    this.editVatAmount = this.roundToTwo(discountedSubtotal * (this.editVatRate / 100));
    this.editTotal = this.roundToTwo(discountedSubtotal + this.editVatAmount);
    this.cdr.markForCheck();
  }

  private roundToTwo(value: number): number {
    return Math.round((value || 0) * 100) / 100;
  }

  toggleEdit(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode && this.quote) {
      this.initEditQuote(this.quote);
    }
    this.cdr.markForCheck();
  }

  saveEdit(): void {
    if (this.submitting) return;
    this.submitting = true;

    const payload: any = {
      id: this.quote?.id,
      customerId: this.quote?.customer?.id ?? this.quote?.customerId,
      customer: this.quote?.customer,
      issueDate: this.editQuote.issueDate,
      validUntil: this.editQuote.validUntil,
      services: this.editQuote.services,
      subtotal: this.editSubtotal,
      vatRate: this.editVatRate,
      vatAmount: this.editVatAmount,
      discount: this.editDiscount,
      total: this.editTotal,
      notes: this.editQuote.notes
    };

    this.quoteService.update$(payload).subscribe({
      next: () => {
        this.notification.onSuccess('Quote updated successfully');
        this.submitting = false;
        this.isEditMode = false;
        this.loadQuote();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  markSent(): void {
    if (!this.quote?.id || this.submitting) return;
    this.submitting = true;
    this.cdr.markForCheck();

    this.quoteService.markSent$(this.quote.id).subscribe({
      next: () => {
        this.notification.onSuccess(`Quote ${this.quote?.quoteNumber} marked as sent`);
        this.submitting = false;
        this.loadQuote();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  accept(): void {
    if (!this.quote?.id || this.submitting) return;
    this.submitting = true;
    this.cdr.markForCheck();

    this.quoteService.accept$(this.quote.id).subscribe({
      next: () => {
        this.notification.onSuccess(`Quote ${this.quote?.quoteNumber} accepted`);
        this.submitting = false;
        this.loadQuote();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  reject(): void {
    if (!this.quote?.id || this.submitting) return;
    if (!confirm(`Reject quote ${this.quote.quoteNumber}? This action cannot be undone.`)) return;
    this.submitting = true;
    this.cdr.markForCheck();

    this.quoteService.reject$(this.quote.id).subscribe({
      next: () => {
        this.notification.onSuccess(`Quote ${this.quote?.quoteNumber} rejected`);
        this.submitting = false;
        this.loadQuote();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  openConvert(): void {
    if (!this.quote?.id || this.submitting) return;
    this.submitting = true;
    this.cdr.markForCheck();

    this.quoteService.convert$(this.quote.id).subscribe({
      next: (res: any) => {
        this.notification.onSuccess('Quote converted to Invoice');
        this.submitting = false;
        this.router.navigate(['/invoices']);
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/accounting/quotes']);
  }

  printQuote(): void {
    window.print();
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'R 0.00';
    return 'R ' + amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
}
