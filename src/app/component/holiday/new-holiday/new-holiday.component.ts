// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HolidayService } from '../../../service/holiday.service';
import { NotificationService } from '../../../service/notification.service';


@Component({
  standalone: false,
  selector: 'app-new-holiday',
  templateUrl: './new-holiday.component.html',
  styleUrls: ['./new-holiday.component.scss']
})
export class NewHolidayComponent implements OnInit {
  holidayForm!: FormGroup;
  isSubmitting = false;
  minDate: string;

  constructor(
    private fb: FormBuilder,
    private holidayService: HolidayService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initialize the form
   */
  initForm(): void {
    this.holidayForm = this.fb.group({
      holidayName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      holidayDate: ['', [Validators.required]],
      description: ['', [Validators.maxLength(500)]],
      isRecurring: [false],
      isActive: [true],
      countryCode: ['ZA']
    });
  }

  /**
   * Submit the form
   */
  onSubmit(): void {
    if (this.holidayForm.invalid) {
      this.holidayForm.markAllAsTouched();
      this.notificationService.onWarning('Please fill in all required fields');
      return;
    }

    this.isSubmitting = true;
    const formData = this.holidayForm.value;

    // Calculate day of week from date
    const date = new Date(formData.holidayDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

    const holidayData = {
      ...formData,
      holidayDay: dayOfWeek
    };

    this.holidayService.createHoliday$(holidayData).subscribe({
      next: (response) => {
        this.notificationService.onSuccess(response.message);
        this.router.navigate(['/holidays']);
      },
      error: (error) => {
        this.notificationService.onError(error);
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Cancel and go back
   */
  onCancel(): void {
    this.router.navigate(['/holidays']);
  }

  /**
   * Check if field is invalid
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.holidayForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.holidayForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
    }
    if (field?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors?.['maxlength'].requiredLength} characters`;
    }

    return '';
  }

  /**
   * Get field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      holidayName: 'Holiday name',
      holidayDate: 'Holiday date',
      description: 'Description'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Update day of week when date changes
   */
  onDateChange(): void {
    const dateValue = this.holidayForm.get('holidayDate')?.value;
    if (dateValue) {
      const date = new Date(dateValue);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      console.log('Selected day:', dayOfWeek);
    }
  }
}
