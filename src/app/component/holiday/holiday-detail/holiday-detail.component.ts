import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, catchError, map, startWith } from 'rxjs';
import { HolidayService } from '../../../service/holiday.service';
import { Holiday } from '../holiday.model';
import { DataState } from '../../../enum/datastate.enum';
import { NotificationService } from '../../../service/notification.service';


@Component({
  selector: 'app-holiday-detail',
  templateUrl: './holiday-detail.component.html',
  styleUrls: ['./holiday-detail.component.scss']
})
export class HolidayDetailComponent implements OnInit {
  holidayState$!: Observable<any>;
  holidayForm!: FormGroup;
  holidayId!: number;
  isSubmitting = false;
  isEditing = false;
  readonly DataState = DataState;
  minDate: string;

  constructor(
    private fb: FormBuilder,
    private holidayService: HolidayService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Get and validate ID from route
    const idParam = this.route.snapshot.paramMap.get('id');
    console.log('🔍 Route parameter received:', idParam);

    // Validate the ID parameter
    if (!idParam || idParam === 'null' || idParam === 'undefined' || idParam === 'NaN') {
      console.error('❌ Invalid or missing ID parameter:', idParam);
      this.notificationService.onError('Invalid holiday ID. Redirecting to holidays list.');
      this.router.navigate(['/holidays']);
      return;
    }

    // Convert to number and validate
    this.holidayId = Number(idParam);

    if (isNaN(this.holidayId) || this.holidayId <= 0) {
      console.error('❌ ID is not a valid number:', idParam, 'Converted to:', this.holidayId);
      this.notificationService.onError('Invalid holiday ID. Redirecting to holidays list.');
      this.router.navigate(['/holidays']);
      return;
    }

    console.log('✅ Valid holiday ID:', this.holidayId);

    // Initialize form and load data
    this.initForm();
    this.loadHoliday();
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

    // Disable form initially (view mode)
    this.holidayForm.disable();
  }

  /**
   * Load holiday data
   */
  loadHoliday(): void {
    console.log('🔵 Loading holiday with ID:', this.holidayId);

    this.holidayState$ = this.holidayService.getHoliday$(this.holidayId)
      .pipe(
        map(response => {
          console.log('🟢 Holiday loaded successfully:', response);
          const holiday = response.data.holiday;

          if (!holiday) {
            throw new Error('Holiday not found');
          }

          this.populateForm(holiday);
          return {
            dataState: DataState.LOADED,
            holiday: holiday
          };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: any) => {
          console.error('🔴 Error loading holiday:', error);
          this.notificationService.onError(error.message || 'Failed to load holiday');
          return of({
            dataState: DataState.ERROR,
            error: error.message || 'Failed to load holiday'
          });
        })
      );
  }

  /**
   * Populate form with holiday data
   */
  populateForm(holiday: Holiday): void {
    console.log('📝 Populating form with data:', holiday);
    this.holidayForm.patchValue({
      holidayName: holiday.holidayName,
      holidayDate: holiday.holidayDate,
      description: holiday.description || '',
      isRecurring: holiday.isRecurring,
      isActive: holiday.isActive,
      countryCode: holiday.countryCode
    });
  }

  /**
   * Enable edit mode
   */
  enableEditMode(): void {
    this.isEditing = true;
    this.holidayForm.enable();
  }

  /**
   * Cancel edit mode
   */
  cancelEdit(): void {
    this.isEditing = false;
    this.holidayForm.disable();
    this.loadHoliday(); // Reload original data
  }

  /**
   * Submit the form (update holiday)
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

    console.log('💾 Saving holiday:', holidayData);

    this.holidayService.updateHoliday$(this.holidayId, holidayData).subscribe({
      next: (response) => {
        console.log('✅ Holiday updated successfully');
        this.notificationService.onSuccess(response.message);
        this.isEditing = false;
        this.holidayForm.disable();
        this.loadHoliday();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('🔴 Error updating holiday:', error);
        this.notificationService.onError(error.message || 'Failed to update holiday');
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Delete holiday
   */
  deleteHoliday(): void {
    if (confirm('Are you sure you want to delete this holiday? This action cannot be undone.')) {
      this.isSubmitting = true;

      console.log('🗑️ Deleting holiday ID:', this.holidayId);

      this.holidayService.deleteHoliday$(this.holidayId).subscribe({
        next: (response) => {
          console.log('✅ Holiday deleted successfully');
          this.notificationService.onSuccess(response.message);
          this.router.navigate(['/holidays']);
        },
        error: (error) => {
          console.error('🔴 Error deleting holiday:', error);
          this.notificationService.onError(error.message || 'Failed to delete holiday');
          this.isSubmitting = false;
        }
      });
    }
  }

  /**
   * Go back to holidays list
   */
  goBack(): void {
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
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get day of week
   */
  getDayOfWeek(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { weekday: 'long' });
  }

  /**
   * Check if holiday is upcoming
   */
  isUpcoming(dateString: string): boolean {
    const holidayDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  }

  /**
   * Check if holiday is past
   */
  isPast(dateString: string): boolean {
    const holidayDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayDate < today;
  }

  /**
   * Update day of week when date changes
   */
  onDateChange(): void {
    const dateValue = this.holidayForm.get('holidayDate')?.value;
    if (dateValue) {
      const date = new Date(dateValue);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      console.log('📅 Selected day:', dayOfWeek);
    }
  }
}
