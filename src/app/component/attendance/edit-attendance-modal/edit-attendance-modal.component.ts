// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AttendanceService } from "../../../service/attendance.service";
import { AttendanceType, AttendanceForm } from '../../../interface/attendance-state';
import { catchError, of, finalize } from 'rxjs';
import { Employee} from "../../employee/employee.model";

@Component({
  standalone: false,
  selector: 'app-edit-attendance-modal',
  templateUrl: './edit-attendance-modal.component.html',
  styleUrls: ['./edit-attendance-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditAttendanceModalComponent implements OnInit {
  @Input() employee: Employee | null = null;
  @Input() date: string = '';
  @Input() employees: Employee[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  attendanceForm!: FormGroup;
  loading = false;
  error: string | null = null;
  existingAttendance: any = null;

  attendanceTypes = [
    { value: AttendanceType.FULL_DAY_PRESENT, label: 'Full Day Present', icon: '✓' },
    { value: AttendanceType.HALF_DAY_PRESENT, label: 'Half Day Present', icon: '◐' },
    { value: AttendanceType.FULL_DAY_ABSENCE, label: 'Full Day Absence', icon: '✗' },
    { value: AttendanceType.LATE_ARRIVAL, label: 'Late Arrival', icon: '⏰' },
    { value: AttendanceType.EARLY_DEPARTURE, label: 'Early Departure', icon: '⏱' },
    { value: AttendanceType.ON_LEAVE, label: 'On Leave', icon: 'L' },
    { value: AttendanceType.WEEKEND, label: 'Weekend', icon: 'W' },
    { value: AttendanceType.HOLIDAY, label: 'Holiday', icon: 'H' }
  ];

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.employee && this.date) {
      this.loadExistingAttendance();
    }
  }

  private initializeForm(): void {
    this.attendanceForm = this.fb.group({
      employeeId: [this.employee?.id || null, Validators.required],
      attendanceDate: [this.date || this.getTodayDate(), Validators.required],
      attendanceType: [AttendanceType.FULL_DAY_PRESENT, Validators.required],
      reason: [''],
      checkInTime: [''],
      checkOutTime: ['']
    });
  }

  private loadExistingAttendance(): void {
    if (!this.employee || !this.date) return;

    this.loading = true;
    this.attendanceService.getAttendanceByEmployeeAndDate(this.employee.id!, this.date)
      .pipe(
        catchError(error => {
          // Attendance doesn't exist yet, which is fine for new entries
          console.log('No existing attendance found, creating new record');
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(response => {
        if (response && response.data.attendance) {
          this.existingAttendance = response.data.attendance;
          this.patchFormWithExistingData(response.data.attendance);
        }
      });
  }

  private patchFormWithExistingData(attendance: any): void {
    this.attendanceForm.patchValue({
      employeeId: attendance.employeeId,
      attendanceDate: attendance.attendanceDate,
      attendanceType: attendance.attendanceType,
      reason: attendance.reason || '',
      checkInTime: this.formatDateTime(attendance.checkInTime),
      checkOutTime: this.formatDateTime(attendance.checkOutTime)
    });
  }

  private formatDateTime(dateTime: string | null): string {
    if (!dateTime) return '';
    // Convert ISO datetime to datetime-local format
    return dateTime.substring(0, 16);
  }

  onSubmit(): void {
    if (this.attendanceForm.invalid) {
      this.markFormGroupTouched(this.attendanceForm);
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.attendanceForm.value;
    const attendanceForm: AttendanceForm = {
      employeeId: formValue.employeeId,
      attendanceDate: formValue.attendanceDate,
      attendanceType: formValue.attendanceType,
      reason: formValue.reason || undefined,
      checkInTime: formValue.checkInTime ? new Date(formValue.checkInTime).toISOString() : undefined,
      checkOutTime: formValue.checkOutTime ? new Date(formValue.checkOutTime).toISOString() : undefined
    };

    const saveOperation = this.existingAttendance
      ? this.attendanceService.updateAttendanceByEmployeeAndDate(
        formValue.employeeId,
        formValue.attendanceDate,
        attendanceForm
      )
      : this.attendanceService.createAttendance(attendanceForm);

    saveOperation
      .pipe(
        catchError(error => {
          this.error = error.error?.message || 'Failed to save attendance';
          this.loading = false;
          this.cdr.markForCheck();
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(response => {
        if (response) {
          this.saved.emit();
        }
      });
  }

  onCancel(): void {
    this.close.emit();
  }

  onEmployeeChange(employeeId: number): void {
    const date = this.attendanceForm.get('attendanceDate')?.value;
    if (employeeId && date) {
      this.employee = this.employees.find(e => e.id === employeeId) || null;
      this.loadExistingAttendance();
    }
  }

  onDateChange(date: string): void {
    const employeeId = this.attendanceForm.get('employeeId')?.value;
    if (employeeId && date) {
      this.date = date;
      this.loadExistingAttendance();
    }
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.attendanceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.attendanceForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      employeeId: 'Employee',
      attendanceDate: 'Date',
      attendanceType: 'Attendance Type'
    };
    return labels[fieldName] || fieldName;
  }

  getEmployeeName(): string {
    if (!this.employee) return 'Select Employee';
    return `${this.employee.firstName} ${this.employee.lastName}`;
  }
}
