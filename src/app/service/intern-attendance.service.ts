// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { InternAttendance, InternAttendanceRequest, InternAttendanceApproval } from '../interface/intern-attendance';

@Injectable()
export class InternAttendanceService {
  private apiUrl = `${environment.apiUrl}/api/v1/intern-attendance`;

  constructor(private http: HttpClient) {}

  createRequest(request: InternAttendanceRequest): Observable<InternAttendance> {
    return this.http.post<any>(this.apiUrl, request).pipe(map(r => r.data));
  }

  updateRequest(id: number, request: InternAttendanceRequest): Observable<InternAttendance> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, request).pipe(map(r => r.data));
  }

  getById(id: number): Observable<InternAttendance> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  getAll(page = 0, size = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', 'createdAt')
      .set('sortDirection', 'DESC');
    return this.http.get<any>(this.apiUrl, { params });
  }

  getByEmployee(employeeId: number, page = 0, size = 50): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<any>(`${this.apiUrl}/employee/${employeeId}`, { params });
  }

  getByStatus(status: string, page = 0, size = 10): Observable<any> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<any>(`${this.apiUrl}/status/${status}`, { params });
  }

  approve(approval: InternAttendanceApproval): Observable<InternAttendance> {
    return this.http.post<any>(`${this.apiUrl}/approve`, approval).pipe(map(r => r.data));
  }

  reject(approval: InternAttendanceApproval): Observable<InternAttendance> {
    return this.http.post<any>(`${this.apiUrl}/reject`, approval).pipe(map(r => r.data));
  }

  cancel(id: number, employeeId: number): Observable<InternAttendance> {
    const params = new HttpParams().set('employeeId', employeeId);
    return this.http.post<any>(`${this.apiUrl}/${id}/cancel`, {}, { params }).pipe(map(r => r.data));
  }

  getByDateRange(startDate: string, endDate: string): Observable<InternAttendance[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<any>(`${this.apiUrl}/date-range`, { params }).pipe(map(r => r.data || []));
  }

  getPendingCount(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/pending-count`).pipe(map(r => r.count || 0));
  }

  downloadReport$(employeeId?: number, status?: string): Observable<Blob> {
    const params: any = {};
    if (employeeId) params['employeeId'] = employeeId.toString();
    if (status) params['status'] = status;
    return this.http.get(`${this.apiUrl}/download/report`, { params, responseType: 'blob' });
  }

  calculateBusinessDays(start: Date, end: Date): number {
    let days = 0;
    const current = new Date(start);
    while (current <= end) {
      const dow = current.getDay();
      if (dow !== 0 && dow !== 6) days++;
      current.setDate(current.getDate() + 1);
    }
    return Math.max(days, 1);
  }
}
