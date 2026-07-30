// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductCatalogService } from '../services/product-catalog.service';
import { ProductCatalog, ProductStats, ProductType } from '../models/product-catalog.model';
import { NotificationService } from '../../../service/notification.service';

@Component({
  standalone: false,
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {

  products: ProductCatalog[] = [];
  stats: ProductStats = { total: 0, active: 0, services: 0, products: 0, bundles: 0 };

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // UI state
  loading = false;
  submitting = false;
  searchTerm = '';
  activeFilter: ProductType | '' = '';

  // Modal
  showModal = false;
  isEditMode = false;
  editingId: number | null = null;

  productForm: FormGroup;

  readonly productTypes: { value: ProductType; label: string }[] = [
    { value: 'SERVICE', label: 'Service' },
    { value: 'PRODUCT', label: 'Product' },
    { value: 'BUNDLE', label: 'Bundle' }
  ];

  constructor(
    private productService: ProductCatalogService,
    private fb: FormBuilder,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      type: ['SERVICE', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      vatRate: [15.0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const obs$ = this.searchTerm
      ? this.productService.search$(this.searchTerm, this.currentPage, this.pageSize)
      : this.productService.products$(this.currentPage, this.pageSize);

    obs$.subscribe({
      next: (res: any) => {
        const pageData = res.data?.page;
        this.products = pageData?.content ?? [];
        this.totalPages = pageData?.totalPages ?? 0;
        this.totalElements = pageData?.totalElements ?? 0;
        if (res.data?.stats) { this.stats = res.data.stats; }
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
    this.currentPage = 0;
    this.loadProducts();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.productForm.reset({ type: 'SERVICE', vatRate: 15.0, isActive: true, unitPrice: 0 });
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openEdit(product: ProductCatalog): void {
    this.isEditMode = true;
    this.editingId = product.id ?? null;
    this.productForm.patchValue({
      code: product.code,
      name: product.name,
      description: product.description,
      type: product.type,
      unitPrice: product.unitPrice,
      vatRate: product.vatRate,
      isActive: product.isActive
    });
    // Disable code field in edit mode (immutable)
    this.productForm.get('code')?.disable();
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.productForm.get('code')?.enable();
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.productForm.invalid || this.submitting) return;

    this.submitting = true;
    const value = this.productForm.getRawValue();
    const payload: ProductCatalog = { ...value };
    if (this.isEditMode && this.editingId) { payload.id = this.editingId; }

    const obs$ = this.isEditMode
      ? this.productService.update$(payload)
      : this.productService.create$(payload);

    obs$.subscribe({
      next: () => {
        this.notification.onSuccess(this.isEditMode ? 'Product updated' : 'Product created');
        this.submitting = false;
        this.closeModal();
        this.loadProducts();
      },
      error: (err: any) => {
        this.notification.onError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleActive(product: ProductCatalog): void {
    this.productService.toggleActive$(product.id!).subscribe({
      next: () => {
        this.notification.onSuccess(`Product ${product.isActive ? 'deactivated' : 'activated'}`);
        this.loadProducts();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  deleteProduct(product: ProductCatalog): void {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    this.productService.delete$(product.id!).subscribe({
      next: () => {
        this.notification.onSuccess('Product deleted');
        this.loadProducts();
      },
      error: (err: any) => this.notification.onError(err)
    });
  }

  getTypeBadgeClass(type: ProductType): string {
    return { SERVICE: 'badge-soft-primary', PRODUCT: 'badge-soft-success', BUNDLE: 'badge-soft-warning' }[type] ?? 'badge-soft-secondary';
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}
