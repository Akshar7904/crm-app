// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModuleAccessService } from '../service/module-access.service';

/**
 * Route guard for module-gated pages.
 *
 * Usage in app-routing.module.ts:
 *   canActivate: [AuthenticationGuard, ModuleAccessGuard],
 *   data: { moduleKey: 'LEAVE_MANAGEMENT' }
 *
 * If the module is disabled, the user is redirected to the dashboard (/).
 * If no moduleKey is set on the route, the guard passes through.
 */
@Injectable({ providedIn: 'root' })
export class ModuleAccessGuard implements CanActivate {

  constructor(
    private moduleAccess: ModuleAccessService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree {
    const moduleKey = route.data?.['moduleKey'] as string | undefined;

    if (!moduleKey) return true;

    return this.moduleAccess.loadIfNeeded().pipe(
      map(() => {
        if (this.moduleAccess.isEnabled(moduleKey)) return true;
        return this.router.parseUrl('/');
      })
    );
  }
}
