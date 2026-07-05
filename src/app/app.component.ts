// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { map, catchError, filter, takeUntil, take } from 'rxjs/operators';
import { UserModel } from './component/profile/user.model';
import { UserService } from './service/user.service';
import { ThemeService } from './service/theme.service';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  // Use BehaviorSubject to cache user data and prevent repeated API calls
  private userSubject = new BehaviorSubject<UserModel | null>(null);
  user$: Observable<UserModel | null> = this.userSubject.asObservable();
  isAuthenticated: boolean = false;
  isPublicRoute: boolean = false;
  private destroy$ = new Subject<void>();
  private profileLoaded: boolean = false;

  private readonly PUBLIC_ROUTES = ['/login', '/register', '/resetpassword', '/user/verify', '/kiosk'];

  // Sidebar state management
  sidebarCollapsed: boolean = false;
  sidebarOpen: boolean = false; // For mobile overlay
  isMobile: boolean = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private themeService: ThemeService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 992;
    if (!this.isMobile) {
      this.sidebarOpen = false; // Close mobile overlay on desktop
    }
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.sidebarOpen = !this.sidebarOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.sidebarOpen = false;
    }
  }

  ngOnInit(): void {
    // Check on initial load
    this.isPublicRoute = this.checkIfPublicRoute(this.router.url);
    this.checkAuthentication();

    // Re-check on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.isPublicRoute = this.checkIfPublicRoute(event.urlAfterRedirects || event.url);
      this.checkAuthStatus();
    });
  }

  private checkIfPublicRoute(url: string): boolean {
    if (url === '/' || url === '' || url === '/?') return true;
    return this.PUBLIC_ROUTES.some(route => url.startsWith(route));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check authentication and load profile ONCE
   */
  private checkAuthentication(): void {
    this.isAuthenticated = this.userService.isAuthenticated();

    if (this.isAuthenticated && !this.profileLoaded) {
      this.loadProfile();
    } else if (!this.isAuthenticated) {
      this.userSubject.next(null);
      this.profileLoaded = false;
    }
  }

  /**
   * Only check auth status on route change, don't reload profile
   */
  private checkAuthStatus(): void {
    const wasAuthenticated = this.isAuthenticated;
    this.isAuthenticated = this.userService.isAuthenticated();

    // Only reload profile if authentication status changed from false to true
    if (!wasAuthenticated && this.isAuthenticated && !this.profileLoaded) {
      this.loadProfile();
    } else if (!this.isAuthenticated) {
      this.userSubject.next(null);
      this.profileLoaded = false;
    }
  }

  /**
   * Load user profile once and cache it
   */
  private loadProfile(): void {
    this.profileLoaded = true;

    this.userService.profile$().pipe(
      take(1),
      map(response => response?.data?.user as UserModel),
      catchError(error => {
        this.isAuthenticated = false;
        this.profileLoaded = false;
        if (!this.router.url.includes('/login') &&
          !this.router.url.includes('/register') &&
          !this.router.url.includes('/verify') &&
          this.router.url !== '/') {
          this.router.navigate(['/login']);
        }
        return of(null);
      })
    ).subscribe(user => {
      this.userSubject.next(user);
    });
  }

  /**
   * Public method to refresh user profile (call after profile update)
   */
  refreshProfile(): void {
    this.profileLoaded = false;
    this.loadProfile();
  }

  /** Role helper used in templates */
  isAdminUser(user: UserModel): boolean {
    return ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_MANAGER'].includes(user?.roleName);
  }
}
