// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Asset, AssetCategory, AssetCondition, AssetForm, AssetStatus } from 'src/app/interface/asset';
import { AssetService } from 'src/app/service/asset.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  standalone: false,
  selector: 'app-asset-form',
  templateUrl: './asset-form.component.html',
  styleUrls: ['./asset-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetFormComponent implements OnInit {
  assetForm: FormGroup;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  isEditMode = false;
  assetId: number | null = null;
  asset: Asset | null = null;

  readonly categories = Object.values(AssetCategory);
  readonly statuses = Object.values(AssetStatus);
  readonly conditions = Object.values(AssetCondition);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private assetService: AssetService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.assetForm = this.fb.group({
      assetTag: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category: [AssetCategory.LAPTOP, Validators.required],
      status: [AssetStatus.AVAILABLE, Validators.required],
      condition: [AssetCondition.NEW, Validators.required],
      brand: [''],
      model: [''],
      serialNumber: [''],
      purchaseDate: [''],
      purchasePrice: [null],
      warrantyExpiry: [''],
      location: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.assetId = this.route.snapshot.params['id'];
    if (this.assetId) {
      this.isEditMode = true;
      this.loadAsset();
    }
  }

  loadAsset(): void {
    this.isLoadingSubject.next(true);
    this.assetService.getAssetById(this.assetId!).subscribe({
      next: (response) => {
        this.asset = (response.data as any)?.asset as Asset;
        this.populateForm(this.asset);
        this.isLoadingSubject.next(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.onError(error?.error?.reason || error?.error?.message || 'Failed to load asset');
        this.isLoadingSubject.next(false);
        this.router.navigate(['/assets']);
      }
    });
  }

  populateForm(asset: Asset): void {
    this.assetForm.patchValue({
      assetTag: asset.assetTag,
      name: asset.name,
      description: asset.description || '',
      category: asset.category,
      status: asset.status,
      condition: asset.condition,
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      purchaseDate: asset.purchaseDate ? this.formatDateForInput(asset.purchaseDate) : '',
      purchasePrice: asset.purchasePrice || null,
      warrantyExpiry: asset.warrantyExpiry ? this.formatDateForInput(asset.warrantyExpiry) : '',
      location: asset.location || '',
      notes: asset.notes || ''
    });
  }

  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.assetForm.invalid) {
      Object.keys(this.assetForm.controls).forEach(key => {
        this.assetForm.get(key)?.markAsTouched();
      });
      this.notification.onError('Please fill in all required fields');
      return;
    }

    const formData: AssetForm = this.assetForm.value;
    this.isLoadingSubject.next(true);

    if (this.isEditMode) {
      this.assetService.updateAsset(this.assetId!, formData).subscribe({
        next: (response) => {
          this.notification.onSuccess('Asset updated successfully');
          this.isLoadingSubject.next(false);
          this.router.navigate(['/assets', this.assetId]);
        },
        error: (error) => {
          this.notification.onError(error?.error?.reason || error?.error?.message || 'Failed to update asset');
          this.isLoadingSubject.next(false);
        }
      });
    } else {
      this.assetService.createAsset(formData).subscribe({
        next: (response) => {
          this.notification.onSuccess('Asset created successfully');
          this.isLoadingSubject.next(false);
          const newAsset = (response.data as any)?.asset as Asset;
          this.router.navigate(['/assets', newAsset.id]);
        },
        error: (error) => {
          this.notification.onError(error?.error?.reason || error?.error?.message || 'Failed to create asset');
          this.isLoadingSubject.next(false);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/assets']);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.assetForm.get(field);
    return control ? control.invalid && control.touched : false;
  }
}
