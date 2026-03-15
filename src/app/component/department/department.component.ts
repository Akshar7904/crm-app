// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, map, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DepartmentService } from '../../service/department.service';
import { Department, DepartmentForm } from './department.model';
import { DepartmentState } from '../../interface/department-state';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmployeeService } from '../../service/employee.service';
import { Employee } from '../employee/employee.model';
import { NotificationService } from '../../service/notification.service';

/**
 * Department management component with real-time updates
 * Uses OnPush change detection for optimal performance
 */
@Component({
  standalone: false,
  selector: 'app-departments',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  departmentState: DepartmentState;
  departmentForm: FormGroup;
  searchForm: FormGroup;
  isEditMode = false;
  selectedDepartmentId: number | null = null;
  showDeleteConfirm = false;
  departmentToDelete: number | null = null;
  employees$: Observable<Employee[]>;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  // Employee list for expanded department
  expandedDepartmentId: number | null = null;
  departmentEmployees: Employee[] = [];
  loadingEmployees = false;

  constructor(
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private notification: NotificationService
  ) {
    this.departmentState = {
      departments: [],
      department: null,
      loading: false,
      error: null,
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10
    };

    // Initialize forms
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]],
      managerId: [null]
    });

    this.searchForm = this.fb.group({
      query: ['']
    });

    // Initialize employees observable
    this.employees$ = of([]);
  }

  ngOnInit(): void {
    // Subscribe to department state for real-time updates
    this.departmentService.departmentState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: any) => {
        this.departmentState = state;
        this.cdr.markForCheck(); // Trigger change detection
      });

    // Load employees for manager dropdown
    this.loadEmployees();

    // Load initial departments
    this.loadDepartments();

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
          this.loadDepartments(0);
        }
      });
  }

  /**
   * Load all employees for manager dropdown
   * Uses EmployeeService.employees$(page) method
   */
  loadEmployees(): void {
    console.log('👥 Loading employees for dropdown...');

    this.employees$ = this.employeeService.employees$(0).pipe(
      map((response: any) => {
        console.log('✅ Raw Employee response from service:', response);

        let employees: Employee[] = [];

        // The backend returns { data: { employees: [...], count: N } }
        if (response && response.data) {
          // Check for employees array first (backend returns this)
          if (response.data.employees && Array.isArray(response.data.employees)) {
            console.log('✓ Found: response.data.employees');
            employees = response.data.employees;
          } else if (response.data.content && Array.isArray(response.data.content)) {
            console.log('✓ Found: response.data.content');
            employees = response.data.content;
          } else if (Array.isArray(response.data)) {
            console.log('✓ Found: response.data (direct array)');
            employees = response.data;
          } else {
            console.log('❌ Unknown structure:', response.data);
          }
        }

        console.log('📊 Total employees found:', employees.length);

        // Filter only active employees for manager dropdown
        const activeEmployees = employees.filter((emp: Employee) => {
          const status = emp.status?.toLowerCase();
          return status === 'active';
        });

        console.log('✅ Active employees count:', activeEmployees.length);

        return activeEmployees;
      }),
      catchError(error => {
        console.error('❌ Error loading employees:', error);
        return of([]);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Load departments with pagination
   */
  loadDepartments(page: number = 0): void {
    this.currentPage = page;
    this.departmentService.getDepartments(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading departments:', error);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Search departments
   */
  onSearch(): void {
    const query = this.searchForm.get('query')?.value?.trim();

    if (query) {
      this.departmentService.searchDepartments(query, 0, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.currentPage = 0;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error searching departments:', error);
            this.cdr.markForCheck();
          }
        });
    } else {
      this.loadDepartments(0);
    }
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchForm.patchValue({ query: '' });
    this.loadDepartments(0);
  }

  /**
   * Open modal for creating new department
   */
  openCreateModal(content: any): void {
    this.isEditMode = false;
    this.selectedDepartmentId = null;
    this.departmentForm.reset();
    this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
  }

  /**
   * Open modal for editing department
   */
  openEditModal(content: any, department: Department): void {
    this.isEditMode = true;
    this.selectedDepartmentId = department.id || null;

    this.departmentForm.patchValue({
      name: department.name,
      description: department.description,
      managerId: department.managerId
    });

    this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
  }

  /**
   * Submit form (create or update)
   */
  onSubmit(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const formValue: DepartmentForm = {
      name: this.departmentForm.value.name?.trim(),
      description: this.departmentForm.value.description?.trim() || '',
      managerId: this.departmentForm.value.managerId || null
    };

    if (this.isEditMode && this.selectedDepartmentId) {
      this.updateDepartment(this.selectedDepartmentId, formValue);
    } else {
      this.createDepartment(formValue);
    }
  }

  /**
   * Create new department
   */
  private createDepartment(form: DepartmentForm): void {
    this.departmentService.createDepartment(form)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (department) => {
          console.log('Department created:', department);
          this.modalService.dismissAll();
          this.departmentForm.reset();
          this.loadDepartments(this.currentPage);
          this.showSuccessMessage('Department created successfully!');
        },
        error: (error) => {
          console.error('Error creating department:', error);
          this.showErrorMessage(error.error?.message || 'Failed to create department');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Update existing department
   */
  private updateDepartment(id: number, form: DepartmentForm): void {
    this.departmentService.updateDepartment(id, form)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (department) => {
          console.log('Department updated:', department);
          this.modalService.dismissAll();
          this.departmentForm.reset();
          this.loadDepartments(this.currentPage);
          this.showSuccessMessage('Department updated successfully!');
        },
        error: (error) => {
          console.error('Error updating department:', error);
          this.showErrorMessage(error.error?.message || 'Failed to update department');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Confirm delete
   */
  confirmDelete(id: number): void {
    this.departmentToDelete = id;
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  /**
   * Cancel delete
   */
  cancelDelete(): void {
    this.departmentToDelete = null;
    this.showDeleteConfirm = false;
    this.cdr.markForCheck();
  }

  /**
   * Delete department
   */
  deleteDepartment(): void {
    if (this.departmentToDelete === null) return;

    this.departmentService.deleteDepartment(this.departmentToDelete)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Department deleted');
          this.showDeleteConfirm = false;
          this.departmentToDelete = null;

          // Check if we need to go to previous page
          if (this.departmentState.departments.length === 1 && this.currentPage > 0) {
            this.loadDepartments(this.currentPage - 1);
          } else {
            this.loadDepartments(this.currentPage);
          }

          this.showSuccessMessage('Department deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting department:', error);
          this.showErrorMessage(error.error?.message || 'Failed to delete department. It may have associated employees.');
          this.showDeleteConfirm = false;
          this.departmentToDelete = null;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Change page
   */
  onPageChange(page: number): void {
    if (page < 0 || page >= this.departmentState.totalPages) return;
    this.loadDepartments(page);
  }

  /**
   * Change page size
   */
  onPageSizeChange(event: any): void {
    this.pageSize = parseInt(event.target.value, 10);
    this.loadDepartments(0);
  }

  /**
   * Get page numbers for pagination
   */
  getPages(): number[] {
    const totalPages = this.departmentState.totalPages;
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  /**
   * TrackBy function for performance optimization
   */
  trackByDepartmentId(index: number, department: Department): number {
    return department.id || index;
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.departmentForm.get(fieldName);
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
    const field = this.departmentForm.get(fieldName);
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
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.notification.onSuccess(message);
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    this.notification.onError(message);
  }

  /**
   * Toggle employee list for a department
   */
  toggleEmployeeList(departmentId: number): void {
    if (this.expandedDepartmentId === departmentId) {
      // Collapse if already expanded
      this.expandedDepartmentId = null;
      this.departmentEmployees = [];
    } else {
      // Expand and load employees
      this.expandedDepartmentId = departmentId;
      this.loadDepartmentEmployees(departmentId);
    }
    this.cdr.markForCheck();
  }

  /**
   * Load employees for a specific department
   */
  loadDepartmentEmployees(departmentId: number): void {
    this.loadingEmployees = true;
    this.departmentEmployees = [];
    this.cdr.markForCheck();

    this.employeeService.employeesByDepartment$(departmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Employees loaded for department:', response);
          // Handle different response structures
          if (response && response.data) {
            if (Array.isArray(response.data.employees)) {
              this.departmentEmployees = response.data.employees;
            } else if (Array.isArray(response.data)) {
              this.departmentEmployees = response.data;
            }
          }
          this.loadingEmployees = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('❌ Error loading employees:', error);
          this.notification.onError('Failed to load department employees');
          this.loadingEmployees = false;
          this.departmentEmployees = [];
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Check if department is expanded
   */
  isDepartmentExpanded(departmentId: number): boolean {
    return this.expandedDepartmentId === departmentId;
  }
}
