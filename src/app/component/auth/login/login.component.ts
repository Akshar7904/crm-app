// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, startWith, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Company, LoginState } from 'src/app/interface/appstates';
import { UserService } from 'src/app/service/user.service';
import { DataState } from 'src/app/enum/datastate.enum';
import { Key } from 'src/app/enum/key.enum';
import { NotificationService } from 'src/app/service/notification.service';
import { BrandingService } from 'src/app/service/branding.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, OnDestroy {
  loginState$: Observable<LoginState> = of({ dataState: DataState.LOADED, step: 'email' });
  readonly DataState = DataState;

  private destroy$ = new Subject<void>();
  private phoneSubject    = new BehaviorSubject<string | null>(null);
  private emailSubject    = new BehaviorSubject<string | null>(null);
  private companySubject  = new BehaviorSubject<Company | null>(null);
  private companiesSubject = new BehaviorSubject<Company[]>([]);

  constructor(
    private router: Router,
    private userService: UserService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef,
    public branding: BrandingService
  ) {}

  ngOnInit(): void {
    this.userService.isAuthenticated() ? this.router.navigate(['/home']) : this.router.navigate(['/login']);
    // Trigger change detection whenever branding changes (for OnPush)
    this.branding.branding$.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Step 1: User submits email → fetch companies for that email.
   * If one company → auto-select and show password.
   * If many → show company picker.
   */
  lookupEmail(emailForm: NgForm): void {
    const email: string = emailForm.value.email;
    this.emailSubject.next(email);

    this.loginState$ = this.userService.getCompaniesForEmail$(email).pipe(
      map(response => {
        const companies: Company[] = response.data?.companies ?? [];

        if (companies.length === 0) {
          return {
            dataState: DataState.LOADED,
            step: 'email' as const,
            error: 'No account found for this email address.'
          };
        }

        // SUPERADMIN sentinel (id = -1) or single company — skip picker
        if (companies.length === 1 || companies[0]?.id === -1) {
          this.companySubject.next(companies[0]);
          if (companies[0]?.id && companies[0].id > 0) {
            this.branding.loadPublic(companies[0].id).subscribe();
          }
          return {
            dataState: DataState.LOADED,
            step: 'password' as const,
            companies,
            selectedCompany: companies[0]
          };
        }

        this.companiesSubject.next(companies);
        return {
          dataState: DataState.LOADED,
          step: 'company' as const,
          companies
        };
      }),
      startWith({ dataState: DataState.LOADING, step: 'email' as const }),
      catchError((error: string) => {
        this.notification.onError(error);
        return of({ dataState: DataState.ERROR, step: 'email' as const, error });
      })
    );
  }

  /**
   * Step 2 (multi-company only): User selects a company.
   */
  selectCompany(company: Company): void {
    this.companySubject.next(company);
    if (company.id > 0) {
      this.branding.loadPublic(company.id).subscribe();
    }
    this.loginState$ = of({
      dataState: DataState.LOADED,
      step: 'password' as const,
      selectedCompany: company
    });
  }

  /**
   * Step 3: User submits password.
   */
  login(loginForm: NgForm): void {
    const company = this.companySubject.value;
    this.loginState$ = this.userService
      .login$(this.emailSubject.value!, loginForm.value.password, company?.id)
      .pipe(
        map(response => {
          if (response.data?.user?.usingMfa) {
            this.notification.onDefault(response.message);
            this.phoneSubject.next(response.data.user.phone);
            const phone = response.data.user.phone;
            return {
              dataState: DataState.LOADED,
              step: 'mfa' as const,
              isUsingMfa: true,
              loginSuccess: false,
              selectedCompany: company ?? undefined,
              phone: phone ? phone.substring(phone.length - 4) : ''
            };
          }

          this.notification.onDefault(response.message);
          localStorage.setItem(Key.TOKEN, response.data!.access_token!);
          localStorage.setItem(Key.REFRESH_TOKEN, response.data!.refresh_token!);
          localStorage.setItem('user', JSON.stringify(response.data!.user));
          if (company) {
            localStorage.setItem(Key.COMPANY_ID, String(company.id));
          }

          this.router.navigate(['/home']);
          return { dataState: DataState.LOADED, loginSuccess: true };
        }),
        startWith({
          dataState: DataState.LOADING,
          step: 'password' as const,
          selectedCompany: company ?? undefined
        }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({
            dataState: DataState.ERROR,
            step: 'password' as const,
            selectedCompany: company ?? undefined,
            error
          });
        })
      );
  }

  /**
   * MFA verification (unchanged flow).
   */
  verifyCode(verifyCodeForm: NgForm): void {
    this.loginState$ = this.userService
      .verifyTotpLogin$(this.emailSubject.value!, verifyCodeForm.value.code)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          localStorage.setItem(Key.TOKEN, response.data!.access_token!);
          localStorage.setItem(Key.REFRESH_TOKEN, response.data!.refresh_token!);
          localStorage.setItem('user', JSON.stringify(response.data!.user));
          const company = this.companySubject.value;
          if (company) localStorage.setItem(Key.COMPANY_ID, String(company.id));

          this.router.navigate(['/home']);
          return { dataState: DataState.LOADED, loginSuccess: true };
        }),
        startWith({
          dataState: DataState.LOADING,
          step: 'mfa' as const,
          isUsingMfa: true,
          loginSuccess: false,
          phone: this.phoneSubject.value?.substring(this.phoneSubject.value.length - 4) ?? ''
        }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({
            dataState: DataState.ERROR,
            step: 'mfa' as const,
            isUsingMfa: true,
            loginSuccess: false,
            error,
            phone: this.phoneSubject.value?.substring(this.phoneSubject.value.length - 4) ?? ''
          });
        })
      );
  }

  /** Go back to email step. */
  backToEmail(): void {
    this.emailSubject.next(null);
    this.companySubject.next(null);
    this.loginState$ = of({ dataState: DataState.LOADED, step: 'email' });
  }

  /** Go back to company picker. */
  backToCompanies(): void {
    const companies = this.companiesSubject.value;
    this.companySubject.next(null);
    this.loginState$ = of({
      dataState: DataState.LOADED,
      step: companies.length > 1 ? 'company' : 'email',
      companies: companies.length > 1 ? companies : undefined
    });
  }
}
