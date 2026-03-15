// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChartOfAccountService } from '../services/chart-of-account.service';
import { NotificationService } from '../../../service/notification.service';

@Component({
  standalone: false,
  selector: 'app-chart-of-accounts',
  templateUrl: './chart-of-accounts.component.html',
  styleUrls: ['./chart-of-accounts.component.scss']
})
export class ChartOfAccountsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  accounts: any[] = [];
  loading = false;
  seeding = false;
  showModal = false;
  isEdit = false;
  editId: number | null = null;
  form!: FormGroup;

  accountTypes = ['INCOME', 'COGS', 'OPERATING_EXPENSE', 'OTHER_INCOME', 'OTHER_EXPENSE'];

  constructor(
    private fb: FormBuilder,
    private chartService: ChartOfAccountService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAccounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.form = this.fb.group({
      accountCode: ['', Validators.required],
      accountName: ['', Validators.required],
      type: ['OPERATING_EXPENSE', Validators.required],
      description: [''],
      sortOrder: [100]
    });
  }

  loadAccounts(): void {
    this.loading = true;
    this.chartService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const d = res?.data;
          this.accounts = d?.accounts ?? d?.content ?? (Array.isArray(d) ? d : []);
          this.loading = false;
        },
        error: () => { this.loading = false; this.notification.onError('Failed to load accounts'); }
      });
  }

  openCreate(): void {
    this.isEdit = false;
    this.editId = null;
    this.form.reset({ type: 'OPERATING_EXPENSE', sortOrder: 100 });
    this.showModal = true;
  }

  openEdit(account: any): void {
    this.isEdit = true;
    this.editId = account.id;
    this.form.patchValue(account);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const obs = this.isEdit
      ? this.chartService.update(this.editId!, this.form.value)
      : this.chartService.create(this.form.value);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notification.onSuccess(this.isEdit ? 'Account updated' : 'Account created');
        this.closeModal();
        this.loadAccounts();
      },
      error: (err) => this.notification.onError(err?.error?.message || 'Failed to save account')
    });
  }

  toggle(account: any): void {
    this.chartService.toggle(account.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          account.active = !account.active;
          this.notification.onDefault(`Account ${account.active ? 'activated' : 'deactivated'}`);
        },
        error: () => this.notification.onError('Failed to update account status')
      });
  }

  seedDefaults(): void {
    if (!confirm('This will seed 13 default chart of accounts. Continue?')) return;
    this.seeding = true;
    this.chartService.seedDefaults()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.seeding = false;
          const d = res?.data;
          this.accounts = d?.accounts ?? d?.content ?? (Array.isArray(d) ? d : []);
          this.notification.onSuccess('Default accounts seeded successfully');
        },
        error: () => { this.seeding = false; this.notification.onError('Failed to seed accounts'); }
      });
  }

  getTypeClass(type: string): string {
    const map: any = {
      INCOME: 'badge-income', COGS: 'badge-cogs',
      OPERATING_EXPENSE: 'badge-opex', OTHER_INCOME: 'badge-other', OTHER_EXPENSE: 'badge-other'
    };
    return map[type] || '';
  }

  delete(account: any): void {
    if (!confirm(`Delete account "${account.accountCode} - ${account.accountName}"? This cannot be undone.`)) return;
    this.chartService.delete(account.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notification.onSuccess('Account deleted');
          this.accounts = this.accounts.filter(a => a.id !== account.id);
        },
        error: (err) => this.notification.onError(err?.error?.message || 'Failed to delete account')
      });
  }

  isInvalid(field: string): boolean {
    const f = this.form.get(field);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }
}
