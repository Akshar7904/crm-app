// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DesignationService } from '../../service/designation.service';
import { Designation, DesignationForm, DesignationLevel } from './designation.model';
import { DesignationState } from '../../interface/designation-state';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

/**
 * Designation management component with real-time updates
 * Uses OnPush change detection for optimal performance
 */
@Component({
  standalone: false,
  selector: 'app-designations',
  templateUrl: './designation.component.html',
  styleUrls: ['./designation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  designationState: DesignationState;
  designationForm: FormGroup;
  searchForm: FormGroup;
  isEditMode = false;
  selectedDesignationId: number | null = null;
  showDeleteConfirm = false;
  designationToDelete: number | null = null;

  // Designation levels for dropdown
  designationLevels = Object.values(DesignationLevel);

  // Pagination
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private designationService: DesignationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal
  ) {
    this.designationState = {
      designations: [],
      designation: null,
      loading: false,
      error: null,
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10
    };

    // Initialize forms
    this.designationForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]],
      level: ['']
    });

    this.searchForm = this.fb.group({
      query: ['']
    });
  }

  ngOnInit(): void {
    // Subscribe to designation state for real-time updates
    this.designationService.designationState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: any) => {
        this.designationState = state;
        this.cdr.markForCheck(); // Trigger change detection
      });

    // Load initial designations
    this.loadDesignations();

    // Setup real-time search with debounce
    this.setupRealtimeSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Set up real-time search with debounce
   */
  private setupRealtimeSearch(): void {
    this.searchForm.get('query')?.valueChanges
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit when value changes
        takeUntil(this.destroy$)
      )
      .subscribe((query: any) => {
        if (query && query.trim()) {
          this.onSearch();
        } else {
          this.loadDesignations(0);
        }
      });
  }

  /**
   * Load designations with pagination
   */
  loadDesignations(page: number = 0): void {
    this.currentPage = page;
    this.designationService.getDesignations(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading designations:', error);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Search designations
   */
  onSearch(): void {
    const query = this.searchForm.get('query')?.value?.trim();

    if (query) {
      this.designationService.searchDesignations(query, 0, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.currentPage = 0;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error searching designations:', error);
            this.cdr.markForCheck();
          }
        });
    } else {
      this.loadDesignations(0);
    }
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchForm.patchValue({ query: '' });
    this.loadDesignations(0);
  }

  /**
   * Open modal for creating new designation
   */
  openCreateModal(content: any): void {
    this.isEditMode = false;
    this.selectedDesignationId = null;
    this.designationForm.reset();
    this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
  }

  /**
   * Open modal for editing designation
   */
  openEditModal(content: any, designation: Designation): void {
    this.isEditMode = true;
    this.selectedDesignationId = designation.id || null;

    this.designationForm.patchValue({
      title: designation.title,
      description: designation.description,
      level: designation.level
    });

    this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
  }

  /**
   * Submit form (create or update)
   */
  onSubmit(): void {
    if (this.designationForm.invalid) {
      this.designationForm.markAllAsTouched();
      return;
    }

    const formValue: DesignationForm = {
      title: this.designationForm.value.title?.trim(),
      description: this.designationForm.value.description?.trim() || '',
      level: this.designationForm.value.level || ''
    };

    if (this.isEditMode && this.selectedDesignationId) {
      this.updateDesignation(this.selectedDesignationId, formValue);
    } else {
      this.createDesignation(formValue);
    }
  }

  /**
   * Create new designation
   */
  private createDesignation(form: DesignationForm): void {
    this.designationService.createDesignation(form)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (designation) => {
          console.log('Designation created:', designation);
          this.modalService.dismissAll();
          this.designationForm.reset();
          this.loadDesignations(this.currentPage);
          this.showSuccessMessage('Designation created successfully!');
        },
        error: (error) => {
          console.error('Error creating designation:', error);
          this.showErrorMessage(error.error?.message || 'Failed to create designation');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Update existing designation
   */
  private updateDesignation(id: number, form: DesignationForm): void {
    this.designationService.updateDesignation(id, form)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (designation) => {
          console.log('Designation updated:', designation);
          this.modalService.dismissAll();
          this.designationForm.reset();
          this.loadDesignations(this.currentPage);
          this.showSuccessMessage('Designation updated successfully!');
        },
        error: (error) => {
          console.error('Error updating designation:', error);
          this.showErrorMessage(error.error?.message || 'Failed to update designation');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Confirm delete
   */
  confirmDelete(id: number): void {
    this.designationToDelete = id;
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  /**
   * Cancel delete
   */
  cancelDelete(): void {
    this.designationToDelete = null;
    this.showDeleteConfirm = false;
    this.cdr.markForCheck();
  }

  /**
   * Delete designation
   */
  deleteDesignation(): void {
    if (this.designationToDelete === null) return;

    this.designationService.deleteDesignation(this.designationToDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Designation deleted');
          this.showDeleteConfirm = false;
          this.designationToDelete = null;

          // Check if we need to go to previous page
          if (this.designationState.designations.length === 1 && this.currentPage > 0) {
            this.loadDesignations(this.currentPage - 1);
          } else {
            this.loadDesignations(this.currentPage);
          }

          this.showSuccessMessage('Designation deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting designation:', error);
          this.showErrorMessage(error.error?.message || 'Failed to delete designation. It may have associated employees.');
          this.showDeleteConfirm = false;
          this.designationToDelete = null;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Change page
   */
  onPageChange(page: number): void {
    if (page < 0 || page >= this.designationState.totalPages) return;
    this.loadDesignations(page);
  }

  /**
   * Change page size
   */
  onPageSizeChange(event: any): void {
    this.pageSize = parseInt(event.target.value, 10);
    this.loadDesignations(0);
  }

  /**
   * Get page numbers for pagination
   */
  getPages(): number[] {
    const totalPages = this.designationState.totalPages;
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  /**
   * TrackBy function for performance optimization
   */
  trackByDesignationId(index: number, designation: Designation): number {
    return designation.id || index;
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.designationForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.designationForm.get(fieldName);
    if (!field || !field.errors) return '';

    const fieldLabel = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');

    if (field.hasError('required')) {
      return `${fieldLabel} is required`;
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `${fieldLabel} must be at least ${minLength} characters`;
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `${fieldLabel} must not exceed ${maxLength} characters`;
    }
    return 'Invalid value';
  }

  /**
   * Format level for display
   */
  formatLevel(level: string): string {
    if (!level) return 'N/A';
    return level.charAt(0) + level.slice(1).toLowerCase();
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    // You can replace this with a toast notification service
    alert(message);
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    // You can replace this with a toast notification service
    alert(message);
  }

  protected readonly Math = Math;
}
