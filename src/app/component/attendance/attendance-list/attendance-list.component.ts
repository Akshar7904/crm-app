import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subject, takeUntil, catchError, of, tap } from 'rxjs';
import { AttendanceService } from "../../../service/attendance.service";
import { EmployeeService } from "../../../service/employee.service";
import { AttendanceState, AttendanceType, EmployeeAttendance } from "../../../interface/attendance-state";
import { Employee } from '../../employee/employee.model';
import {CustomHttpResponse} from "../../../interface/appstates";

@Component({
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
  daysInMonth: number[] = [];

  showEditModal = false;
  selectedEmployee: Employee | null = null;
  selectedDate: string = '';
  selectedDay: number = 0;

  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  years: number[] = [];

  readonly AttendanceType = AttendanceType;

  constructor(
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeYears();
  }

  ngOnInit(): void {
    this.attendanceState$ = this.attendanceService.state$;
    this.loadEmployees();
    this.loadMonthlyAttendance();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
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

        // Safely check different possible array fields
        const possibleArrays = [
          data.content,
          data.items,
          data.results,
          data.employees
        ];

        const foundArray = possibleArrays.find(arr => Array.isArray(arr)) as Employee[] | undefined;

        this.employees = foundArray || [];
        this.cdr.markForCheck();
      });
  }


  loadMonthlyAttendance(): void {
    this.calculateDaysInMonth();

    this.attendanceService.getMonthlyAttendance(this.selectedYear, this.selectedMonth)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading monthly attendance:', error);
          return of({ data: { attendances: [] } });
        })
      )
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private calculateDaysInMonth(): void {
    const daysCount = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    this.daysInMonth = Array.from({ length: daysCount }, (_, i) => i + 1);
  }

  onMonthChange(month: number): void {
    this.selectedMonth = month;
    this.attendanceService.setSelectedMonth(month, this.selectedYear);
    this.loadMonthlyAttendance();
  }

  onYearChange(year: number): void {
    this.selectedYear = year;
    this.attendanceService.setSelectedMonth(this.selectedMonth, year);
    this.loadMonthlyAttendance();
  }

  getAttendanceType(employeeAttendance: EmployeeAttendance, day: number): AttendanceType | null {
    return employeeAttendance.dailyAttendance[day] || null;
  }

  getAttendanceIcon(type: AttendanceType | null): string {
    if (!type) return '';
    return this.attendanceService.getAttendanceTypeIcon(type);
  }

  getAttendanceClass(type: AttendanceType | null): string {
    if (!type) return 'no-record';
    return this.attendanceService.getAttendanceTypeClass(type);
  }

  openEditModal(employeeAttendance: EmployeeAttendance, day: number): void {
    const employee = this.employees.find(e => e.id === employeeAttendance.employeeId);
    if (employee) {
      this.selectedEmployee = employee;
      this.selectedDay = day;
      this.selectedDate = this.formatDate(this.selectedYear, this.selectedMonth, day);
      this.showEditModal = true;
      this.cdr.markForCheck();
    }
  }

  openAddAttendanceModal(): void {
    // Open modal without pre-selecting employee or date
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
    this.loadMonthlyAttendance();
  }

  private formatDate(year: number, month: number, day: number): string {
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  }

  getMonthName(month: number): string {
    return this.months.find(m => m.value === month)?.label || '';
  }

  // Navigation helpers
  previousMonth(): void {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.loadMonthlyAttendance();
  }

  nextMonth(): void {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.loadMonthlyAttendance();
  }

  goToToday(): void {
    const today = new Date();
    this.selectedMonth = today.getMonth() + 1;
    this.selectedYear = today.getFullYear();
    this.loadMonthlyAttendance();
  }

  // Filter and search
  searchQuery = '';

  filterEmployees(attendances: EmployeeAttendance[]): EmployeeAttendance[] {
    if (!this.searchQuery.trim()) {
      return attendances;
    }

    const query = this.searchQuery.toLowerCase();
    return attendances.filter(att =>
      att.employeeName.toLowerCase().includes(query) ||
      att.employeeEmail.toLowerCase().includes(query) ||
      att.department?.toLowerCase().includes(query) ||
      att.designation?.toLowerCase().includes(query)
    );
  }

  // Export functionality placeholder
  exportToExcel(): void {
    console.log('Export to Excel functionality to be implemented');
    // TODO: Implement Excel export
  }

  exportToPDF(): void {
    console.log('Export to PDF functionality to be implemented');
    // TODO: Implement PDF export
  }

  // protected readonly any = any;
}
