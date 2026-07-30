// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { DataState } from '../enum/datastate.enum';
import {
  Leave,
  LeaveBalance,
  LeaveRequest,
  LeaveApproval,
  LeaveState,
  LeaveType,
  LeaveStatus,
  LeaveFilters,
  LeaveHttpResponse,
  LeavePage
} from '../interface/leave-state';


@Injectable()
export class LeaveService {
  private readonly apiUrl = environment.apiUrl + '/api/v1/leave';

  // State management using BehaviorSubject
  private leaveState$ = new BehaviorSubject<LeaveState>({
    dataState: DataState.LOADING
  });

  public readonly state$ = this.leaveState$.asObservable();

  constructor(private http: HttpClient) {}

  // State getters
  get currentState(): LeaveState {
    return this.leaveState$.value;
  }

  // State updaters
  private setState(state: LeaveState): void {
    this.leaveState$.next(state);
  }

  private setLoadingState(): void {
    this.setState({ dataState: DataState.LOADING });
  }

  private setLoadedState(data: Partial<LeaveState>): void {
    this.setState({
      dataState: DataState.LOADED,
      ...data
    });
  }

  private setErrorState(error: string): void {
    this.setState({
      dataState: DataState.ERROR,
      error
    });
  }

  // Create leave request
  createLeaveRequest(request: LeaveRequest): Observable<Leave> {
    this.setLoadingState();
    return this.http.post<LeaveHttpResponse<Leave>>(`${this.apiUrl}`, request).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to create leave request');
        }
        return response.data;
      }),
      tap(leave => {
        const currentLeaves = this.currentState.leaves || [];
        this.setLoadedState({
          leaves: [leave, ...currentLeaves],
          message: 'Leave request created successfully'
        });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to create leave request';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Update leave request
  updateLeaveRequest(id: number, request: LeaveRequest): Observable<Leave> {
    this.setLoadingState();
    return this.http.put<LeaveHttpResponse<Leave>>(`${this.apiUrl}/${id}`, request).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to update leave request');
        }
        return response.data;
      }),
      tap(updatedLeave => {
        const currentLeaves = this.currentState.leaves || [];
        const leaves = currentLeaves.map(leave =>
          leave.id === id ? updatedLeave : leave
        );
        this.setLoadedState({
          leaves,
          selectedLeave: updatedLeave,
          message: 'Leave request updated successfully'
        });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to update leave request';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Get leave by ID
  getLeaveById(id: number): Observable<Leave> {
    this.setLoadingState();
    return this.http.get<LeaveHttpResponse<Leave>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error('Failed to fetch leave');
        }
        return response.data;
      }),
      tap(leave => {
        this.setLoadedState({ selectedLeave: leave });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to fetch leave';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Get all leaves with pagination
  getAllLeaves(page: number = 0, size: number = 10, sortBy: string = 'createdAt', sortDirection: string = 'DESC'): Observable<Leave[]> {
    this.setLoadingState();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<LeaveHttpResponse<Leave[]>>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Failed to fetch leaves');
        }
        return response.data || [];
      }),
      tap(leaves => {
        this.setLoadedState({ leaves });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to fetch leaves';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Get leaves by employee
  getLeavesByEmployee(employeeId: number, page: number = 0, size: number = 10): Observable<Leave[]> {
    this.setLoadingState();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<LeaveHttpResponse<Leave[]>>(`${this.apiUrl}/employee/${employeeId}`, { params }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Failed to fetch employee leaves');
        }
        return response.data || [];
      }),
      tap(leaves => {
        this.setLoadedState({ leaves });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to fetch employee leaves';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Get leaves by status
  getLeavesByStatus(status: LeaveStatus, page: number = 0, size: number = 10): Observable<Leave[]> {
    this.setLoadingState();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<LeaveHttpResponse<Leave[]>>(`${this.apiUrl}/status/${status}`, { params }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Failed to fetch leaves by status');
        }
        return response.data || [];
      }),
      tap(leaves => {
        this.setLoadedState({ leaves });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to fetch leaves by status';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Search leaves
  searchLeaves(query: string, page: number = 0, size: number = 10): Observable<Leave[]> {
    this.setLoadingState();
    let params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<LeaveHttpResponse<Leave[]>>(`${this.apiUrl}/search`, { params }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Failed to search leaves');
        }
        return response.data || [];
      }),
      tap(leaves => {
        this.setLoadedState({ leaves });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to search leaves';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Approve leave
  approveLeave(approval: LeaveApproval): Observable<Leave> {
    this.setLoadingState();
    approval.status = LeaveStatus.APPROVED;
    return this.http.post<LeaveHttpResponse<Leave>>(`${this.apiUrl}/approve`, approval).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to approve leave');
        }
        return response.data;
      }),
      tap(updatedLeave => {
        const currentLeaves = this.currentState.leaves || [];
        const leaves = currentLeaves.map(leave =>
          leave.id === approval.leaveId ? updatedLeave : leave
        );
        this.setLoadedState({
          leaves,
          message: 'Leave approved successfully'
        });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to approve leave';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Reject leave
  rejectLeave(approval: LeaveApproval): Observable<Leave> {
    this.setLoadingState();
    approval.status = LeaveStatus.REJECTED;
    return this.http.post<LeaveHttpResponse<Leave>>(`${this.apiUrl}/reject`, approval).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to reject leave');
        }
        return response.data;
      }),
      tap(updatedLeave => {
        const currentLeaves = this.currentState.leaves || [];
        const leaves = currentLeaves.map(leave =>
          leave.id === approval.leaveId ? updatedLeave : leave
        );
        this.setLoadedState({
          leaves,
          message: 'Leave rejected successfully'
        });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to reject leave';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Cancel leave
  cancelLeave(leaveId: number, employeeId: number): Observable<Leave> {
    this.setLoadingState();
    let params = new HttpParams().set('employeeId', employeeId.toString());

    return this.http.post<LeaveHttpResponse<Leave>>(`${this.apiUrl}/${leaveId}/cancel`, null, { params }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to cancel leave');
        }
        return response.data;
      }),
      tap(updatedLeave => {
        const currentLeaves = this.currentState.leaves || [];
        const leaves = currentLeaves.map(leave =>
          leave.id === leaveId ? updatedLeave : leave
        );
        this.setLoadedState({
          leaves,
          message: 'Leave cancelled successfully'
        });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to cancel leave';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Delete leave
  deleteLeave(id: number): Observable<void> {
    this.setLoadingState();
    return this.http.delete<LeaveHttpResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete leave');
        }
      }),
      tap(() => {
        const currentLeaves = this.currentState.leaves || [];
        const leaves = currentLeaves.filter(leave => leave.id !== id);
        this.setLoadedState({
          leaves,
          message: 'Leave deleted successfully'
        });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to delete leave';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Get leave balances
  getLeaveBalances(employeeId: number, year: number): Observable<LeaveBalance[]> {
    this.setLoadingState();
    return this.http.get<LeaveHttpResponse<LeaveBalance[]>>(`${this.apiUrl}/balance/${employeeId}/${year}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error('Failed to fetch leave balances');
        }
        return response.data || [];
      }),
      tap(balances => {
        this.setLoadedState({ leaveBalances: balances });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to fetch leave balances';
        this.setErrorState(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Get pending leaves count
  getPendingCount(): Observable<number> {
    return this.http.get<LeaveHttpResponse<any>>(`${this.apiUrl}/statistics/pending-count`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          return 0;
        }
        return response.data.count || 0;
      }),
      catchError(() => of(0))
    );
  }

  // Get upcoming leaves
  getUpcomingLeaves(days: number = 30): Observable<Leave[]> {
    let params = new HttpParams().set('days', days.toString());
    return this.http.get<LeaveHttpResponse<Leave[]>>(`${this.apiUrl}/upcoming`, { params }).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  // Calculate business days
  calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  // Upload doctor's note file
  uploadDoctorNote(leaveId: number, file: File): Observable<Leave> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<LeaveHttpResponse<Leave>>(`${this.apiUrl}/${leaveId}/doctor-note`, formData).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to upload doctor\'s note');
        }
        return response.data;
      }),
      tap(updatedLeave => {
        const currentLeaves = this.currentState.leaves || [];
        const leaves = currentLeaves.map(leave =>
          leave.id === leaveId ? updatedLeave : leave
        );
        this.setLoadedState({ leaves });
      }),
      catchError(error => {
        const errorMessage = error.error?.message || error.message || 'Failed to upload doctor\'s note';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Get leave balances for employees hired in a specific year (for admin allocation management)
  getAllBalancesForHireYear(hireYear: number): Observable<LeaveBalance[]> {
    return this.http.get<LeaveHttpResponse<LeaveBalance[]>>(`${this.apiUrl}/balance/allocation?hireYear=${hireYear}`).pipe(
      map(response => response.data || []),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Get ALL employees' leave balances for a given year (no hire year filter)
  getAllBalancesForYear$ = (year: number) =>
    this.http.get<any>(`${this.apiUrl}/balance/allocation/all?year=${year}`);

  // Bulk-initialize leave balances for all active employees in the current tenant
  bulkInitializeLeaveBalances$ = (year: number) =>
    this.http.post<any>(`${this.apiUrl}/balance/bulk-initialize?year=${year}`, {});

  // Download leave report as Excel blob
  downloadReport$ = (employeeId?: number, status?: string, startDate?: string, endDate?: string) =>
    this.http.get(`${this.apiUrl}/download/report`, {
      params: {
        ...(employeeId && { employeeId: employeeId.toString() }),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      },
      responseType: 'blob'
    });

  // Admin: update leave entitlement for an employee
  updateLeaveEntitlement(employeeId: number, leaveType: string, year: number, entitlement: number): Observable<LeaveBalance> {
    const params = new HttpParams()
      .set('employeeId', employeeId.toString())
      .set('leaveType', leaveType)
      .set('year', year.toString())
      .set('entitlement', Number(entitlement).toString());
    return this.http.put<LeaveHttpResponse<LeaveBalance>>(`${this.apiUrl}/balance/update`, {}, { params }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to update leave entitlement');
        }
        return response.data;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Get doctor's note download URL
  getDoctorNoteUrl(leaveId: number): string {
    return `${this.apiUrl}/${leaveId}/doctor-note`;
  }

  // Clear state
  clearState(): void {
    this.setState({
      dataState: DataState.LOADED
    });
  }
}
