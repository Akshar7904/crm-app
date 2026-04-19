// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Key } from '../../enum/key.enum';

@Injectable()
export class SuperadminService {
  private readonly api = environment.apiUrl + '/api/v1';

  constructor(private http: HttpClient) {}

  // ── Companies ──────────────────────────────────────────────────
  getCompanies(page = 0, size = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/superadmin/companies`, { params: { page, size } });
  }

  createCompany(company: any): Observable<any> {
    return this.http.post<any>(`${this.api}/companies/create`, company);
  }

  updateCompany(id: number, company: any): Observable<any> {
    return this.http.put<any>(`${this.api}/companies/update/${id}`, company);
  }

  toggleCompany(id: number): Observable<any> {
    return this.http.put<any>(`${this.api}/companies/toggle/${id}`, {});
  }

  // ── Platform Users ─────────────────────────────────────────────
  /** All SYSADMIN/ADMIN users across every tenant. */
  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.api}/superadmin/users`);
  }

  /** Seed the first (or additional) SYSADMIN for a specific company. */
  createCompanyAdmin(companyId: number, data: { firstName: string; lastName: string; email: string; phone?: string }): Observable<any> {
    return this.http.post<any>(`${this.api}/superadmin/companies/${companyId}/admin`, data);
  }

  // ── Stats ──────────────────────────────────────────────────────
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.api}/superadmin/stats`);
  }

  // ── Impersonation ──────────────────────────────────────────────
  impersonate(companyId: number): Observable<any> {
    return this.http.post<any>(`${this.api}/superadmin/impersonate/${companyId}`, {});
  }

  exitImpersonation(): void {
    const superToken = localStorage.getItem(Key.SUPERADMIN_TOKEN);
    if (superToken) {
      localStorage.setItem(Key.TOKEN, superToken);
      localStorage.removeItem(Key.SUPERADMIN_TOKEN);
      localStorage.removeItem(Key.COMPANY_ID);
    }
  }

  isImpersonating(): boolean {
    return !!localStorage.getItem(Key.SUPERADMIN_TOKEN);
  }

  // ── Company Logo ───────────────────────────────────────────────
  uploadCompanyLogo(companyId: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.api}/companies/${companyId}/logo`, form);
  }

  getCompanyLogoUrl(companyId: number): string {
    return `${this.api}/companies/${companyId}/logo`;
  }

  // ── Platform User Actions ──────────────────────────────────────
  toggleUser(userId: number): Observable<any> {
    return this.http.put<any>(`${this.api}/superadmin/users/${userId}/toggle`, {});
  }

  resetUserPassword(userId: number): Observable<any> {
    return this.http.put<any>(`${this.api}/superadmin/users/${userId}/reset-password`, {});
  }

  changeUserRole(userId: number, roleName: string): Observable<any> {
    return this.http.put<any>(`${this.api}/superadmin/users/${userId}/role`, { roleName });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/superadmin/users/${userId}`);
  }

  // ── Audit Logs ─────────────────────────────────────────────────
  getAuditLogs(filters: { page?: number; size?: number; eventType?: string; companyId?: number; search?: string; from?: string; to?: string } = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.page    != null) params = params.set('page',      filters.page);
    if (filters.size    != null) params = params.set('size',      filters.size);
    if (filters.eventType)       params = params.set('eventType', filters.eventType);
    if (filters.companyId)       params = params.set('companyId', filters.companyId);
    if (filters.search)          params = params.set('search',    filters.search);
    if (filters.from)            params = params.set('from',      filters.from);
    if (filters.to)              params = params.set('to',        filters.to);
    return this.http.get<any>(`${this.api}/superadmin/audit-logs`, { params });
  }

  /** Reads all in-memory HTTP exchanges from the actuator endpoint. */
  getHttpExchanges(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/actuator/httpexchanges`);
  }

  /** Download all in-memory exchanges as Excel (generated server-side). */
  exportHttpExchanges(): Observable<Blob> {
    return this.http.get(`${this.api}/superadmin/http-exchanges/export`, { responseType: 'blob' });
  }

  exportAuditLogs(filters: { eventType?: string; companyId?: number; search?: string; from?: string; to?: string } = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filters.eventType) params = params.set('eventType', filters.eventType);
    if (filters.companyId) params = params.set('companyId', filters.companyId);
    if (filters.search)    params = params.set('search',    filters.search);
    if (filters.from)      params = params.set('from',      filters.from);
    if (filters.to)        params = params.set('to',        filters.to);
    return this.http.get(`${this.api}/superadmin/audit-logs/export`, { params, responseType: 'blob' });
  }


  // ── Module Management ──────────────────────────────────────────
  getCompanyModules(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.api}/superadmin/companies/${companyId}/modules`);
  }

  setCompanyModule(companyId: number, moduleName: string, enabled: boolean): Observable<any> {
    return this.http.put<any>(
      `${this.api}/superadmin/companies/${companyId}/modules/${moduleName}`,
      {},
      { params: { enabled } }
    );
  }

  // ── Company Policy ─────────────────────────────────────────────
  uploadPolicy(companyId: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.api}/companies/${companyId}/policy`, form);
  }

  getPolicyInfo(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.api}/companies/${companyId}/policy/info`);
  }

  getPolicyUrl(companyId: number): string {
    return `${this.api}/companies/${companyId}/policy`;
  }

  deletePolicy(companyId: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/companies/${companyId}/policy`);
  }

  // ── Company Reports ────────────────────────────────────────────
  downloadCompanyReport(companyId: number, type: string, params: any = {}): Observable<Blob> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(k => { if (params[k] != null) httpParams = httpParams.set(k, String(params[k])); });
    return this.http.get(`${this.api}/superadmin/reports/${companyId}/${type}`,
      { params: httpParams, responseType: 'blob' });
  }

  // ── Per-Company Analytics ─────────────────────────────────────
  getPerCompanyAnalytics(year: number, month: number = 0): Observable<any> {
    return this.http.get<any>(`${this.api}/superadmin/analytics/per-company`, { params: { year, month } });
  }

  // ── Company Departments ────────────────────────────────────
  getCompanyDepartments(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.api}/superadmin/companies/${companyId}/departments`);
  }

  // ── Platform Announcements ────────────────────────────────────
  getPlatformAnnouncements(): Observable<any> {
    return this.http.get<any>(`${this.api}/superadmin/announcements`);
  }

  createPlatformAnnouncement(announcement: any): Observable<any> {
    return this.http.post<any>(`${this.api}/superadmin/announcements`, announcement);
  }

  updatePlatformAnnouncement(id: number, announcement: any): Observable<any> {
    return this.http.put<any>(`${this.api}/superadmin/announcements/${id}`, announcement);
  }

  togglePlatformAnnouncement(id: number, active: boolean): Observable<any> {
    return this.http.put<any>(`${this.api}/superadmin/announcements/${id}/toggle`, {}, { params: { active } });
  }

  pinPlatformAnnouncement(id: number, pinned: boolean): Observable<any> {
    return this.http.put<any>(`${this.api}/superadmin/announcements/${id}/pin`, {}, { params: { pinned } });
  }

  deletePlatformAnnouncement(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/superadmin/announcements/${id}`);
  }

  // ── Actuator / Health ──────────────────────────────────────────
  getHealth(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/actuator/health`);
  }

  getMetric(name: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/actuator/metrics/${name}`);
  }

  getInfo(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/actuator/info`);
  }
}
