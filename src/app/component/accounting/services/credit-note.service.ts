// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable()
export class CreditNoteService {

  private readonly base = `${environment.apiUrl}/api/v1/credit-notes`;

  constructor(private http: HttpClient) {}

  list$(page = 0, size = 20): Observable<any> {
    return this.http.get(`${this.base}/list?page=${page}&size=${size}`);
  }

  get$(id: number): Observable<any> {
    return this.http.get(`${this.base}/get/${id}`);
  }

  search$(term: string, page = 0, size = 20): Observable<any> {
    return this.http.get(`${this.base}/search?term=${encodeURIComponent(term)}&page=${page}&size=${size}`);
  }

  byStatus$(status: string, page = 0, size = 20): Observable<any> {
    return this.http.get(`${this.base}/by-status/${status}?page=${page}&size=${size}`);
  }

  create$(payload: any): Observable<any> {
    return this.http.post(`${this.base}/create`, payload);
  }

  update$(payload: any): Observable<any> {
    return this.http.put(`${this.base}/update`, payload);
  }

  issue$(id: number): Observable<any> {
    return this.http.patch(`${this.base}/${id}/issue`, {});
  }

  apply$(id: number): Observable<any> {
    return this.http.patch(`${this.base}/${id}/apply`, {});
  }

  void$(id: number): Observable<any> {
    return this.http.patch(`${this.base}/${id}/void`, {});
  }

  delete$(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
