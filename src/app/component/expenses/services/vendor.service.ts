// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@env/environment';

const API = `${environment.apiUrl}/api/v1/vendors`;

@Injectable({ providedIn: 'root' })
export class VendorService {
  constructor(private http: HttpClient) {}

  private safeMutate(req: Observable<string>): Observable<any> {
    return req.pipe(
      map(text => { try { return JSON.parse(text); } catch { return { success: true }; } }),
      catchError(err => {
        if (err.status && err.status >= 400) return throwError(() => err);
        return of({ success: true });
      })
    );
  }

  getAll(): Observable<any> {
    return this.http.get<any>(API);
  }

  getActive(): Observable<any> {
    return this.http.get<any>(`${API}/active`);
  }

  search(q: string): Observable<any> {
    return this.http.get<any>(`${API}/search?q=${q}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${API}/${id}`);
  }

  create(vendor: any): Observable<any> {
    return this.safeMutate(this.http.post(`${API}/create`, vendor, { responseType: 'text' }));
  }

  update(id: number, vendor: any): Observable<any> {
    return this.safeMutate(this.http.put(`${API}/update/${id}`, vendor, { responseType: 'text' }));
  }

  toggle(id: number): Observable<any> {
    return this.safeMutate(this.http.put(`${API}/toggle/${id}`, {}, { responseType: 'text' }));
  }

  delete(id: number): Observable<any> {
    return this.safeMutate(this.http.delete(`${API}/delete/${id}`, { responseType: 'text' }));
  }
}
