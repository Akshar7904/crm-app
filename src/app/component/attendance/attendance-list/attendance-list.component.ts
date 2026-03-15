// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subject, takeUntil, catchError, of } from 'rxjs';
import { AttendanceService } from "../../../service/attendance.service";
import { EmployeeService } from "../../../service/employee.service";
import { HolidayService } from "../../../service/holiday.service";
import { AttendanceState, AttendanceType, EmployeeAttendance } from "../../../interface/attendance-state";
import { Employee } from '../../employee/employee.model';
import { CustomHttpResponse } from "../../../interface/appstates";

export interface WeekDay {
  num: number;
  month: number;
  year: number;
  dayName: string;
  label: string;
  isToday: boolean;
  isWeekend: boolean;
}

@Component({
  standalone: false,
  selector: 'app-attendance-list',
  templateUrl: './attendance-list.component.html',
  styleUrls: ['./attendance-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceListComponent implements OnInit, OnDestroy {
  attendanceState$!: Observable<AttendanceState>;
  private destroy$ = new Subject<void>();

  employees: Employee[] = [];
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  // Week-based view
  weekStart!: Date;
  weekEnd!: Date;
  weekDays: WeekDay[] = [];

  showEditModal = false;
  selectedEmployee: Employee | null = null;
  selectedDate: string = '';
  selectedDay: number = 0;

  searchQuery = '';
  holidayMap: { [dateKey: string]: string } = {};

  readonly AttendanceType = AttendanceType;

  constructor(
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private holidayService: HolidayService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.attendanceState$ = this.attendanceService.state$;
    this.initWeek();
    this.loadEmployees();
    this.loadWeekAttendance();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Week Initialisation

  private initWeek(): void {
    this.weekStart = this.getMonday(new Date());
    this.weekEnd = new Date(this.weekStart);
    this.weekEnd.setDate(this.weekStart.getDate() + 6);
    this.calculateWeekDays();
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0=Sun
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  }

  private calculateWeekDays(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.weekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.weekStart);
      date.setDate(this.weekStart.getDate() + i);
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

      this.weekDays.push({
        num: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        dayName: date.toLocaleDateString('en-ZA', { weekday: 'short' }),
        label: date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
        isToday: date.getTime() === today.getTime(),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    // Use week start month/year for API call
    this.selectedMonth = this.weekStart.getMonth() + 1;
    this.selectedYear = this.weekStart.getFullYear();
  }

  // ─── Navigation

  previousWeek(): void {
    const newStart = new Date(this.weekStart);
    newStart.setDate(newStart.getDate() - 7);
    this.weekStart = newStart;
    this.weekEnd = new Date(newStart);
    this.weekEnd.setDate(newStart.getDate() + 6);
    this.loadWeekAttendance();
  }

  nextWeek(): void {
    const newStart = new Date(this.weekStart);
    newStart.setDate(newStart.getDate() + 7);
    this.weekStart = newStart;
    this.weekEnd = new Date(newStart);
    this.weekEnd.setDate(newStart.getDate() + 6);
    this.loadWeekAttendance();
  }

  goToCurrentWeek(): void {
    this.weekStart = this.getMonday(new Date());
    this.weekEnd = new Date(this.weekStart);
    this.weekEnd.setDate(this.weekStart.getDate() + 6);
    this.loadWeekAttendance();
  }

  getWeekRangeLabel(): string {
    const startLabel = this.weekStart.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
    const endLabel = this.weekEnd.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startLabel} – ${endLabel}`;
  }

  // ─── Data Loading

  loadWeekAttendance(): void {
    this.calculateWeekDays();
    this.loadHolidaysForWeek();
    this.attendanceService.getMonthlyAttendance(this.selectedYear, this.selectedMonth)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading attendance:', error);
          return of({ data: { attendances: [] } });
        })
      )
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private loadHolidaysForWeek(): void {
    const startDate = this.formatDate(this.weekStart.getFullYear(), this.weekStart.getMonth() + 1, this.weekStart.getDate());
    const endDate = this.formatDate(this.weekEnd.getFullYear(), this.weekEnd.getMonth() + 1, this.weekEnd.getDate());

    this.holidayService.getHolidaysByDateRange$(startDate, endDate)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ data: { holidays: [] } } as any))
      )
      .subscribe(response => {
        this.holidayMap = {};
        const holidays = response?.data?.holidays || [];
        for (const h of holidays) {
          if (h.isActive) {
            this.holidayMap[h.holidayDate] = h.holidayName;
          }
        }
        this.cdr.markForCheck();
      });
  }

  getHolidayName(wd: WeekDay): string | null {
    const key = this.formatDate(wd.year, wd.month, wd.num);
    return this.holidayMap[key] || null;
  }

  // Keep the old method name as alias so the template retry button works
  loadMonthlyAttendance(): void {
    this.loadWeekAttendance();
  }

  private loadEmployees(): void {
    this.employeeService.employees$(0)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading employees:', error);
          return of({ data: { employees: [] } } as any);
        })
      )
      .subscribe((response: CustomHttpResponse<any>) => {
        const data = response?.data ?? {};
        const possibleArrays = [data.content, data.items, data.results, data.employees];
        const foundArray = possibleArrays.find(arr => Array.isArray(arr)) as Employee[] | undefined;
        this.employees = foundArray || [];
        this.cdr.markForCheck();
      });
  }

  // ─── Attendance Helpers

  getAttendanceTypeForDay(employeeAttendance: EmployeeAttendance, wd: WeekDay): AttendanceType | null {
    // Only return data for days in the loaded month
    if (wd.month !== this.selectedMonth) return null;
    const recorded = employeeAttendance.dailyAttendance[wd.num];
    if (recorded) return recorded;
    // Fall back to holiday if no specific record
    const key = this.formatDate(wd.year, wd.month, wd.num);
    if (this.holidayMap[key]) return AttendanceType.HOLIDAY;
    return null;
  }

  getAttendanceIcon(type: AttendanceType | null): string {
    if (!type) return '';
    return this.attendanceService.getAttendanceTypeIcon(type);
  }

  getAttendanceClass(type: AttendanceType | null, isWeekend: boolean): string {
    if (isWeekend && !type) return 'weekend';
    if (!type) return 'no-record';
    return this.attendanceService.getAttendanceTypeClass(type);
  }

  // ─── Modal

  openEditModal(employeeAttendance: EmployeeAttendance, wd: WeekDay): void {
    if (wd.month !== this.selectedMonth) return;
    const employee = this.employees.find(e => e.id === employeeAttendance.employeeId);
    if (employee) {
      this.selectedEmployee = employee;
      this.selectedDay = wd.num;
      this.selectedDate = this.formatDate(wd.year, wd.month, wd.num);
      this.showEditModal = true;
      this.cdr.markForCheck();
    }
  }

  openAddAttendanceModal(): void {
    this.selectedEmployee = null;
    this.selectedDay = 0;
    this.selectedDate = '';
    this.showEditModal = true;
    this.cdr.markForCheck();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedEmployee = null;
    this.selectedDate = '';
    this.selectedDay = 0;
    this.cdr.markForCheck();
  }

  onAttendanceSaved(): void {
    this.closeEditModal();
    this.loadWeekAttendance();
  }

  private formatDate(year: number, month: number, day: number): string {
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  }

  // ─── Filter / Search

  filterEmployees(attendances: EmployeeAttendance[]): EmployeeAttendance[] {
    if (!this.searchQuery.trim()) return attendances;
    const query = this.searchQuery.toLowerCase();
    return attendances.filter(att =>
      att.employeeName.toLowerCase().includes(query) ||
      att.employeeEmail.toLowerCase().includes(query) ||
      att.department?.toLowerCase().includes(query) ||
      att.designation?.toLowerCase().includes(query)
    );
  }

  trackById(index: number, item: any): any { return item?.employeeId ?? item?.id ?? index; }
  trackByValue(index: number, value: any): any { return value ?? index; }

  // ─── Export

  exporting = false;

  exportToExcel(): void {
    this.exporting = true;
    this.attendanceService.downloadAttendanceReport(this.selectedYear, this.selectedMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          this.exporting = false;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const monthStr = this.selectedMonth.toString().padStart(2, '0');
          link.download = `attendance-report-${this.selectedYear}-${monthStr}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.cdr.markForCheck();
        },
        error: () => {
          this.exporting = false;
          this.cdr.markForCheck();
        }
      });
  }

  exportToPDF(): void {
    this.attendanceService.downloadAttendancePdf(this.selectedYear, this.selectedMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const monthStr = this.selectedMonth.toString().padStart(2, '0');
          link.download = `attendance-report-${this.selectedYear}-${monthStr}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.cdr.markForCheck();
        },
        error: () => { this.cdr.markForCheck(); }
      });
  }
}
