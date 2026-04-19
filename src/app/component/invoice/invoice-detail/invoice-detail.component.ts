// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, BehaviorSubject, switchMap, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse } from 'src/app/interface/appstates';
import { CustomerModel } from 'src/app/component/customer/customer.model';
import { InvoiceModel } from 'src/app/component/invoice/invoice.model';
import { State } from 'src/app/interface/state';
import { UserModel } from 'src/app/component/profile/user.model';
import { CustomerService } from 'src/app/service/customer.service';
import { CompanyService } from 'src/app/service/company.service';
import { jsPDF as pdf } from 'jspdf';
import html2canvas from 'html2canvas';
import { NotificationService } from 'src/app/service/notification.service';
import { NgForm } from '@angular/forms';
import { InvoiceLineItem } from '../invoice.model';
import { BankingService } from '../../accounting/services/banking.service';

const INVOICE_ID = 'id';

@Component({
  standalone: false,
  selector: 'app-invoice',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceDetailComponent implements OnInit {
  invoiceState$: Observable<State<CustomHttpResponse<CustomerModel & InvoiceModel & UserModel>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<CustomerModel & InvoiceModel & UserModel>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private isSendingSubject = new BehaviorSubject<boolean>(false);
  isSending$ = this.isSendingSubject.asObservable();
  readonly DataState = DataState;

  // Edit mode
  isEditMode: boolean = false;
  editInvoice: any = {};

  company: any = null;

  // Send confirmation
  showSendConfirm = false;
  sendTargetCustomer: any = null;
  sendTargetInvoiceNumber: string = '';
  customMessage: string = '';

  // Mark Paid
  showMarkPaidModal = false;
  markPaidBankAccountId: number | null = null;
  bankAccounts: any[] = [];

  // Line items for edit mode
  editLineItems: InvoiceLineItem[] = [];
  editSubtotal: number = 0;
  editTaxRate: number = 15;
  editTaxAmount: number = 0;
  editDiscount: number = 0;
  editTotal: number = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    public companyService: CompanyService,
    private notification: NotificationService,
    private bankingService: BankingService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.companyService.getMyCompany$().subscribe({
      next: (res) => { this.company = res?.data?.company; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.bankingService.getActiveAccounts$().subscribe({
      next: (res: any) => { this.bankAccounts = res?.data?.accounts ?? res ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });

    // Check if edit mode is requested via query param
    this.activatedRoute.queryParams.subscribe(params => {
      this.isEditMode = params['edit'] === 'true';
      this.cdr.markForCheck();
    });

    this.invoiceState$ = this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        return this.customerService.invoice$(+params.get(INVOICE_ID))
          .pipe(
            map(response => {
              this.notification.onDefault(response.message);
              console.log(response);
              this.dataSubject.next(response);
              // Initialize edit invoice data with formatted decimals
              if (response.data) {
                this.initEditInvoice(response.data['invoice']);
              }
              return { dataState: DataState.LOADED, appData: response };
            }),
            startWith({ dataState: DataState.LOADING }),
            catchError((error: string) => {
              this.notification.onError(error);
              return of({ dataState: DataState.ERROR, error })
            })
          )
      })
    );
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode && this.dataSubject.value?.data) {
      this.initEditInvoice(this.dataSubject.value.data['invoice']);
    }
    this.cdr.markForCheck();
  }

  private initEditInvoice(invoice: any): void {
    this.editInvoice = {
      ...invoice,
      subtotal: this.roundToTwo(invoice.subtotal),
      vatAmount: this.roundToTwo(invoice.vatAmount),
      discount: this.roundToTwo(invoice.discount || 0),
      total: this.roundToTwo(invoice.total)
    };
    // Parse services string into line items
    this.editLineItems = this.parseServicesToLineItems(invoice.services);
    this.editTaxRate = invoice.vatRate || 15;
    this.editDiscount = this.roundToTwo(invoice.discount || 0);
    this.calculateEditTotals();
  }

  private parseServicesToLineItems(services: string): InvoiceLineItem[] {
    if (!services || services.trim() === '') {
      return [{ item: '', description: '', unitCost: 0, quantity: 1, price: 0 }];
    }
    const items: InvoiceLineItem[] = [];
    const parts = services.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      // Parse format: "1 Item Name Description R1234.56"
      const amountMatch = trimmed.match(/R?([\d.]+)$/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      // Remove leading number and trailing amount
      let nameDesc = trimmed.replace(/^\d+\s*/, '').replace(/\s*R?[\d.]+$/, '').trim();
      items.push({
        item: nameDesc || 'Service',
        description: '',
        unitCost: amount,
        quantity: 1,
        price: amount
      });
    }
    return items.length > 0 ? items : [{ item: '', description: '', unitCost: 0, quantity: 1, price: 0 }];
  }

  addEditLineItem(): void {
    this.editLineItems.push({ item: '', description: '', unitCost: 0, quantity: 1, price: 0 });
    this.cdr.markForCheck();
  }

  removeEditLineItem(index: number): void {
    if (this.editLineItems.length > 1) {
      this.editLineItems.splice(index, 1);
      this.calculateEditTotals();
      this.cdr.markForCheck();
    }
  }

  updateEditLineItemPrice(index: number): void {
    const item = this.editLineItems[index];
    item.price = item.unitCost * item.quantity;
    this.calculateEditTotals();
    this.cdr.markForCheck();
  }

  calculateEditTotals(): void {
    this.editSubtotal = this.editLineItems.reduce((sum, item) => sum + item.price, 0);
    this.editTaxAmount = this.editSubtotal * (this.editTaxRate / 100);
    this.editTotal = this.editSubtotal + this.editTaxAmount - this.editDiscount;
    this.cdr.markForCheck();
  }

  updateEditTaxRate(): void {
    this.calculateEditTotals();
  }

  updateEditDiscount(): void {
    this.calculateEditTotals();
  }

  private buildEditServicesString(): string {
    return this.editLineItems
      .filter(item => item.item.trim() !== '')
      .map((item, index) => `${index + 1} ${item.item} ${item.description || ''} R${item.price.toFixed(2)}`)
      .join(',');
  }

  private roundToTwo(value: number): number {
    return Math.round((value || 0) * 100) / 100;
  }

  formatDecimal(field: string): void {
    if (this.editInvoice[field] !== undefined && this.editInvoice[field] !== null) {
      this.editInvoice[field] = this.roundToTwo(this.editInvoice[field]);
    }
    this.cdr.markForCheck();
  }

  updateInvoice(form: NgForm): void {
    this.isLoadingSubject.next(true);

    const invoiceData: InvoiceModel = {
      id: this.editInvoice.id,
      invoiceNumber: this.editInvoice.invoiceNumber,
      services: this.buildEditServicesString(),
      date: this.editInvoice.date,
      status: form.value.status || this.editInvoice.status,
      subtotal: this.editSubtotal,
      vatRate: this.editTaxRate,
      vatAmount: this.editTaxAmount,
      total: this.editTotal,
      discount: this.editDiscount
    };

    this.customerService.updateInvoice$(invoiceData)
      .subscribe({
        next: (response) => {
          this.notification.onSuccess(response.message || 'Invoice updated successfully');
          this.dataSubject.next(response);
          // Update the template observable so view mode shows new data
          this.invoiceState$ = new Observable(subscriber => {
            subscriber.next({ dataState: DataState.LOADED, appData: response });
            subscriber.complete();
          });
          this.isEditMode = false;
          this.isLoadingSubject.next(false);
          // Re-init edit data from updated response
          if (response.data) {
            this.initEditInvoice(response.data['invoice']);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.notification.onError(error);
          this.isLoadingSubject.next(false);
          this.cdr.markForCheck();
        }
      });
  }

  openSendConfirm(customer: any): void {
    this.sendTargetCustomer = customer;
    const invoice = this.dataSubject.value?.data['invoice'];
    this.sendTargetInvoiceNumber = invoice?.invoiceNumber || '';
    this.customMessage = this.getDefaultMessage(customer, invoice);
    this.showSendConfirm = true;
    this.cdr.markForCheck();
  }

  closeSendConfirm(): void {
    this.showSendConfirm = false;
    this.sendTargetCustomer = null;
    this.customMessage = '';
    this.cdr.markForCheck();
  }

  private getDefaultMessage(customer: any, invoice: any): string {
    const name     = customer?.name || 'Valued Client';
    const num      = invoice?.invoiceNumber || '';
    const total    = invoice?.total ? this.formatCurrency(invoice.total) : '';
    const status   = (invoice?.status || 'PENDING').toUpperCase();

    const coName    = this.company?.legalName || this.company?.name || '';
    const coContact = [this.company?.email, this.company?.phone].filter(Boolean).join(' | ');
    const closing = `\nShould you have any questions, please do not hesitate to contact us.\n\nKind regards,\n${coName}${coContact ? '\n' + coContact : ''}`;

    switch (status) {
      case 'PAID':
        return `Good day ${name},\n\nThank you for your payment. Please find the receipt for Invoice #${num} (${total}) attached for your records.\n\nWe appreciate your prompt settlement and look forward to continuing our partnership.${closing}`;
      case 'OVERDUE':
        return `Good day ${name},\n\nThis is a reminder that Invoice #${num} totalling ${total} is now overdue.\n\nPlease find the invoice attached and arrange payment at your earliest convenience to avoid any late-payment charges. If payment has already been made, please disregard this notice.${closing}`;
      case 'CANCELED':
        return `Good day ${name},\n\nPlease find attached the cancelled Invoice #${num} for your records.\n\nIf you believe this cancellation was made in error or would like to discuss further, please contact us at your earliest convenience.${closing}`;
      default: // PENDING
        return `Good day ${name},\n\nPlease find attached Invoice #${num} totalling ${total} for services rendered.\n\nPayment is due within 30 days of the invoice date. Kindly use the invoice number as your payment reference.${closing}`;
    }
  }

  confirmSendInvoice(): void {
    const invoiceId = this.dataSubject.value?.data['invoice']?.id;
    const invoiceNumber = this.dataSubject.value?.data['invoice']?.invoiceNumber;
    if (!invoiceId) {
      this.notification.onError('Invoice not found');
      return;
    }

    const element = document.getElementById('invoice');
    if (!element) {
      this.notification.onError('Could not capture invoice for attachment');
      return;
    }

    this.isSendingSubject.next(true);
    this.cdr.markForCheck();

    // Generate the PDF from the live invoice view (same as Export PDF)
    html2canvas(element, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false })
      .then(canvas => {
        const doc = new pdf('p', 'mm', 'a4');
        const margin = 10;
        const pageWidth  = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const printableW = pageWidth  - margin * 2;
        const printableH = pageHeight - margin * 2;
        const pxPerMm    = canvas.width / printableW;
        const pageHeightPx = printableH * pxPerMm;
        let yOffset = 0;

        while (yOffset < canvas.height) {
          const sliceH = Math.min(pageHeightPx, canvas.height - yOffset);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width  = canvas.width;
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          if (yOffset > 0) doc.addPage();
          doc.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, printableW, sliceH / pxPerMm);
          yOffset += pageHeightPx;
        }

        // Convert to Blob and send to backend for email attachment
        const pdfBlob = doc.output('blob');
        this.customerService.sendInvoice$(invoiceId, pdfBlob, this.customMessage)
          .subscribe({
            next: (response) => {
              this.notification.onSuccess(response.message || 'Invoice sent successfully');
              this.isSendingSubject.next(false);
              this.showSendConfirm = false;
              this.cdr.markForCheck();
            },
            error: (error) => {
              this.notification.onError(error);
              this.isSendingSubject.next(false);
              this.cdr.markForCheck();
            }
          });
      })
      .catch(() => {
        this.notification.onError('Failed to generate PDF for email attachment');
        this.isSendingSubject.next(false);
        this.cdr.markForCheck();
      });
  }

  cancelEdit(): void {
    this.isEditMode = false;
    if (this.dataSubject.value?.data) {
      this.initEditInvoice(this.dataSubject.value.data['invoice']);
    }
    this.cdr.markForCheck();
  }

  openMarkPaidModal(): void {
    this.markPaidBankAccountId = null;
    this.showMarkPaidModal = true;
    this.cdr.markForCheck();
  }

  closeMarkPaidModal(): void {
    this.showMarkPaidModal = false;
    this.cdr.markForCheck();
  }

  confirmMarkPaid(): void {
    const invoiceId = this.dataSubject.value?.data?.['invoice']?.id;
    if (!invoiceId) return;
    this.customerService.markInvoicePaid$(invoiceId, this.markPaidBankAccountId ?? undefined)
      .subscribe({
        next: (response: any) => {
          this.notification.onSuccess('Invoice marked as paid' + (this.markPaidBankAccountId ? ' and payment recorded in banking' : ''));
          // Refresh the data
          const updated = { ...this.dataSubject.value };
          if (updated.data) updated.data['invoice'] = { ...updated.data['invoice'], status: 'PAID' };
          this.dataSubject.next(updated);
          this.invoiceState$ = new Observable(subscriber => {
            subscriber.next({ dataState: DataState.LOADED, appData: updated });
            subscriber.complete();
          });
          this.closeMarkPaidModal();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.notification.onError(error);
          this.closeMarkPaidModal();
          this.cdr.markForCheck();
        }
      });
  }

  exportAsPDF(): void {
    const element = document.getElementById('invoice');
    if (!element) return;
    const filename = `invoice-${this.dataSubject.value.data['invoice'].invoiceNumber}.pdf`;

    html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    }).then(canvas => {
      const doc = new pdf('p', 'mm', 'a4');
      const margin = 10;
      const pageWidth  = doc.internal.pageSize.getWidth();   // 210mm
      const pageHeight = doc.internal.pageSize.getHeight();  // 297mm
      const printableW = pageWidth  - margin * 2;
      const printableH = pageHeight - margin * 2;
      const pxPerMm    = canvas.width / printableW;
      const pageHeightPx = printableH * pxPerMm;
      let yOffset = 0;

      while (yOffset < canvas.height) {
        const sliceH = Math.min(pageHeightPx, canvas.height - yOffset);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

        if (yOffset > 0) doc.addPage();
        doc.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, printableW, sliceH / pxPerMm);
        yOffset += pageHeightPx;
      }

      doc.save(filename);
      this.cdr.markForCheck();
    });
  }

  printInvoice(): void {
    window.print();
  }

  // Format currency for display
  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return 'R 0.00';
    return 'R ' + amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Extract service name from service string
  getServiceName(service: string): string {
    if (!service) return '';
    const parts = service.trim().split(' ');
    // Skip the first part (number) and last part (amount), join the rest
    if (parts.length > 2) {
      return parts.slice(1, -1).join(' ');
    }
    return service.trim();
  }

  // Extract service amount from service string
  getServiceAmount(service: string): number {
    if (!service) return 0;
    const parts = service.trim().split(' ');
    // Get the last part which should be the amount
    const amountStr = parts[parts.length - 1];
    const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g, ''));
    return isNaN(amount) ? 0 : amount;
  }

  // Get subtotal (amount excluding VAT)
  // If subtotal is stored, use it; otherwise calculate from total
  getSubtotal(invoice: any): number {
    if (!invoice) return 0;
    if (invoice.subtotal) return invoice.subtotal;
    // Fallback: if no subtotal stored, calculate from total (assuming 15% VAT)
    const vatRate = invoice.vatRate || 15;
    return invoice.total / (1 + vatRate / 100);
  }

  // Get VAT rate (default 15% for South Africa)
  getVatRate(invoice: any): number {
    if (!invoice) return 15;
    return invoice.vatRate || 15;
  }

  // Calculate number of days between invoice date and due date
  getDueDays(invoice: any): number {
    if (!invoice?.date || !invoice?.dueDate) return 30;
    const start = new Date(invoice.date);
    const end   = new Date(invoice.dueDate);
    const diff  = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 30;
  }

  // Get VAT amount
  getVatAmount(invoice: any): number {
    if (!invoice) return 0;
    if (invoice.vatAmount) return invoice.vatAmount;
    // Fallback: calculate VAT from subtotal
    const subtotal = this.getSubtotal(invoice);
    const vatRate = this.getVatRate(invoice);
    return subtotal * (vatRate / 100);
  }
}
