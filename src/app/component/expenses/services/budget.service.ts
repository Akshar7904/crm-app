// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/api/v1/budget`;

@Injectable()
export class BudgetService {
  constructor(private http: HttpClient) {}

  getBudgetYears(): Observable<any> {
    return this.http.get<any>(`${BASE}/years`);
  }

  getBudgetForYear(year: number): Observable<any> {
    return this.http.get<any>(`${BASE}/${year}`);
  }

  getYearSummary(year: number): Observable<any> {
    return this.http.get<any>(`${BASE}/${year}/summary`);
  }

  bulkSave(year: number, lines: any[]): Observable<any> {
    return this.http.post<any>(`${BASE}/${year}/bulk-save`, lines);
  }

  deleteLine(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/${id}`);
  }
}
