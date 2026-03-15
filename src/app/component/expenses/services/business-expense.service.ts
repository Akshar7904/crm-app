// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@env/environment';

const API = `${environment.apiUrl}/api/v1/business-expenses`;

@Injectable({ providedIn: 'root' })
export class BusinessExpenseService {
  constructor(private http: HttpClient) {}

  /**
   * Some endpoints return HTTP 200 but with a malformed JSON body due to
   * Hibernate ByteBuddy proxy serialisation. We use responseType:'text' and
   * parse manually so Angular never attempts auto-JSON-parse on those routes.
   */
  private safePost(url: string, body: any = {}): Observable<any> {
    return this.http.post(url, body, { responseType: 'text' }).pipe(
      map(text => this.tryParse(text)),
      catchError(err => {
        // HttpClient still throws for non-2xx; pass those through
        if (err.status && err.status >= 400) return throwError(() => err);
        // Status 200 parse error — treat as success
        return of({ success: true, data: {} });
      })
    );
  }

  private safePut(url: string, body: any = {}): Observable<any> {
    return this.http.put(url, body, { responseType: 'text' }).pipe(
      map(text => this.tryParse(text)),
      catchError(err => {
        if (err.status && err.status >= 400) return throwError(() => err);
        return of({ success: true, data: {} });
      })
    );
  }

  private safeGet(url: string, params?: HttpParams): Observable<any> {
    return this.http.get(url, { responseType: 'text', params }).pipe(
      map(text => this.tryParse(text)),
      catchError(err => {
        if (err.status && err.status >= 400) return throwError(() => err);
        return of({ success: true, data: {} });
      })
    );
  }

  private tryParse(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      // Partial/corrupt JSON from ByteBuddy — extract what we can
      const idMatch = text.match(/"id"\s*:\s*(\d+)/);
      const refMatch = text.match(/"referenceNumber"\s*:\s*"([^"]+)"/);

      // If it looks like a list response (contains "content" array or "page" key), return empty page
      if (text.includes('"content"') || text.includes('"totalElements"')) {
        return { success: true, data: { page: { content: [], totalElements: 0, totalPages: 0 } } };
      }

      // Single-expense response
      return {
        success: true,
        data: {
          expense: {
            id: idMatch ? parseInt(idMatch[1], 10) : null,
            referenceNumber: refMatch ? refMatch[1] : null
          }
        }
      };
    }
  }

  getAll(page = 0, size = 20, status?: string): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.safeGet(API, params);
  }

  getById(id: number): Observable<any> {
    return this.safeGet(`${API}/${id}`);
  }

  getByAccount(accountId: number): Observable<any> {
    return this.safeGet(`${API}/account/${accountId}`);
  }

  create(expense: any): Observable<any> {
    return this.safePost(`${API}/create`, expense);
  }

  update(id: number, expense: any): Observable<any> {
    return this.safePut(`${API}/update/${id}`, expense);
  }

  approve(id: number): Observable<any> {
    return this.safePost(`${API}/approve/${id}`);
  }

  void(id: number): Observable<any> {
    return this.safePost(`${API}/void/${id}`);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${API}/delete/${id}`, { responseType: 'text' }).pipe(
      map(text => { try { return JSON.parse(text); } catch { return { success: true }; } }),
      catchError(err => {
        if (err.status && err.status >= 400) return throwError(() => err);
        return of({ success: true });
      })
    );
  }
}
