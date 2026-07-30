// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '@env/environment';

export type ModuleKey =
  | 'EMPLOYEE_MANAGEMENT'
  | 'LEAVE_MANAGEMENT'
  | 'PAYROLL_PAYSLIPS'
  | 'EXPENSE_CLAIMS'
  | 'BUSINESS_EXPENSES'
  | 'ASSET_MANAGEMENT'
  | 'ATTENDANCE_TRACKING'
  | 'INVOICE_CUSTOMER'
  | 'BUDGET_MANAGEMENT'
  | 'INTERN_ATTENDANCE';

@Injectable()
export class ModuleAccessService {

  private enabledModules = new Set<string>();
  private loaded = false;
  private pending$: Observable<void> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Loads the enabled modules for the current tenant from the API.
   * Only fires once per session — subsequent calls return immediately.
   * Thread-safe: concurrent calls share the same in-flight request.
   */
  loadIfNeeded(): Observable<void> {
    if (this.loaded) return of(void 0);

    if (!this.pending$) {
      this.pending$ = this.http
        .get<any>(`${environment.apiUrl}/api/v1/tenant/modules`)
        .pipe(
          tap(res => {
            const modules: string[] = res?.data?.modules ?? [];
            this.enabledModules = new Set(modules);
            this.loaded = true;
            this.pending$ = null;
          }),
          map(() => void 0 as void),
          catchError(() => {
            // On error, fail open — don't block the user
            this.loaded = true;
            this.pending$ = null;
            return of(void 0 as void);
          }),
          shareReplay(1)
        );
    }

    return this.pending$;
  }

  /**
   * Synchronous check — only reliable after loadIfNeeded() has resolved.
   * Returns true if modules are not yet loaded (fail-open default).
   */
  isEnabled(moduleKey: string): boolean {
    if (!this.loaded) return true;
    return this.enabledModules.has(moduleKey);
  }

  /** All enabled module names (for debugging / admin UI). */
  getEnabledModules(): string[] {
    return Array.from(this.enabledModules);
  }

  /** Call on logout to reset state for the next login. */
  clear(): void {
    this.enabledModules.clear();
    this.loaded = false;
    this.pending$ = null;
  }
}
