// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { UserModel } from 'src/app/component/profile/user.model';
import { NotificationService } from 'src/app/service/notification.service';
import { UserService } from 'src/app/service/user.service';
import { ThemeService, Theme } from 'src/app/service/theme.service';
import { LayoutPreferenceService, LayoutMode } from 'src/app/service/layout-preference.service';
import { Observable } from 'rxjs';
import { Key } from 'src/app/enum/key.enum';

@Component({
  standalone: false,
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  @Input() user: UserModel;
  @Input() sidebarCollapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  get isImpersonating(): boolean {
    return !!localStorage.getItem(Key.SUPERADMIN_TOKEN);
  }

  get impersonatedCompanyName(): string {
    return localStorage.getItem(Key.IMPERSONATING_COMPANY_NAME) || 'a company';
  }

  private readonly DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  private readonly SERVER_URL = environment.apiUrl + '/api/v1/user';

  // Cache the image URL to prevent repeated requests
  private cachedImageUrl: string = null;
  private cachedUserId: number = null;

  theme$: Observable<Theme>;
  layoutMode$: Observable<LayoutMode>;

  constructor(
    private router: Router,
    private userService: UserService,
    private notification: NotificationService,
    private themeService: ThemeService,
    private layoutPreference: LayoutPreferenceService
  ) {
    this.theme$ = this.themeService.theme$;
    this.layoutMode$ = this.layoutPreference.mode$;
  }

  setLayoutMode(mode: LayoutMode): void {
    this.layoutPreference.setMode(mode);
  }

  exitImpersonation(): void {
    const superToken = localStorage.getItem(Key.SUPERADMIN_TOKEN);
    if (superToken) {
      // Restore original superadmin token
      localStorage.setItem(Key.TOKEN, superToken);
      localStorage.removeItem(Key.SUPERADMIN_TOKEN);
      localStorage.removeItem(Key.COMPANY_ID);
      localStorage.removeItem(Key.IMPERSONATING_COMPANY_NAME);
      // Restore user object without company_id override
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          delete u.companyId;
          localStorage.setItem('user', JSON.stringify(u));
        } catch (_) {}
      }
      this.notification.onDefault('Returned to Super-Admin view');
      window.location.href = '/superadmin/dashboard';
    }
  }

  /**
   * Get profile image URL - from database endpoint or default avatar
   * Uses caching to prevent repeated requests on change detection
   */
  getProfileImageUrl(): string {
    if (!this.user?.id) {
      return this.DEFAULT_AVATAR;
    }

    // Return cached URL if user ID hasn't changed
    if (this.cachedUserId === this.user.id && this.cachedImageUrl) {
      return this.cachedImageUrl;
    }

    // Cache the URL
    this.cachedUserId = this.user.id;
    this.cachedImageUrl = `${this.SERVER_URL}/image/${this.user.id}`;
    return this.cachedImageUrl;
  }

  /**
   * Handle profile image error - fall back to default avatar
   */
  onProfileImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.DEFAULT_AVATAR) {
      img.src = this.DEFAULT_AVATAR;
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  cycleTheme(): void {
    const current = this.themeService.getTheme();
    const next: Theme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    this.themeService.setTheme(next);
  }

  getThemeIcon(theme: Theme): string {
    switch (theme) {
      case 'light': return 'bi-sun';
      case 'dark': return 'bi-moon-stars';
      case 'system': return 'bi-circle-half';
    }
  }

  getThemeLabel(theme: Theme): string {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'Auto';
    }
  }

  logOut(): void {
    this.userService.logOut();
    this.notification.onDefault('You\'ve been successfully logged out');
    this.router.navigate(['/login']).then(() => {
    });
  }
}
