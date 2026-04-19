// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { UserService } from '../../../service/user.service';
import { InternAttendanceService } from '../../../service/intern-attendance.service';
import { NotificationService } from '../../../service/notification.service';
import { InternAttendance } from '../../../interface/intern-attendance';

@Component({
  selector: 'app-my-intern-attendance',
  templateUrl: './my-attendance.component.html',
  styleUrls: ['./my-attendance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyInternAttendanceComponent implements OnInit {
  private destroy$ = new Subject<void>();

  attendances: InternAttendance[] = [];
  activeTab = 'all';
  showForm = false;
  submitting = false;
  loading = false;
  loadingUser = true;
  submitError: string | null = null;
  attendanceForm: FormGroup;
  currentUser: any = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private userService: UserService,
    private internAttendanceService: InternAttendanceService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize form in constructor so template never sees undefined
    this.attendanceForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      numberOfDays: [{ value: 0, disabled: true }],
      institutionName: ['', Validators.required],
      subjectOrModule: [''],
      reason: ['']
    });
  }

  ngOnInit(): void {
    this.userService.profile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          // Profile response structure: { data: { user: {...} } }
          this.currentUser = res?.data?.user || res?.data || res;
          this.loadingUser = false;
          this.cdr.markForCheck();
          if (this.currentUser?.id) {
            this.loadMyAttendances(this.currentUser.id);
          }
        },
        error: () => { this.loadingUser = false; this.cdr.markForCheck(); }
      });
  }

  loadMyAttendances(userId: number): void {
    this.loading = true;
    this.internAttendanceService.getByEmployee(userId).subscribe({
      next: res => {
        this.attendances = res.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.attendanceForm.reset();
    }
  }

  onDateChange(): void {
    const start = this.attendanceForm.get('startDate')?.value;
    const end = this.attendanceForm.get('endDate')?.value;
    if (start && end) {
      const days = this.internAttendanceService.calculateBusinessDays(new Date(start), new Date(end));
      this.attendanceForm.patchValue({ numberOfDays: days }, { emitEvent: false });
    }
  }

  onSubmit(): void {
    this.attendanceForm.markAllAsTouched();
    if (this.attendanceForm.invalid) return;
    if (!this.currentUser?.id) {
      this.submitError = 'User profile not loaded. Please refresh and try again.';
      return;
    }
    this.submitError = null;
    this.submitting = true;
    const val = this.attendanceForm.getRawValue();
    this.internAttendanceService.createRequest({
      employeeId: this.currentUser.id,
      startDate: val.startDate,
      endDate: val.endDate,
      numberOfDays: val.numberOfDays || 1,
      institutionName: val.institutionName,
      subjectOrModule: val.subjectOrModule,
      reason: val.reason
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.showForm = false;
        this.attendanceForm.reset();
        this.cdr.markForCheck();
        this.notification.onSuccess('School attendance request submitted. An admin will review it shortly.');
        this.loadMyAttendances(this.currentUser.id);
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.error?.message || 'Failed to submit request. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  cancelRequest(id: number): void {
    if (!this.currentUser?.id) return;
    if (!confirm('Cancel this school attendance request?')) return;
    this.internAttendanceService.cancel(id, this.currentUser.id).subscribe({
      next: () => this.loadMyAttendances(this.currentUser.id),
      error: () => {}
    });
  }

  get filteredAttendances(): InternAttendance[] {
    if (this.activeTab === 'all') return this.attendances;
    return this.attendances.filter(a => a.status === this.activeTab);
  }

  get totalRequests(): number { return this.attendances.length; }
  get approvedCount(): number { return this.attendances.filter(a => a.status === 'APPROVED').length; }
  get pendingCount(): number { return this.attendances.filter(a => a.status === 'PENDING').length; }
  get approvedDays(): number {
    return this.attendances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + (a.numberOfDays || 0), 0);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'badge-soft-success';
      case 'PENDING':  return 'badge-soft-warning';
      case 'REJECTED': return 'badge-soft-danger';
      case 'CANCELLED': return 'badge-soft-secondary';
      default: return 'badge-soft-secondary';
    }
  }

  trackById = (index: number, item: any) => item.id;
}
