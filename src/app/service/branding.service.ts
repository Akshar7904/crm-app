// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface CompanyBranding {
  id: number;
  name: string;
  tagline: string;
  primaryColor: string;
  logoUrl: string;
}

@Injectable()
export class BrandingService {

  private readonly DEFAULT_PRIMARY = '#1e56a0';
  private readonly CSS_VAR = '--orion-primary';

  private _branding: CompanyBranding | null = null;
  private _loaded = false;

  /** Emits every time branding changes so subscribers can react. */
  readonly branding$ = new BehaviorSubject<CompanyBranding | null>(null);

  constructor(private http: HttpClient) {}

  get branding(): CompanyBranding | null { return this._branding; }
  get loaded(): boolean { return this._loaded; }

  /**
   * Loads branding for the authenticated user's company via GET /api/v1/companies/my.
   * Applies --orion-primary CSS custom property to document root.
   * Returns immediately if already loaded.
   */
  load(): Observable<CompanyBranding | null> {
    if (this._loaded) return of(this._branding);

    return this.http.get<any>(`${environment.apiUrl}/api/v1/companies/my`).pipe(
      map(res => {
        const c = res?.data?.company;
        if (!c) return null;
        const branding: CompanyBranding = {
          id:           c.id,
          name:         c.name      ?? '',
          tagline:      c.tagline   ?? '',
          primaryColor: c.primaryColor ?? this.DEFAULT_PRIMARY,
          logoUrl:      `${environment.apiUrl}/api/v1/companies/${c.id}/logo`,
        };
        return branding;
      }),
      tap(branding => {
        this._branding = branding;
        this._loaded = true;
        this.applyTheme(branding?.primaryColor ?? this.DEFAULT_PRIMARY);
        this.branding$.next(branding);
      }),
      catchError(() => {
        this._loaded = true;
        this.applyTheme(this.DEFAULT_PRIMARY);
        return of(null);
      })
    );
  }

  /**
   * Loads branding for a specific company by ID (public endpoint, no auth needed).
   * Used on the login page to show company theming before the user authenticates.
   */
  loadPublic(companyId: number): Observable<CompanyBranding | null> {
    return this.http.get<any>(`${environment.apiUrl}/api/v1/companies/${companyId}/branding`).pipe(
      map(res => {
        const b = res?.data?.branding;
        if (!b) return null;
        return {
          id:           b.id,
          name:         b.name         ?? '',
          tagline:      b.tagline       ?? '',
          primaryColor: b.primaryColor  ?? this.DEFAULT_PRIMARY,
          logoUrl:      `${environment.apiUrl}/api/v1/companies/${b.id}/logo`,
        } as CompanyBranding;
      }),
      tap(branding => {
        this.applyTheme(branding?.primaryColor ?? this.DEFAULT_PRIMARY);
        this.branding$.next(branding);
      }),
      catchError(() => of(null))
    );
  }

  /** Resets the CSS custom property and clears stored state (call on logout). */
  clear(): void {
    this._branding = null;
    this._loaded = false;
    this.applyTheme(this.DEFAULT_PRIMARY);
    this.branding$.next(null);
  }

  private applyTheme(color: string): void {
    document.documentElement.style.setProperty(this.CSS_VAR, color);
  }
}
