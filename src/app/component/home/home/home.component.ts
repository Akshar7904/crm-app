import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, BehaviorSubject, map, startWith, catchError, of, switchMap, forkJoin, interval, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { DataState } from 'src/app/enum/datastate.enum';
import { UserModel } from 'src/app/component/profile/user.model';
import { NotificationService } from 'src/app/service/notification.service';
import { DashboardService, DashboardStats, EmployeeDashboardStats } from 'src/app/service/dashboard.service';
import { HolidayService } from 'src/app/service/holiday.service';
import { AttendanceService } from 'src/app/service/attendance.service';
import { LeaveService } from 'src/app/service/leave.service';
import { AnnouncementService } from 'src/app/service/announcement.service';
import { ExpensesService } from 'src/app/component/expenses/services/expenses.service';
import { InternAttendanceService } from 'src/app/service/intern-attendance.service';
import { InternAttendance } from 'src/app/interface/intern-attendance';
import { Attendance } from 'src/app/interface/attendance-state';
import { Leave } from 'src/app/interface/leave-state';
import { Holiday } from 'src/app/component/holiday/holiday.model';
import { StatCard } from "../../../shared/stats-cards.component";
import { CalendarEvent } from "../../../shared/dashboard-calendar.component";


interface DashboardState {
  dataState: DataState;
  user?: UserModel;
  adminStats?: DashboardStats;
  employeeStats?: EmployeeDashboardStats;
  error?: string;
}

/**
 * Home Dashboard Component
 * Displays role-based dashboard with real holiday integration
 *
 * @author DeCode
 * @version 2.0.0
 * @since 2025-01-12
 */
@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  dashboardState$: Observable<DashboardState>;
  private stateSubject = new BehaviorSubject<DashboardState>({ dataState: DataState.LOADING });

  readonly DataState = DataState;

  // Current user
  currentUser: UserModel;
  isAdmin: boolean = false;
  isManager: boolean = false;
  isEmployee: boolean = false;

  // Stats cards
  statsCards: StatCard[] = [];

  // Charts
  attendanceChartData: any = null;
  leaveChartData: any = null;
  genderChartData: any = null;

  // New dashboard widgets
  recentAnnouncements: any[] = [];
  recentClockEvents: Attendance[] = [];
  financialSummary: any = null;
  currentYear: number = new Date().getFullYear();

  // Calendar
  upcomingEvents: CalendarEvent[] = [];
  calendarEvents: CalendarEvent[] = [];

  // Clock-in/out
  currentTime: string = '';
  currentDate: string = '';
  isClockedIn: boolean = false;
  isClockedOut: boolean = false;
  isClockingIn: boolean = false;
  clockInTime: string = '';
  clockOutTime: string = '';
  locationName: string = '';
  private clockSubscription: Subscription;

  // Break/lunch tracking
  currentStatus: string = '';
  break1Start: string = '';
  break1End: string = '';
  lunchStart: string = '';
  lunchEnd: string = '';
  break2Start: string = '';
  break2End: string = '';
  isOnBreak: boolean = false;
  breakType: string = '';
  breakLoading: boolean = false;
  breakElapsedSeconds: number = 0;
  private breakTimerSubscription: Subscription | null = null;

  constructor(
    private dashboardService: DashboardService,
    private holidayService: HolidayService,
    private attendanceService: AttendanceService,
    private leaveService: LeaveService,
    private announcementService: AnnouncementService,
    private expensesService: ExpensesService,
    private internAttendanceService: InternAttendanceService,
    private notification: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.startClock();
    this.checkClockInStatus();
  }

  ngOnDestroy(): void {
    if (this.clockSubscription) {
      this.clockSubscription.unsubscribe();
    }
    if (this.breakTimerSubscription) {
      this.breakTimerSubscription.unsubscribe();
    }
  }

  private startClock(): void {
    this.updateTime();
    this.clockSubscription = interval(1000).subscribe(() => {
      this.updateTime();
    });
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    this.currentDate = now.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.cdr.markForCheck();
  }

  private checkClockInStatus(): void {
    // First check localStorage for quick UI update
    const todayClockIn = localStorage.getItem('todayClockIn');
    if (todayClockIn) {
      const clockData = JSON.parse(todayClockIn);
      const today = new Date().toDateString();
      if (clockData.date === today) {
        this.isClockedIn = !clockData.clockedOut;
        this.isClockedOut = !!clockData.clockedOut;
        this.clockInTime = clockData.time;
        this.clockOutTime = clockData.checkOutTime || '';
      } else {
        localStorage.removeItem('todayClockIn');
      }
    }

    // Also check from backend for accurate status
    this.attendanceService.getTodayAttendance$().subscribe({
      next: (response) => {
        if (response.data?.attendance) {
          const attendance = response.data.attendance;
          this.isClockedIn = !!attendance.checkInTime;
          this.isClockedOut = !!attendance.checkOutTime;
          this.clockInTime = attendance.checkInTime ? this.formatTimeDisplay(attendance.checkInTime) : '';
          this.clockOutTime = attendance.checkOutTime ? this.formatTimeDisplay(attendance.checkOutTime) : '';
          // Load break/lunch state
          this.currentStatus = attendance.status || '';
          this.break1Start = attendance.break1Start || '';
          this.break1End = attendance.break1End || '';
          this.lunchStart = attendance.lunchStart || '';
          this.lunchEnd = attendance.lunchEnd || '';
          this.break2Start = attendance.break2Start || '';
          this.break2End = attendance.break2End || '';
          this.isOnBreak = ['ON_BREAK1', 'ON_LUNCH', 'ON_BREAK2'].includes(this.currentStatus);
          if (this.isOnBreak) {
            this.breakType = this.currentStatus === 'ON_BREAK1' ? 'BREAK1'
              : this.currentStatus === 'ON_LUNCH' ? 'LUNCH' : 'BREAK2';
            this.startBreakTimer();
          }
          // Update localStorage to match backend
          localStorage.setItem('todayClockIn', JSON.stringify({
            date: new Date().toDateString(),
            time: this.clockInTime,
            clockedOut: !!attendance.checkOutTime,
            checkOutTime: this.clockOutTime,
            attendanceId: attendance.id
          }));
          // Add to calendar
          this.addTodayAttendanceToCalendar(attendance);
          this.cdr.markForCheck();
        }
      },
      error: () => {
        // No attendance for today, that's ok
      }
    });
  }

  clockIn(): void {
    this.isClockingIn = true;
    this.getDeviceLocation().then(coords => {
      const now = new Date();
      const checkInTimeISO = now.toISOString();
      const checkInTime = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
      const locationLabel = coords
        ? `${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`
        : (this.locationName || undefined);

      this.attendanceService.clockIn$(
        checkInTimeISO,
        locationLabel,
        coords?.latitude,
        coords?.longitude
      ).subscribe({
        next: (response) => {
          this.isClockedIn = true;
          this.clockInTime = checkInTime;
          this.currentStatus = 'WORKING';
          localStorage.setItem('todayClockIn', JSON.stringify({
            date: now.toDateString(),
            time: this.clockInTime,
            clockedOut: false,
            attendanceId: response.data?.attendance?.id
          }));
          this.isClockingIn = false;
          this.notification.onSuccess('Clocked in successfully at ' + checkInTime);
          if (response.data?.attendance) {
            this.addTodayAttendanceToCalendar(response.data.attendance);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isClockingIn = false;
          this.notification.onError(error?.error?.reason || error?.error?.message || 'Failed to clock in');
          this.cdr.markForCheck();
        }
      });
    });
  }

  clockOut(): void {
    this.isClockingIn = true;
    this.getDeviceLocation().then(coords => {
      const now = new Date();
      const checkOutTimeISO = now.toISOString();
      const checkOutTime = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
      const locationLabel = coords
        ? `${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`
        : (this.locationName || undefined);

      this.attendanceService.clockOut$(
        checkOutTimeISO,
        locationLabel,
        coords?.latitude,
        coords?.longitude
      ).subscribe({
        next: (response) => {
          this.isClockedIn = false;
          this.isClockedOut = true;
          this.clockOutTime = checkOutTime;
          this.currentStatus = 'CLOCKED_OUT';
          const clockData = JSON.parse(localStorage.getItem('todayClockIn') || '{}');
          clockData.clockedOut = true;
          clockData.checkOutTime = checkOutTime;
          localStorage.setItem('todayClockIn', JSON.stringify(clockData));
          this.isClockingIn = false;
          this.notification.onSuccess('Clocked out successfully at ' + checkOutTime);
          if (response.data?.attendance) {
            this.addTodayAttendanceToCalendar(response.data.attendance);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isClockingIn = false;
          this.notification.onError(error?.error?.reason || error?.error?.message || 'Failed to clock out');
          this.cdr.markForCheck();
        }
      });
    });
  }

  /** Resolve the device's GPS coordinates, or null if unavailable/denied. */
  private getDeviceLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        ()  => resolve(null),
        { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
      );
    });
  }

  // ===== Break/Lunch Methods =====

  startBreak(type: string): void {
    this.breakLoading = true;
    this.attendanceService.startBreak$(type).subscribe({
      next: (response) => {
        const attendance = response.data?.attendance;
        this.currentStatus = attendance?.status || '';
        this.isOnBreak = true;
        this.breakType = type;
        if (type === 'BREAK1') this.break1Start = attendance?.break1Start || '';
        if (type === 'LUNCH') this.lunchStart = attendance?.lunchStart || '';
        if (type === 'BREAK2') this.break2Start = attendance?.break2Start || '';
        this.startBreakTimer();
        this.breakLoading = false;
        const label = type === 'LUNCH' ? 'Lunch break' : 'Tea break';
        this.notification.onSuccess(label + ' started');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.breakLoading = false;
        this.notification.onError(error?.error?.reason || error?.error?.message || 'Failed to start break');
        this.cdr.markForCheck();
      }
    });
  }

  endBreak(type: string): void {
    this.breakLoading = true;
    this.attendanceService.endBreak$(type).subscribe({
      next: (response) => {
        const attendance = response.data?.attendance;
        this.currentStatus = attendance?.status || 'WORKING';
        this.isOnBreak = false;
        this.breakType = '';
        if (type === 'BREAK1') this.break1End = attendance?.break1End || '';
        if (type === 'LUNCH') this.lunchEnd = attendance?.lunchEnd || '';
        if (type === 'BREAK2') this.break2End = attendance?.break2End || '';
        this.stopBreakTimer();
        this.breakLoading = false;
        const label = type === 'LUNCH' ? 'Lunch break' : 'Tea break';
        this.notification.onSuccess(label + ' ended');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.breakLoading = false;
        this.notification.onError(error?.error?.reason || error?.error?.message || 'Failed to end break');
        this.cdr.markForCheck();
      }
    });
  }

  private startBreakTimer(): void {
    this.breakElapsedSeconds = 0;
    this.stopBreakTimer();
    this.breakTimerSubscription = interval(1000).subscribe(() => {
      this.breakElapsedSeconds++;
      this.cdr.markForCheck();
    });
  }

  private stopBreakTimer(): void {
    if (this.breakTimerSubscription) {
      this.breakTimerSubscription.unsubscribe();
      this.breakTimerSubscription = null;
    }
    this.breakElapsedSeconds = 0;
  }

  getBreakElapsedTime(): string {
    const mins = Math.floor(this.breakElapsedSeconds / 60);
    const secs = this.breakElapsedSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getBreakMaxMinutes(): number {
    return this.breakType === 'LUNCH' ? 30 : 15;
  }

  isBreakOvertime(): boolean {
    return this.breakElapsedSeconds > this.getBreakMaxMinutes() * 60;
  }

  canStartBreak(type: string): boolean {
    const now = new Date();
    const hour = now.getHours();
    if (type === 'BREAK1') return hour >= 10;
    if (type === 'LUNCH') return hour >= 12;
    if (type === 'BREAK2') return hour >= 15;
    return false;
  }

  getBreakTimeThreshold(type: string): string {
    if (type === 'BREAK1') return '10:00';
    if (type === 'LUNCH') return '12:00';
    if (type === 'BREAK2') return '15:00';
    return '';
  }

  isBreakStarted(type: string): boolean {
    if (type === 'BREAK1') return !!this.break1Start;
    if (type === 'LUNCH') return !!this.lunchStart;
    if (type === 'BREAK2') return !!this.break2Start;
    return false;
  }

  isBreakEnded(type: string): boolean {
    if (type === 'BREAK1') return !!this.break1End;
    if (type === 'LUNCH') return !!this.lunchEnd;
    if (type === 'BREAK2') return !!this.break2End;
    return false;
  }

  getStatusLabel(): string {
    switch (this.currentStatus) {
      case 'WORKING': return 'Working';
      case 'ON_BREAK1': return 'On Tea Break 1';
      case 'ON_LUNCH': return 'On Lunch';
      case 'ON_BREAK2': return 'On Tea Break 2';
      case 'CLOCKED_OUT': return 'Clocked Out';
      default: return '';
    }
  }

  /**
   * Add today's attendance to the calendar
   */
  /**
   * Format ISO datetime or time string to HH:mm display
   */
  private formatTimeDisplay(timeStr: string): string {
    if (!timeStr) return '';
    try {
      // Try parsing as ISO datetime
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    // If already HH:mm format, return as is
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    return timeStr;
  }

  private addTodayAttendanceToCalendar(attendance: any): void {
    const today = new Date().toISOString().split('T')[0];

    // Remove existing today's attendance from calendar if any
    this.calendarEvents = this.calendarEvents.filter(e =>
      !(e.type === 'attendance' && e.date === today) &&
      !(e.metadata?.isAttendance && e.date === today)
    );
    this.upcomingEvents = this.upcomingEvents.filter(e =>
      !(e.type === 'attendance' && e.date === today) &&
      !(e.metadata?.isAttendance && e.date === today)
    );

    // Create calendar event for today's attendance
    const attendanceEvent: CalendarEvent = {
      id: attendance.id,
      title: attendance.checkOutTime
        ? `Attendance: ${attendance.checkInTime} - ${attendance.checkOutTime}`
        : `Clocked In: ${attendance.checkInTime}`,
      date: today,
      type: 'attendance',
      description: attendance.checkOutTime
        ? `Working hours: ${attendance.checkInTime} to ${attendance.checkOutTime}`
        : `Clocked in at ${attendance.checkInTime}. Not yet clocked out.`,
      status: attendance.attendanceType,
      metadata: {
        isAttendance: true,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        attendanceType: attendance.attendanceType
      }
    };

    // Add to calendar events
    this.calendarEvents = [attendanceEvent, ...this.calendarEvents];
    this.upcomingEvents = [attendanceEvent, ...this.upcomingEvents.filter(e => e.type !== 'attendance' && !e.metadata?.isAttendance)];

    this.cdr.markForCheck();
  }

  private loadDashboard(): void {
    this.dashboardState$ = of(null).pipe(
      switchMap(() => {
        const userString = localStorage.getItem('user');
        if (!userString) {
          throw new Error('No user found. Please login again.');
        }

        this.currentUser = JSON.parse(userString);
        this.determineUserRole();

        return of({ dataState: DataState.LOADING, user: this.currentUser });
      }),
      switchMap(state => {
        if (this.isAdmin || this.isManager) {
          return this.loadAdminDashboard(state.user);
        } else {
          return this.loadEmployeeDashboard(state.user);
        }
      }),
      startWith({ dataState: DataState.LOADING }),
      catchError((error: any) => {
        console.error('Dashboard error:', error);
        this.notification.onError(error.message || 'Failed to load dashboard');
        return of({
          dataState: DataState.ERROR,
          error: error.message || 'Failed to load dashboard'
        });
      })
    );
  }

  private loadAdminDashboard(user: UserModel): Observable<DashboardState> {
    // Calculate date range for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startDate = this.formatDateISO(startOfMonth);
    const endDate = this.formatDateISO(endOfMonth);

    return forkJoin({
      stats: this.dashboardService.getAdminDashboardStats(),
      holidays: this.holidayService.getUpcomingHolidays$(10),
      attendance: this.attendanceService.getAttendanceByDateRange(startDate, endDate),
      leaves: this.leaveService.getAllLeaves(0, 200, 'startDate', 'DESC'),
      announcements: this.announcementService.getAnnouncements$(0, 5).pipe(catchError(() => of(null))),
      financial: this.expensesService.getSummary(now.getFullYear(), now.getMonth() + 1).pipe(catchError(() => of(null))),
      internSchoolDays: this.internAttendanceService.getByDateRange(startDate, endDate).pipe(catchError(() => of([])))
    }).pipe(
      map(({ stats, holidays, attendance, leaves, announcements, financial, internSchoolDays }) => {
        const dashboardStats = stats.data.stats;
        this.buildAdminStatsCards(dashboardStats);
        this.buildAdminCharts(dashboardStats);
        this.buildAdminCalendar(
          holidays.data.holidays,
          attendance.data?.attendances || [],
          leaves || [],
          internSchoolDays || []
        );
        this.recentAnnouncements = announcements?.data?.announcements || [];
        this.financialSummary = financial?.data || null;
        const today = new Date().toISOString().split('T')[0];
        this.recentClockEvents = (attendance.data?.attendances || [])
          .filter((a: Attendance) => a.attendanceDate === today && a.checkInTime)
          .sort((a: Attendance, b: Attendance) =>
            new Date(b.checkInTime!).getTime() - new Date(a.checkInTime!).getTime()
          )
          .slice(0, 15);
        this.cdr.markForCheck();

        return {
          dataState: DataState.LOADED,
          user,
          adminStats: dashboardStats
        };
      }),
      catchError(error => {
        console.error('Admin dashboard error:', error);
        this.notification.onError(error?.error?.reason || error?.error?.message || 'Failed to load admin dashboard');
        return of({
          dataState: DataState.ERROR,
          user,
          error: error?.error?.reason || error?.error?.message || 'Failed to load admin dashboard'
        });
      })
    );
  }

  private loadEmployeeDashboard(user: UserModel): Observable<DashboardState> {
    const employeeId = user.id;

    return forkJoin({
      stats: this.dashboardService.getEmployeeDashboardStats(employeeId),
      holidays: this.holidayService.getUpcomingHolidays$(5)
    }).pipe(
      map(({ stats, holidays }) => {
        const employeeStats = stats.data.stats;
        this.buildEmployeeStatsCards(employeeStats);
        this.buildEmployeeCharts(employeeStats);
        this.buildEmployeeCalendar(employeeStats, holidays.data.holidays);
        this.cdr.markForCheck();

        return {
          dataState: DataState.LOADED,
          user,
          employeeStats: employeeStats
        };
      }),
      catchError(error => {
        console.error('Employee dashboard error:', error);
        this.notification.onError(error?.error?.reason || error?.error?.message || 'Failed to load employee dashboard');
        return of({
          dataState: DataState.ERROR,
          user,
          error: error || 'Failed to load employee dashboard'
        });
      })
    );
  }

  private determineUserRole(): void {
    const role = this.currentUser?.roleName;
    this.isAdmin = role === 'ROLE_ADMIN' || role === 'ROLE_SYSADMIN';
    this.isManager = role === 'ROLE_MANAGER';
    this.isEmployee = role === 'ROLE_USER';
  }

  // ===== Admin Dashboard Builders =====

  private buildAdminStatsCards(stats: DashboardStats): void {
    this.statsCards = [
      {
        label: 'Total Employees',
        value: stats.totalEmployees || 0,
        icon: 'bi-people-fill',
        iconClass: 'primary',
        route: '/employee'
      },
      {
        label: 'Present Today',
        value: stats.presentToday || 0,
        icon: 'bi-check-circle-fill',
        iconClass: 'success',
        route: '/attendance'
      },
      {
        label: 'Absent Today',
        value: stats.absentToday || 0,
        icon: 'bi-x-circle-fill',
        iconClass: 'danger',
        route: '/attendance'
      },
      {
        label: 'Late Coming',
        value: stats.lateComingToday || 0,
        icon: 'bi-clock-history',
        iconClass: 'warning',
        route: '/attendance'
      },
      {
        label: 'On Leave',
        value: stats.onLeaveToday || 0,
        icon: 'bi-calendar-x',
        iconClass: 'info',
        route: '/admin/leave'
      },
      {
        label: 'Pending Leave Requests',
        value: stats.pendingLeaveRequests || 0,
        icon: 'bi-hourglass-split',
        iconClass: 'warning',
        route: '/admin/leave'
      },
      {
        label: 'Active Clients',
        value: stats.totalCustomers || 0,
        icon: 'bi-briefcase-fill',
        iconClass: 'primary',
        route: '/customers'
      },
      {
        label: 'Total Invoices',
        value: stats.totalInvoices || 0,
        icon: 'bi-file-earmark-text-fill',
        iconClass: 'info',
        route: '/invoices'
      }
    ];
  }

  private buildAdminCharts(stats: DashboardStats): void {
    // Gender Distribution Chart
    this.genderChartData = {
      labels: ['Male', 'Female'],
      datasets: [{
        label: 'Employee Distribution',
        data: [stats.maleEmployees || 0, stats.femaleEmployees || 0],
        backgroundColor: ['#98BDFF', '#F3797E'],
        borderColor: ['#7978E9', '#E84A5F'],
        borderWidth: 2
      }]
    };

    // Attendance Overview Chart
    this.attendanceChartData = {
      labels: ['Present', 'Absent', 'Late', 'On Leave'],
      datasets: [{
        label: 'Today\'s Attendance',
        data: [
          stats.presentToday || 0,
          stats.absentToday || 0,
          stats.lateComingToday || 0,
          stats.onLeaveToday || 0
        ],
        backgroundColor: [
          'rgba(75, 73, 172, 0.8)',
          'rgba(243, 121, 126, 0.8)',
          'rgba(255, 217, 61, 0.8)',
          'rgba(121, 120, 233, 0.8)'
        ],
        borderColor: [
          '#4B49AC',
          '#E84A5F',
          '#F7971E',
          '#7978E9'
        ],
        borderWidth: 2
      }]
    };

    // Leave Statistics Chart
    this.leaveChartData = {
      labels: ['Pending', 'Approved', 'On Leave'],
      datasets: [{
        label: 'Leave Management',
        data: [
          stats.pendingLeaveRequests || 0,
          stats.approvedLeavesThisMonth || 0,
          stats.onLeaveToday || 0
        ],
        backgroundColor: 'rgba(121, 120, 233, 0.6)',
        borderColor: '#7978E9',
        borderWidth: 2
      }]
    };
  }

  /**
   * Build admin calendar with holidays, attendance, and leave data
   */
  private buildAdminCalendar(holidays: Holiday[], attendances: Attendance[], leaves: Leave[], internSchoolDays: InternAttendance[] = []): void {
    this.upcomingEvents = [];

    // Add holidays
    if (holidays && holidays.length > 0) {
      const holidayEvents: CalendarEvent[] = holidays.map(holiday => ({
        id: holiday.id,
        title: holiday.holidayName,
        date: holiday.holidayDate,
        type: 'holiday' as const,
        description: holiday.description,
        isRecurring: holiday.isRecurring,
        countryCode: holiday.countryCode,
        metadata: {
          isPublicHoliday: holiday.countryCode === 'ZA' && holiday.isRecurring,
          isCustomHoliday: !holiday.isRecurring || holiday.countryCode !== 'ZA'
        }
      }));
      this.upcomingEvents.push(...holidayEvents);
    }

    // Add attendance records (grouped per employee per day)
    if (attendances && attendances.length > 0) {
      const attendanceEvents: CalendarEvent[] = attendances.map(att => {
        const checkIn = att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '';
        const checkOut = att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '';
        const timeStr = checkIn ? (checkOut ? `${checkIn} - ${checkOut}` : `${checkIn} (still in)`) : '';

        return {
          id: att.id,
          title: `${att.employeeName || 'Employee'} ${timeStr}`,
          date: att.attendanceDate,
          type: 'attendance' as const,
          status: att.status,
          description: att.checkInLocation || '',
          metadata: {
            isAttendance: true,
            checkInTime: att.checkInTime,
            checkOutTime: att.checkOutTime,
            attendanceType: att.attendanceType,
            employeeName: att.employeeName,
            employeeEmail: att.employeeEmail,
            status: att.status,
            checkInLocation: att.checkInLocation,
            checkOutLocation: att.checkOutLocation,
            totalWorkHours: att.totalWorkHours,
            break1Start: att.break1Start,
            break1End: att.break1End,
            lunchStart: att.lunchStart,
            lunchEnd: att.lunchEnd,
            break2Start: att.break2Start,
            break2End: att.break2End
          }
        };
      });
      this.upcomingEvents.push(...attendanceEvents);
    }

    // Add leave records
    if (leaves && leaves.length > 0) {
      const leaveEvents: CalendarEvent[] = [];
      for (const leave of leaves) {
        if (leave.status === 'APPROVED' || leave.status === 'PENDING') {
          // Create an event for each day of the leave
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            leaveEvents.push({
              id: leave.id,
              title: `${leave.employeeName || 'Employee'} - ${leave.leaveTypeDescription || leave.leaveType}`,
              date: this.formatDateISO(new Date(d)),
              type: 'leave' as const,
              status: leave.status,
              description: leave.reason || '',
              metadata: {
                employeeName: leave.employeeName,
                leaveType: leave.leaveType,
                leaveStatus: leave.status,
                numberOfDays: leave.numberOfDays
              }
            });
          }
        }
      }
      this.upcomingEvents.push(...leaveEvents);
    }

    // Add approved intern school days
    if (internSchoolDays && internSchoolDays.length > 0) {
      for (const ia of internSchoolDays) {
        if (ia.status !== 'APPROVED') continue;
        const start = new Date(ia.startDate);
        const end = new Date(ia.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          this.upcomingEvents.push({
            id: ia.id,
            title: `${ia.employeeName || 'Intern'} — ${ia.institutionName || 'School Day'}`,
            date: this.formatDateISO(new Date(d)),
            type: 'intern-school' as const,
            status: 'APPROVED',
            description: ia.subjectOrModule || ia.reason || '',
            metadata: {
              employeeName: ia.employeeName,
              institutionName: ia.institutionName,
              subjectOrModule: ia.subjectOrModule,
              numberOfDays: ia.numberOfDays
            }
          });
        }
      }
    }

    // Sort by date
    this.upcomingEvents.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    this.calendarEvents = [...this.upcomingEvents];
  }

  private formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ===== Employee Dashboard Builders =====

  private buildEmployeeStatsCards(stats: EmployeeDashboardStats): void {
    this.statsCards = [
      {
        label: 'Present Days',
        value: stats.presentDays || 0,
        icon: 'bi-check-circle-fill',
        iconClass: 'success',
        route: '/attendance/my'
      },
      {
        label: 'Absent Days',
        value: stats.absentDays || 0,
        icon: 'bi-x-circle-fill',
        iconClass: 'danger',
        route: '/attendance/my'
      },
      {
        label: 'Late Days',
        value: stats.lateDays || 0,
        icon: 'bi-clock-history',
        iconClass: 'warning',
        route: '/attendance/my'
      },
      {
        label: 'Attendance Rate',
        value: Math.round(stats.attendancePercentage || 0),
        icon: 'bi-graph-up',
        iconClass: 'info'
      },
      {
        label: 'Annual Leave',
        value: stats.leaveBalance?.annual || 0,
        icon: 'bi-calendar-check',
        iconClass: 'primary',
        route: '/employee/leave'
      },
      {
        label: 'Sick Leave',
        value: stats.leaveBalance?.sick || 0,
        icon: 'bi-heart-pulse',
        iconClass: 'danger',
        route: '/employee/leave'
      },
      {
        label: 'Pending Requests',
        value: stats.pendingLeaveRequests || 0,
        icon: 'bi-hourglass-split',
        iconClass: 'warning',
        route: '/employee/leave'
      },
      {
        label: 'Total Leave Balance',
        value: stats.leaveBalance?.total || 0,
        icon: 'bi-calendar-week',
        iconClass: 'info',
        route: '/employee/leave'
      }
    ];
  }

  private buildEmployeeCharts(stats: EmployeeDashboardStats): void {
    // Attendance Distribution Chart
    this.attendanceChartData = {
      labels: ['Present', 'Absent', 'Late'],
      datasets: [{
        label: 'My Attendance',
        data: [
          stats.presentDays || 0,
          stats.absentDays || 0,
          stats.lateDays || 0
        ],
        backgroundColor: [
          'rgba(75, 73, 172, 0.8)',
          'rgba(243, 121, 126, 0.8)',
          'rgba(255, 217, 61, 0.8)'
        ],
        borderColor: ['#4B49AC', '#E84A5F', '#F7971E'],
        borderWidth: 2
      }]
    };

    // Leave Balance Chart
    this.leaveChartData = {
      labels: ['Annual', 'Sick', 'Unpaid'],
      datasets: [{
        label: 'Leave Balance',
        data: [
          stats.leaveBalance?.annual || 0,
          stats.leaveBalance?.sick || 0,
          stats.leaveBalance?.unpaid || 0
        ],
        backgroundColor: 'rgba(121, 120, 233, 0.6)',
        borderColor: '#7978E9',
        borderWidth: 2
      }]
    };
  }

  /**
   * Build employee calendar with leaves and holidays
   * Combines upcoming leaves with SA public holidays
   */
  private buildEmployeeCalendar(stats: EmployeeDashboardStats, holidays: Holiday[]): void {
    this.upcomingEvents = [];

    // Add holidays
    if (holidays && holidays.length > 0) {
      this.upcomingEvents.push(...holidays.map(h => ({
        id: h.id,
        title: h.holidayName,
        date: h.holidayDate,
        type: 'holiday' as const,
        description: h.description,
        isRecurring: h.isRecurring,
        countryCode: h.countryCode,
        metadata: {
          isPublicHoliday: h.countryCode === 'ZA' && h.isRecurring,
          isCustomHoliday: !h.isRecurring || h.countryCode !== 'ZA'
        }
      })));
    }

    // Add upcoming leaves from stats (if available)
    if (stats.upcomingLeaves) {
      this.upcomingEvents.push(...stats.upcomingLeaves.map(l => ({
        id: l.id,
        title: `${l.leaveType} Leave`,
        date: l.startDate,
        type: 'leave' as const,
        description: `${l.startDate} to ${l.endDate}`,
        status: l.status
      })));
    }

    // Sort by date
    this.upcomingEvents.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    this.calendarEvents = [...this.upcomingEvents];
  }

  /**
   * Handle calendar event click
   * Navigate to appropriate detail page based on event type
   */
  onEventClick(event: CalendarEvent): void {
    console.log('📅 Calendar event clicked:', event);

    if (!event || !event.id) {
      console.warn('⚠️ Invalid event clicked');
      return;
    }

    if (event.type === 'holiday') {
      // Navigate to holiday detail page
      this.router.navigate(['/holidays', event.id]);
    } else if (event.type === 'leave') {
      // Navigate to leave detail page
      if (this.isAdmin || this.isManager) {
        this.router.navigate(['/admin/leave', event.id]);
      } else {
        this.router.navigate(['/employee/leave', event.id]);
      }
    } else if (event.type === 'attendance' || event.metadata?.isAttendance) {
      // Navigate to attendance edit page
      if (this.isAdmin || this.isManager) {
        this.router.navigate(['/attendance', event.id]);
      } else {
        this.router.navigate(['/attendance/my'], { queryParams: { date: event.date } });
      }
    } else if (event.type === 'intern-school') {
      this.router.navigate(['/admin/intern-attendance/admin']);
    } else if (event.type === 'event') {
      console.log('Company event clicked:', event);
      this.notification.onInfo('Event details coming soon');
    }
  }

  /**
   * Refresh dashboard
   */
  refreshDashboard(): void {
    this.loadDashboard();
  }

  getCategoryBadgeClass(category: string): string {
    const map: any = {
      GENERAL: 'primary', HR: 'info', POLICY: 'warning',
      IT: 'secondary', FINANCE: 'success', URGENT: 'danger'
    };
    return map[category] || 'primary';
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return 'R 0';
    return 'R ' + Math.round(amount).toLocaleString('en-ZA');
  }
}
