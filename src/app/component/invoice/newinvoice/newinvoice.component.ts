import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse } from 'src/app/interface/appstates';
import { CustomerModel } from 'src/app/component/customer/customer.model';
import { State } from 'src/app/interface/state';
import { UserModel } from 'src/app/component/profile/user.model';
import { CustomerService } from 'src/app/service/customer.service';
import { NotificationService } from 'src/app/service/notification.service';
import { InvoiceLineItem, InvoiceModel } from '../invoice.model';

@Component({
  standalone: false,
  selector: 'app-newinvoice',
  templateUrl: './newinvoice.component.html',
  styleUrls: ['./newinvoice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewinvoiceComponent implements OnInit {
  newInvoiceState$: Observable<State<CustomHttpResponse<CustomerModel[] & UserModel>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<CustomerModel[] & UserModel>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  readonly DataState = DataState;

  // Line items for flexible invoice
  lineItems: InvoiceLineItem[] = [];

  // Invoice calculations
  subtotal: number = 0;
  taxRate: number = 15; // Default VAT rate
  taxAmount: number = 0;
  discount: number = 0;
  total: number = 0;

  // Selected customer
  selectedCustomer: CustomerModel | null = null;

  // Invoice date
  invoiceDate: string = new Date().toISOString().split('T')[0];

  // Notes and terms
  notes: string = '';
  terms: string = 'NET 30 Days. Finance Charge of 1.5% will be made on unpaid balances after 30 days.';

  constructor(
    private customerService: CustomerService,
    private notification: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Add initial empty line item
    this.addLineItem();

    this.newInvoiceState$ = this.customerService.newInvoice$()
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error })
        })
      )
  }

  // Add a new line item
  addLineItem(): void {
    this.lineItems.push({
      item: '',
      description: '',
      unitCost: 0,
      quantity: 1,
      price: 0
    });
    this.cdr.markForCheck();
  }

  // Remove a line item
  removeLineItem(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems.splice(index, 1);
      this.calculateTotals();
      this.cdr.markForCheck();
    }
  }

  // Update line item price when unit cost or quantity changes
  updateLineItemPrice(index: number): void {
    const item = this.lineItems[index];
    item.price = item.unitCost * item.quantity;
    this.calculateTotals();
    this.cdr.markForCheck();
  }

  // Calculate all totals
  calculateTotals(): void {
    this.subtotal = this.lineItems.reduce((sum, item) => sum + item.price, 0);
    this.taxAmount = this.subtotal * (this.taxRate / 100);
    this.total = this.subtotal + this.taxAmount - this.discount;
    this.cdr.markForCheck();
  }

  // Update tax rate and recalculate
  updateTaxRate(): void {
    this.calculateTotals();
  }

  // Update discount and recalculate
  updateDiscount(): void {
    this.calculateTotals();
  }

  // Handle customer selection
  onCustomerChange(customerId: number, customers: CustomerModel[]): void {
    this.selectedCustomer = customers?.find(c => c.id === customerId) || null;
    this.cdr.markForCheck();
  }

  // Build services string from line items (for backward compatibility)
  buildServicesString(): string {
    return this.lineItems
      .filter(item => item.item.trim() !== '')
      .map((item, index) => `${index + 1} ${item.item} ${item.description || ''} R${item.price.toFixed(2)}`)
      .join(',');
  }

  // Create the invoice
  newInvoice(newInvoiceForm: NgForm): void {
    if (!this.selectedCustomer) {
      this.notification.onError('Please select a customer');
      return;
    }

    if (this.lineItems.filter(item => item.item.trim() !== '').length === 0) {
      this.notification.onError('Please add at least one item');
      return;
    }

    this.isLoadingSubject.next(true);

    // Build invoice data for South African VAT compliance
    // subtotal = amount EXCLUDING VAT
    // vatRate = 15% (standard SA VAT)
    // vatAmount = calculated VAT
    // total = subtotal + vatAmount - discount
    const invoiceData: InvoiceModel = {
      services: this.buildServicesString(),
      date: this.invoiceDate,
      status: newInvoiceForm.value.status || 'PENDING',
      subtotal: this.subtotal,
      vatRate: this.taxRate,
      vatAmount: this.taxAmount,
      discount: this.discount,
      total: this.total
    };

    this.newInvoiceState$ = this.customerService.createInvoice$(this.selectedCustomer.id, invoiceData)
      .pipe(
        map(response => {
          this.notification.onSuccess(response.message || 'Invoice created successfully');
          this.isLoadingSubject.next(false);
          // Reset form
          this.resetForm();
          return { dataState: DataState.LOADED, appData: this.dataSubject.value };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          this.isLoadingSubject.next(false);
          return of({ dataState: DataState.LOADED, error })
        })
      )
  }

  // Reset the form
  resetForm(): void {
    this.lineItems = [];
    this.addLineItem();
    this.selectedCustomer = null;
    this.invoiceDate = new Date().toISOString().split('T')[0];
    this.notes = '';
    this.discount = 0;
    this.calculateTotals();
    this.cdr.markForCheck();
  }

  // Navigate to invoices list
  goToInvoices(): void {
    this.router.navigate(['/invoices']);
  }

  // Format currency
  formatCurrency(amount: number): string {
    return `R ${amount.toFixed(2)}`;
  }
}
