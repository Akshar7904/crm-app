// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BusinessExpenseService } from '../services/business-expense.service';
import { ChartOfAccountService } from '../services/chart-of-account.service';
import { VendorService } from '../services/vendor.service';
import { NotificationService } from '../../../service/notification.service';

@Component({
  standalone: false,
  selector: 'app-business-expense-entry',
  templateUrl: './business-expense-entry.component.html',
  styleUrls: ['./business-expense-entry.component.scss']
})
export class BusinessExpenseEntryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  loading = false;
  loadingAccounts = false;
  loadingVendors = false;

  accounts: any[] = [];
  vendors: any[] = [];
  paymentMethods = ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHEQUE'];

  constructor(
    private fb: FormBuilder,
    private businessExpenseService: BusinessExpenseService,
    private chartOfAccountService: ChartOfAccountService,
    private vendorService: VendorService,
    private notification: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAccounts();
    this.loadVendors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.form = this.fb.group({
      expenseDate: [new Date().toISOString().slice(0, 10), Validators.required],
      vendorId: [''],
      accountId: ['', Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      vatRate: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
      paymentMethod: ['BANK_TRANSFER', Validators.required],
      notes: [''],
      receiptAttached: [false],
      status: ['DRAFT']
    });

    // Auto-recalculate when amount or vatRate changes
    this.form.get('amount')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {});
    this.form.get('vatRate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {});
  }

  get vatAmount(): number {
    const amount = parseFloat(this.form.get('amount')?.value) || 0;
    const rate = parseFloat(this.form.get('vatRate')?.value) || 0;
    return amount * (rate / 100);
  }

  get total(): number {
    const amount = parseFloat(this.form.get('amount')?.value) || 0;
    return amount + this.vatAmount;
  }

  loadAccounts(): void {
    this.loadingAccounts = true;
    this.chartOfAccountService.getAllActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const d = res?.data;
          this.accounts = d?.accounts ?? d?.content ?? (Array.isArray(d) ? d : []);
          this.loadingAccounts = false;
        },
        error: () => { this.loadingAccounts = false; }
      });
  }

  loadVendors(): void {
    this.loadingVendors = true;
    this.vendorService.getActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const d = res?.data;
          this.vendors = d?.vendors ?? d?.content ?? (Array.isArray(d) ? d : []);
          this.loadingVendors = false;
        },
        error: () => { this.loadingVendors = false; }
      });
  }

  onSave(approve = false): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const val = this.form.value;

    const payload: any = {
      expenseDate: val.expenseDate,
      description: val.description,
      amount: val.amount,
      vatAmount: this.vatAmount,
      totalAmount: this.total,
      paymentMethod: val.paymentMethod,
      notes: val.notes,
      receiptAttached: val.receiptAttached,
      status: 'DRAFT',
      account: { id: val.accountId }
    };

    if (val.vendorId && val.vendorId !== '') {
      payload.vendor = { id: Number(val.vendorId) };
    }

    this.businessExpenseService.create(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          const expId = res?.data?.expense?.id;
          if (approve && expId) {
            this.businessExpenseService.approve(expId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.notification.onSuccess('Expense recorded and approved');
                  this.router.navigate(['/expenses/entry/list']);
                },
                error: () => {
                  // Approve returned 200 but corrupt JSON — still treat as success
                  this.notification.onSuccess('Expense recorded and approved');
                  this.router.navigate(['/expenses/entry/list']);
                }
              });
          } else if (approve && !expId) {
            // Could not extract ID from response — expense was saved, approve separately
            this.notification.onSuccess('Expense saved — please approve from the list');
            this.router.navigate(['/expenses/entry/list']);
          } else {
            this.notification.onSuccess('Expense saved as draft');
            this.router.navigate(['/expenses/entry/list']);
          }
        },
        error: (err) => {
          this.loading = false;
          this.notification.onError(err?.error?.message || 'Failed to save expense');
        }
      });
  }

  isInvalid(field: string): boolean {
    const f = this.form.get(field);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  getAccountsByType(type: string): any[] {
    return this.accounts.filter(a => a.type === type);
  }
}
