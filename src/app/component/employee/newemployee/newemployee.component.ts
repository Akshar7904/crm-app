import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from '../../../service/employee.service';
import { EmployeeForm, Designation, Department } from '../employee.model';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  standalone: false,
  selector: 'app-newemployee',
  templateUrl: './newemployee.component.html',
  styleUrls: ['./newemployee.component.scss']
})
export class NewemployeeComponent implements OnInit {
  employeeForm!: FormGroup;
  loading: boolean = false;
  error: string = '';
  success: string = '';

  // Dropdown options
  employmentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY'];
  genders = ['MALE', 'FEMALE', 'OTHER'];
  designations: Designation[] = [];
  departments: Department[] = [];

  // Loading states
  loadingDesignations: boolean = false;
  loadingDepartments: boolean = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router,
    private notification: NotificationService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadDesignations();
    this.loadDepartments();
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      dateOfBirth: [''],
      gender: [''],
      hireDate: ['', Validators.required],
      departmentId: [''],
      designationId: ['', Validators.required], // NOW REQUIRED
      designationTitle: [''],
      baseSalary: [0],
      employmentType: ['FULL_TIME', Validators.required],
      address: [''],
      city: [''],
      state: [''],
      country: ['South Africa'],
      postalCode: [''],
      emergencyContactName: [''],
      emergencyContactPhone: [''],
      bio: [''],
      accountType: ['']
    });
  }

  /**
   * Load designations from API
   */
  loadDesignations(): void {
    this.loadingDesignations = true;
    this.employeeService.designations$().subscribe({
      next: (response) => {
        if (response.data && response.data['designations']) {
          this.designations = response.data['designations'];
          console.log('Designations loaded:', this.designations.length);
        }
        this.loadingDesignations = false;
      },
      error: (error) => {
        console.error('Failed to load designations:', error);
        this.notification.onError('Failed to load designations');
        this.loadingDesignations = false;
      }
    });
  }

  onDesignationChange(event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    this.employeeForm.patchValue({
      designationTitle: selectedOption?.text?.trim() || ''
    });
  }

  /**
   * Load departments from API
   */
  loadDepartments(): void {
    this.loadingDepartments = true;
    this.employeeService.departments$().subscribe({
      next: (response) => {
        if (response.data && response.data['departments']) {
          this.departments = response.data['departments'];
          console.log('Departments loaded:', this.departments.length);
        }
        this.loadingDepartments = false;
      },
      error: (error) => {
        console.error('Failed to load departments:', error);
        this.notification.onError('Failed to load departments');
        this.loadingDepartments = false;
      }
    });
  }

  /**
   * Submit form - Create employee
   */
  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.markFormGroupTouched(this.employeeForm);
      this.error = 'Please fill in all required fields correctly';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const employeeData: EmployeeForm = this.employeeForm.value;

    // Use newEmployee$ method (matches the service)
    this.employeeService.newEmployee$(employeeData).subscribe({
      next: (response) => {
        this.loading = false;

        // Extract employee code from response
        let employeeCode = 'Employee';
        if (response.data && response.data['employee']) {
          const employee = response.data['employee'];
          employeeCode = employee.employeeId || employee.id || 'Employee';
        }

        this.success = `${employeeCode} created successfully!`;
        this.notification.onDefault(response.message || this.success);

        // Navigate to employees list after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/employees']);
        }, 2000);
      },
      error: (error) => {
        this.error = error || 'Failed to create employee';
        this.notification.onError(error);
        this.loading = false;
      }
    });
  }

  /**
   * Cancel and navigate back
   */
  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      this.router.navigate(['/employees']);
    }
  }

  /**
   * Mark all form fields as touched (for validation display)
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Check if field is invalid and should show error
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get error message for field
   */
  getFieldError(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'This field is required';
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      return `Minimum length is ${field.errors?.['minlength'].requiredLength} characters`;
    }
    return '';
  }
}
