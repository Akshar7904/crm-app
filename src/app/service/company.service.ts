// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable()
export class CompanyService {
  private readonly base = environment.apiUrl + '/api/v1/companies';

  constructor(private http: HttpClient) {}

  getMyCompany$(): Observable<any> {
    return this.http.get<any>(`${this.base}/my`);
  }

  updateMyBranding$(data: { name?: string; tagline?: string; primaryColor?: string; email?: string; phone?: string; address?: string }): Observable<any> {
    return this.http.put<any>(`${this.base}/my/branding`, data);
  }

  uploadMyLogo$(file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.base}/my/logo`, form);
  }

  getLogoUrl(companyId: number): string {
    return `${this.base}/${companyId}/logo`;
  }

  getPolicyAcknowledgementStatus$(): Observable<any> {
    return this.http.get<any>(`${this.base}/my/policy/acknowledgement-status`);
  }

  acknowledgePolicy$(): Observable<any> {
    return this.http.post<any>(`${this.base}/my/policy/acknowledge`, {});
  }
}
