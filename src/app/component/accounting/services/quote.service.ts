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
export class QuoteService {
  private readonly server = environment.apiUrl + '/api/v1';

  constructor(private http: HttpClient) {}

  quotes$ = (page = 0, size = 10) =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/quotes/list?page=${page}&size=${size}`
    ).pipe(tap(console.log), catchError(this.handleError));

  quote$ = (id: number) =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/quotes/get/${id}`
    ).pipe(tap(console.log), catchError(this.handleError));

  search$ = (term = '', page = 0, size = 10) =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/quotes/search?term=${encodeURIComponent(term)}&page=${page}&size=${size}`
    ).pipe(tap(console.log), catchError(this.handleError));

  byStatus$ = (status: string, page = 0, size = 10) =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/quotes/by-status/${status}?page=${page}&size=${size}`
    ).pipe(tap(console.log), catchError(this.handleError));

  create$ = (quote: any) =>
    this.http.post<CustomHttpResponse<any>>(
      `${this.server}/quotes/create`, quote
    ).pipe(tap(console.log), catchError(this.handleError));

  update$ = (quote: any) =>
    this.http.put<CustomHttpResponse<any>>(
      `${this.server}/quotes/update`, quote
    ).pipe(tap(console.log), catchError(this.handleError));

  markSent$ = (id: number) =>
    this.http.patch<CustomHttpResponse<any>>(
      `${this.server}/quotes/${id}/mark-sent`, {}
    ).pipe(tap(console.log), catchError(this.handleError));

  accept$ = (id: number) =>
    this.http.patch<CustomHttpResponse<any>>(
      `${this.server}/quotes/${id}/accept`, {}
    ).pipe(tap(console.log), catchError(this.handleError));

  reject$ = (id: number) =>
    this.http.patch<CustomHttpResponse<any>>(
      `${this.server}/quotes/${id}/reject`, {}
    ).pipe(tap(console.log), catchError(this.handleError));

  convert$ = (id: number) =>
    this.http.post<CustomHttpResponse<any>>(
      `${this.server}/quotes/${id}/convert`, {}
    ).pipe(tap(console.log), catchError(this.handleError));

  delete$ = (id: number) =>
    this.http.delete<CustomHttpResponse<any>>(
      `${this.server}/quotes/${id}`
    ).pipe(tap(console.log), catchError(this.handleError));

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = error.error?.reason ?? `An error occurred — Error status ${error.status}`;
    return throwError(() => errorMessage);
  }
}
