// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AssetCategory, AssetRequestForm, AssetRequestPriority, AssetRequestType } from 'src/app/interface/asset';
import { AssetService } from 'src/app/service/asset.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  standalone: false,
  selector: 'app-request-asset',
  templateUrl: './request-asset.component.html',
  styleUrls: ['./request-asset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestAssetComponent implements OnInit {
  requestForm: FormGroup;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  readonly categories = Object.values(AssetCategory);
  readonly requestTypes = Object.values(AssetRequestType);
  readonly priorities = Object.values(AssetRequestPriority);
  currentUser: any;

  readonly steps = [
    { num: 1, title: 'Submit Request',    desc: 'Fill in the form with a clear justification for the asset you need.' },
    { num: 2, title: 'Manager Review',    desc: 'Your manager will review the request and approve or reject it.' },
    { num: 3, title: 'Asset Assignment',  desc: 'If approved, IT admin will assign an available asset from inventory.' },
    { num: 4, title: 'Receive & Acknowledge', desc: "You'll receive the asset and confirm receipt." }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private assetService: AssetService,
    private notification: NotificationService
  ) {
    this.currentUser = this.getCurrentUser();
    this.requestForm = this.fb.group({
      assetCategory: [AssetCategory.LAPTOP, Validators.required],
      requestType: [AssetRequestType.NEW, Validators.required],
      priority: [AssetRequestPriority.NORMAL, Validators.required],
      purpose: ['', [Validators.required, Validators.minLength(10)]], // ADDED THIS FIELD
      justification: ['', [Validators.required, Validators.minLength(10)]],
      expectedReturnDate: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.requestForm.invalid) {
      Object.keys(this.requestForm.controls).forEach(key => {
        this.requestForm.get(key)?.markAsTouched();
      });
      this.notification.onError('Please fill in all required fields');
      return;
    }

    const form: AssetRequestForm = {
      requesterId: this.currentUser?.id,
      requesterName: `${this.currentUser?.firstName} ${this.currentUser?.lastName}`,
      assetCategory: this.requestForm.value.assetCategory,
      requestType: this.requestForm.value.requestType,
      priority: this.requestForm.value.priority,
      purpose: this.requestForm.value.purpose,
      justification: this.requestForm.value.justification,
      expectedReturnDate: this.requestForm.value.expectedReturnDate || undefined
    };

    this.isLoadingSubject.next(true);
    this.assetService.createRequest(form).subscribe({
      next: () => {
        this.notification.onSuccess('Asset request submitted successfully');
        this.isLoadingSubject.next(false);
        this.router.navigate(['/assets/my-requests']);
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/assets/my-assets']);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.requestForm.get(field);
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
