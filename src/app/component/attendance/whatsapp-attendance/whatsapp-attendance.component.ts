// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AttendanceService } from '../../../service/attendance.service';
import { Attendance } from '../../../interface/attendance-state';

@Component({
  standalone: false,
  selector: 'app-whatsapp-attendance',
  templateUrl: './whatsapp-attendance.component.html',
  styleUrls: ['./whatsapp-attendance.component.scss']
})
export class WhatsAppAttendanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  records: Attendance[] = [];
  filteredRecords: Attendance[] = [];
  isLoading = false;
  errorMessage = '';

  // Date range filter — default: last 30 days
  startDate: string;
  endDate: string;
  searchQuery = '';

  constructor(private attendanceService: AttendanceService) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadRecords();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRecords(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.attendanceService.getWhatsAppAttendance(this.startDate, this.endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.records = response.data?.attendances || [];
          this.applyFilter();
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err?.error?.reason || err?.error?.message || 'Failed to load WhatsApp attendance records';
          this.isLoading = false;
        }
      });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredRecords = [...this.records];
      return;
    }
    this.filteredRecords = this.records.filter(r =>
      (r.employeeName?.toLowerCase().includes(q)) ||
      (r.employeeEmail?.toLowerCase().includes(q)) ||
      (r.checkInLocation?.toLowerCase().includes(q)) ||
      (r.checkOutLocation?.toLowerCase().includes(q)) ||
      (r.status?.toLowerCase().includes(q))
    );
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  onDateChange(): void {
    this.loadRecords();
  }

  getGeofenceClass(location?: string): string {
    if (!location) return 'badge-soft-secondary';
    const loc = location.toLowerCase();
    if (loc.includes('at office') || loc.includes('office centre')) return 'badge-soft-success';
    if (loc.includes('outside office')) return 'badge-soft-danger';
    return 'badge-soft-info';
  }

  getGeofenceIcon(location?: string): string {
    if (!location) return 'bi-geo';
    const loc = location.toLowerCase();
    if (loc.includes('at office')) return 'bi-building-check';
    if (loc.includes('outside office')) return 'bi-building-x';
    return 'bi-geo-alt';
  }

  formatTime(dt: string | undefined): string {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(d: string | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'WORKING':     return 'badge-soft-success';
      case 'CLOCKED_OUT': return 'badge-soft-secondary';
      case 'ON_BREAK1':
      case 'ON_LUNCH':
      case 'ON_BREAK2':   return 'badge-soft-warning';
      default:            return 'badge-soft-info';
    }
  }

  countAtOffice(): number {
    return this.filteredRecords.filter(r =>
      r.checkInLocation?.toLowerCase().includes('at office')
    ).length;
  }

  countOutsideOffice(): number {
    return this.filteredRecords.filter(r =>
      r.checkInLocation?.toLowerCase().includes('outside office')
    ).length;
  }

  countNoLocation(): number {
    return this.filteredRecords.filter(r => !r.checkInLocation).length;
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'WORKING':     return 'Working';
      case 'CLOCKED_OUT': return 'Clocked Out';
      case 'ON_BREAK1':   return 'Tea Break 1';
      case 'ON_LUNCH':    return 'Lunch';
      case 'ON_BREAK2':   return 'Tea Break 2';
      default:            return status || '—';
    }
  }
}
