// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse, Page } from 'src/app/interface/appstates';
import { InvoiceModel } from 'src/app/component/invoice/invoice.model';
import { State } from 'src/app/interface/state';
import { UserModel } from 'src/app/component/profile/user.model';
import { CustomerService } from 'src/app/service/customer.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  standalone: false,
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicesComponent implements OnInit {
  invoicesState$: Observable<State<CustomHttpResponse<Page<InvoiceModel> & UserModel>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<Page<InvoiceModel> & UserModel>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();
  readonly DataState = DataState;

  constructor(
    private router: Router,
    private customerService: CustomerService,
    private notification: NotificationService
  ) { }

  ngOnInit(): void {
    this.invoicesState$ = this.customerService.invoices$()
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

  goToPage(pageNumber?: number): void {
    this.invoicesState$ = this.customerService.invoices$(pageNumber)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          this.currentPageSubject.next(pageNumber);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.LOADED, error, appData: this.dataSubject.value })
        })
      )
  }

  goToNextOrPreviousPage(direction?: string): void {
    this.goToPage(direction === 'forward' ? this.currentPageSubject.value + 1 : this.currentPageSubject.value - 1);
  }

  // Get customer name from invoice (now included in response)
  getCustomerName(invoice: any): string {
    return invoice?.customerName || 'Customer';
  }

  // Get customer initial for avatar
  getCustomerInitial(invoice: any): string {
    const name = this.getCustomerName(invoice);
    return name ? name.charAt(0).toUpperCase() : 'C';
  }

  // Count invoices by status
  getPaidCount(state: State<CustomHttpResponse<Page<InvoiceModel> & UserModel>>): number {
    const data = state?.appData?.data as any;
    return data?.page?.content?.filter((i: InvoiceModel) => i.status === 'PAID').length || 0;
  }

  getPendingCount(state: State<CustomHttpResponse<Page<InvoiceModel> & UserModel>>): number {
    const data = state?.appData?.data as any;
    return data?.page?.content?.filter((i: InvoiceModel) => i.status === 'PENDING').length || 0;
  }

  getOverdueCount(state: State<CustomHttpResponse<Page<InvoiceModel> & UserModel>>): number {
    const data = state?.appData?.data as any;
    return data?.page?.content?.filter((i: InvoiceModel) => i.status === 'OVERDUE').length || 0;
  }

  // Navigate to create invoice
  createInvoice(): void {
    this.router.navigate(['/invoices/new']);
  }

  // View invoice detail
  viewInvoice(invoice: InvoiceModel): void {
    this.router.navigate(['/invoices', invoice.id, invoice.invoiceNumber]);
  }

  // Format currency for South African Rand
  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return 'R 0.00';
    return 'R ' + amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Send invoice to customer via email
  sendInvoice(invoice: any, event: Event): void {
    event.stopPropagation();
    this.isLoadingSubject.next(true);
    this.customerService.sendInvoice$(invoice.id)
      .subscribe({
        next: (response) => {
          this.notification.onSuccess(response.message || 'Invoice sent successfully');
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          this.notification.onError(error);
          this.isLoadingSubject.next(false);
        }
      });
  }
}
