// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { UserService } from '../service/user.service';
import { Key } from '../enum/key.enum';

@Injectable({ providedIn: 'root' })
export class AuthenticationGuard {

  constructor(private userService: UserService, private router: Router) {}

  canActivate(routeSnapShot: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.userService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // SUPERADMIN landing on '/' → redirect to their platform dashboard.
    // Skip this redirect when impersonating (SUPERADMIN_TOKEN present in localStorage
    // means a company-scoped token is active; the SUPERADMIN wants to see that company's dashboard).
    const targetUrl = state.url;
    const isImpersonating = !!localStorage.getItem(Key.SUPERADMIN_TOKEN);
    if ((targetUrl === '/' || targetUrl === '') && !isImpersonating) {
      const user = this.getStoredUser();
      if (user?.roleName === 'ROLE_SUPERADMIN') {
        this.router.navigate(['/superadmin/dashboard']);
        return false;
      }
    }

    return true;
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
