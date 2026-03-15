// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VendorService } from '../services/vendor.service';
import { NotificationService } from '../../../service/notification.service';

@Component({
  standalone: false,
  selector: 'app-vendors',
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.scss']
})
export class VendorsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  vendors: any[] = [];
  loading = false;
  showModal = false;
  isEdit = false;
  editId: number | null = null;
  form!: FormGroup;

  categories = ['SUPPLIER', 'CONTRACTOR', 'UTILITY', 'SERVICE_PROVIDER', 'LANDLORD', 'OTHER'];

  constructor(
    private fb: FormBuilder,
    private vendorService: VendorService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadVendors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.form = this.fb.group({
      vendorName: ['', Validators.required],
      category: ['SUPPLIER'],
      contactEmail: [''],
      phone: [''],
      address: [''],
      vatNumber: ['']
    });
  }

  loadVendors(): void {
    this.loading = true;
    this.vendorService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const d = res?.data;
          this.vendors = d?.vendors ?? d?.content ?? (Array.isArray(d) ? d : []);
          this.loading = false;
        },
        error: () => { this.loading = false; this.notification.onError('Failed to load vendors'); }
      });
  }

  openCreate(): void {
    this.isEdit = false;
    this.editId = null;
    this.form.reset({ category: 'SUPPLIER' });
    this.showModal = true;
  }

  openEdit(vendor: any): void {
    this.isEdit = true;
    this.editId = vendor.id;
    this.form.patchValue(vendor);
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const obs = this.isEdit
      ? this.vendorService.update(this.editId!, this.form.value)
      : this.vendorService.create(this.form.value);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notification.onSuccess(this.isEdit ? 'Vendor updated' : 'Vendor created');
        this.closeModal();
        this.loadVendors();
      },
      error: (err) => this.notification.onError(err?.error?.message || 'Failed to save vendor')
    });
  }

  toggle(vendor: any): void {
    this.vendorService.toggle(vendor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Optimistic local update — don't reload from server (server only returns active vendors)
          // Java boolean isActive serialises to JSON as "active"
          vendor.active = !vendor.active;
          this.notification.onDefault(`Vendor ${vendor.active ? 'activated' : 'deactivated'}`);
        },
        error: () => this.notification.onError('Failed to update vendor status')
      });
  }

  delete(vendor: any): void {
    if (!confirm(`Delete vendor "${vendor.vendorName}"? This cannot be undone.`)) return;
    this.vendorService.delete(vendor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notification.onSuccess('Vendor deleted');
          this.vendors = this.vendors.filter(v => v.id !== vendor.id);
        },
        error: (err) => this.notification.onError(err?.error?.message || 'Failed to delete vendor')
      });
  }

  isInvalid(field: string): boolean {
    const f = this.form.get(field);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }
}
