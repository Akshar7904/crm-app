// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { CustomHttpResponse } from '../../../interface/appstates';

@Injectable()
export class BillService {
  private readonly server = environment.apiUrl + '/api/v1';

  constructor(private http: HttpClient) {}

  bills$ = (page = 0, size = 10) =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/bills/list?page=${page}&size=${size}`
    ).pipe(tap(console.log), catchError(this.handleError));

  bill$ = (id: number) =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/bills/get/${id}`
    ).pipe(tap(console.log), catchError(this.handleError));

  search$ = (term = '', page = 0, size = 10) =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/bills/search?term=${encodeURIComponent(term)}&page=${page}&size=${size}`
    ).pipe(tap(console.log), catchError(this.handleError));

  overdue$ = () =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/bills/overdue`
    ).pipe(tap(console.log), catchError(this.handleError));

  create$ = (bill: any) =>
    this.http.post<CustomHttpResponse<any>>(
      `${this.server}/bills/create`, bill
    ).pipe(tap(console.log), catchError(this.handleError));

  update$ = (bill: any) =>
    this.http.put<CustomHttpResponse<any>>(
      `${this.server}/bills/update`, bill
    ).pipe(tap(console.log), catchError(this.handleError));

  markPaid$ = (id: number, paymentMethod?: string) => {
    const params = paymentMethod ? `?paymentMethod=${paymentMethod}` : '';
    return this.http.patch<CustomHttpResponse<any>>(
      `${this.server}/bills/${id}/mark-paid${params}`, {}
    ).pipe(tap(console.log), catchError(this.handleError));
  };

  delete$ = (id: number) =>
    this.http.delete<CustomHttpResponse<any>>(
      `${this.server}/bills/${id}`
    ).pipe(tap(console.log), catchError(this.handleError));

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = error.error?.reason ?? `An error occurred — Error status ${error.status}`;
    return throwError(() => errorMessage);
  }
}
