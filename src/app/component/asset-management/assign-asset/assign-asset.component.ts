// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Asset, AssetAssignmentForm, AssetCondition } from 'src/app/interface/asset';
import { AssetService } from 'src/app/service/asset.service';
import { NotificationService } from 'src/app/service/notification.service';
import { EmployeeService } from 'src/app/service/employee.service';

@Component({
  standalone: false,
  selector: 'app-assign-asset',
  templateUrl: './assign-asset.component.html',
  styleUrls: ['./assign-asset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignAssetComponent implements OnInit {
  assignmentForm: FormGroup;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  assetId: number;
  asset: Asset | null = null;
  employees: any[] = [];
  readonly conditions = Object.values(AssetCondition);
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private assetService: AssetService,
    private employeeService: EmployeeService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.getCurrentUser();
    this.assignmentForm = this.fb.group({
      employeeId: [null, Validators.required],
      expectedReturnDate: [''],
      conditionOnAssignment: [AssetCondition.GOOD, Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.assetId = +this.route.snapshot.params['assetId'];
    this.loadAsset();
    this.loadEmployees();
  }

  loadAsset(): void {
    this.isLoadingSubject.next(true);
    this.assetService.getAssetById(this.assetId).subscribe({
      next: (response) => {
        this.asset = (response.data as any)?.asset as Asset;
        this.isLoadingSubject.next(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
        this.router.navigate(['/assets']);
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.searchEmployees$().subscribe({
      next: (response: any) => {
        this.employees = response.data?.employees || [];
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.onError('Failed to load employees');
      }
    });
  }

  onSubmit(): void {
    if (this.assignmentForm.invalid) {
      Object.keys(this.assignmentForm.controls).forEach(key => {
        this.assignmentForm.get(key)?.markAsTouched();
      });
      this.notification.onError('Please select an employee');
      return;
    }

    const selectedEmployee = this.employees.find(e => e.id === this.assignmentForm.value.employeeId);
    if (!selectedEmployee) {
      this.notification.onError('Please select a valid employee');
      return;
    }

    const form: AssetAssignmentForm = {
      assetId: this.assetId,
      employeeId: selectedEmployee.id,
      employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      assignedById: this.currentUser?.id,
      assignedByName: `${this.currentUser?.firstName} ${this.currentUser?.lastName}`,
      expectedReturnDate: this.assignmentForm.value.expectedReturnDate || undefined,
      conditionOnAssignment: this.assignmentForm.value.conditionOnAssignment,
      notes: this.assignmentForm.value.notes || undefined
    };

    this.isLoadingSubject.next(true);
    this.assetService.assignAsset(form).subscribe({
      next: () => {
        this.notification.onSuccess('Asset assigned successfully');
        this.isLoadingSubject.next(false);
        this.router.navigate(['/assets', this.assetId]);
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/assets', this.assetId]);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.assignmentForm.get(field);
    return control ? control.invalid && control.touched : false;
  }

  private getCurrentUser(): any {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch {
      return null;
    }
  }
}
