// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { CustomHttpResponse } from '../../../interface/appstates';
import { ProductCatalog, ProductStats } from '../models/product-catalog.model';

@Injectable()
export class ProductCatalogService {
  private readonly server = environment.apiUrl + '/api/v1';

  constructor(private http: HttpClient) {}

  products$ = (page: number = 0, size: number = 10) =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/products/list?page=${page}&size=${size}`
    ).pipe(tap(console.log), catchError(this.handleError));

  product$ = (id: number) =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/products/get/${id}`
    ).pipe(tap(console.log), catchError(this.handleError));

  activeProducts$ = () =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/products/active`
    ).pipe(tap(console.log), catchError(this.handleError));

  search$ = (name: string = '', page: number = 0, size: number = 10) =>
    this.http.get<CustomHttpResponse<any>>(
      `${this.server}/products/search?name=${encodeURIComponent(name)}&page=${page}&size=${size}`
    ).pipe(tap(console.log), catchError(this.handleError));

  create$ = (product: ProductCatalog) =>
    this.http.post<CustomHttpResponse<any>>(
      `${this.server}/products/create`, product
    ).pipe(tap(console.log), catchError(this.handleError));

  update$ = (product: ProductCatalog) =>
    this.http.put<CustomHttpResponse<any>>(
      `${this.server}/products/update`, product
    ).pipe(tap(console.log), catchError(this.handleError));

  toggleActive$ = (id: number) =>
    this.http.patch<CustomHttpResponse<any>>(
      `${this.server}/products/${id}/toggle-active`, {}
    ).pipe(tap(console.log), catchError(this.handleError));

  delete$ = (id: number) =>
    this.http.delete<CustomHttpResponse<any>>(
      `${this.server}/products/${id}`
    ).pipe(tap(console.log), catchError(this.handleError));

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = error.error?.reason ?? `An error occurred — Error status ${error.status}`;
    return throwError(() => errorMessage);
  }
}
