// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CustomHttpResponse } from '../interface/appstates';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

export interface DashboardStats {
  totalEmployees?: number;
  presentToday?: number;
  absentToday?: number;
  lateComingToday?: number;
  onLeaveToday?: number;
  pendingLeaveRequests?: number;
  approvedLeavesThisMonth?: number;
  totalCustomers?: number;
  totalInvoices?: number;
  totalBilled?: number;
  totalPayroll?: number;
  pendingPayroll?: number;
  processedPayroll?: number;
  maleEmployees?: number;
  femaleEmployees?: number;
}

export interface EmployeeDashboardStats {
  presentDays?: number;
  absentDays?: number;
  lateDays?: number;
  attendancePercentage?: number;
  leaveBalance?: {
    annual: number;
    sick: number;
    unpaid: number;
    total: number;
  };
  pendingLeaveRequests?: number;
  upcomingHolidays?: Array<{
    id: number;
    name: string;
    date: string;
    description: string;
  }>;
  upcomingLeaves?: Array<{
    id: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly server: string = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private notification: NotificationService
  ) {}

  getAdminDashboardStats(): Observable<CustomHttpResponse<{ stats: DashboardStats }>> {
    return this.http.get<CustomHttpResponse<{ stats: DashboardStats }>>(
      `${this.server}/api/v1/dashboard/admin-stats`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getEmployeeDashboardStats(employeeId: number): Observable<CustomHttpResponse<{ stats: EmployeeDashboardStats }>> {
    return this.http.get<CustomHttpResponse<{ stats: EmployeeDashboardStats }>>(
      `${this.server}/api/v1/dashboard/employee-stats/${employeeId}`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getTodayAttendanceStats(): Observable<CustomHttpResponse<any>> {
    return this.http.get<CustomHttpResponse<any>>(
      `${this.server}/api/v1/dashboard/attendance-today`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getLeaveStats(): Observable<CustomHttpResponse<any>> {
    return this.http.get<CustomHttpResponse<any>>(
      `${this.server}/api/v1/dashboard/leave-stats`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getPayrollStats(): Observable<CustomHttpResponse<any>> {
    return this.http.get<CustomHttpResponse<any>>(
      `${this.server}/api/v1/dashboard/payroll-stats`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Dashboard API error:', error);

    if (error.status === 403) {
      console.log('Access denied (403) for dashboard endpoint');
      // Return a specific error that can be caught and handled
      return throwError(() => ({
        status: 403,
        message: 'You do not have permission to access this dashboard data.',
        error: error.error
      }));
    }

    if (error.status === 401) {
      console.log('Unauthorized - redirecting to login');
      this.notification.onError('Session expired. Please login again.');
      this.router.navigate(['/login']);
      return throwError(() => 'Session expired. Please login again.');
    }

    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.reason) {
        errorMessage = error.error.reason;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    this.notification.onError(errorMessage);
    return throwError(() => errorMessage);
  }
}
