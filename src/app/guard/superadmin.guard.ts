// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { UserService } from '../service/user.service';
import { Key } from '../enum/key.enum';

/**
 * Protects all /superadmin/** routes.
 * Only users with ROLE_SUPERADMIN may pass — everyone else is redirected to '/'.
 *
 * This is a second layer of defence on top of Spring Security's
 * .requestMatchers("/api/v1/superadmin/**").hasRole("SUPERADMIN") rule.
 * Even if a user guesses the URL directly in the browser, this guard
 * redirects them before the component loads and before any API call is made.
 */
@Injectable({ providedIn: 'root' })
export class SuperadminGuard {

  constructor(private userService: UserService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.userService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    // Block during impersonation — the active token is company-scoped so
    // superadmin API calls would fail anyway. Route back to the company dashboard.
    if (localStorage.getItem(Key.SUPERADMIN_TOKEN)) {
      this.router.navigate(['/home']);
      return false;
    }
    const user = this.getStoredUser();
    if (user?.roleName === 'ROLE_SUPERADMIN') {
      return true;
    }
    this.router.navigate(['/home']);
    return false;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }

  private getStoredUser(): { roleName: string } | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
