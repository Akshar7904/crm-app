// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable()
export class VatReturnService {

  private readonly base = `${environment.apiUrl}/api/v1/vat-returns`;

  constructor(private http: HttpClient) {}

  calculate$(year: number, month: number): Observable<any> {
    return this.http.get(`${this.base}/calculate?year=${year}&month=${month}`);
  }

  list$(page = 0, size = 20): Observable<any> {
    return this.http.get(`${this.base}/list?page=${page}&size=${size}`);
  }

  get$(id: number): Observable<any> {
    return this.http.get(`${this.base}/get/${id}`);
  }

  getByYear$(year: number): Observable<any> {
    return this.http.get(`${this.base}/year/${year}`);
  }

  save$(payload: any): Observable<any> {
    return this.http.post(`${this.base}/save`, payload);
  }

  file$(id: number): Observable<any> {
    return this.http.patch(`${this.base}/${id}/file`, {});
  }

  markPaid$(id: number): Observable<any> {
    return this.http.patch(`${this.base}/${id}/mark-paid`, {});
  }

  delete$(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
