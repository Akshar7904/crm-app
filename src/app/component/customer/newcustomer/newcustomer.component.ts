// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse, Page } from 'src/app/interface/appstates';
import { CustomerModel } from 'src/app/component/customer/customer.model';
import { State } from 'src/app/interface/state';
import { Stats } from 'src/app/interface/stats';
import { UserModel } from 'src/app/component/profile/user.model';
import { CustomerService } from 'src/app/service/customer.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  standalone: false,
  selector: 'app-newcustomer',
  templateUrl: './newcustomer.component.html',
  styleUrls: ['./newcustomer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewcustomerComponent implements OnInit {
  newCustomerState$: Observable<State<CustomHttpResponse<Page<CustomerModel> & UserModel & Stats>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<Page<CustomerModel> & UserModel & Stats>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  readonly DataState = DataState;

  logoFile: File | null = null;
  logoPreview: string | null = null;
  private logoBase64: string | null = null;

  constructor(
    private customerService: CustomerService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.newCustomerState$ = this.customerService.customers$()
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          console.log(response);
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

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.notification.onError('Please select an image file (PNG, JPG or SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.notification.onError('Logo file must be 2 MB or smaller.');
      return;
    }
    this.logoFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.logoBase64 = reader.result as string;
      this.logoPreview = this.logoBase64;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  clearLogo(): void {
    this.logoFile = null;
    this.logoPreview = null;
    this.logoBase64 = null;
    this.cdr.markForCheck();
  }

  createCustomer(newCustomerForm: NgForm): void {
    this.isLoadingSubject.next(true);
    const data = { ...newCustomerForm.value, imageUrl: this.logoBase64 ?? null };

    this.newCustomerState$ = this.customerService.newCustomers$(data)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          console.log(response);
          newCustomerForm.reset({ status: 'ACTIVE', accountType: '', province: '' });
          this.clearLogo();
          this.isLoadingSubject.next(false);
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

}
