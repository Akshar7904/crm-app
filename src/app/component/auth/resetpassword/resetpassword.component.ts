// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable, of, map, startWith, catchError, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataState } from 'src/app/enum/datastate.enum';
import { Key } from 'src/app/enum/key.enum';
import { RegisterState } from 'src/app/interface/appstates';
import { NotificationService } from 'src/app/service/notification.service';
import { UserService } from 'src/app/service/user.service';
import { BrandingService } from 'src/app/service/branding.service';

@Component({
  standalone: false,
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetpasswordComponent implements OnInit, OnDestroy {
  resetPasswordState$: Observable<RegisterState> = of({ dataState: DataState.LOADED });
  readonly DataState = DataState;

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private notification: NotificationService,
    public branding: BrandingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.branding.branding$.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());
    if (!this.branding.loaded) {
      const storedId = localStorage.getItem(Key.COMPANY_ID);
      if (storedId) {
        this.branding.loadPublic(Number(storedId)).subscribe();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  resetPassword(resetPasswordForm: NgForm): void {
    this.resetPasswordState$ = this.userService.requestPasswordReset$(resetPasswordForm.value.email)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          resetPasswordForm.reset();
          return { dataState: DataState.LOADED, registerSuccess: true, message: response.message };
        }),
        startWith({ dataState: DataState.LOADING, registerSuccess: false }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, registerSuccess: false, error });
        })
      );
  }

  resetForm(): void {
    this.resetPasswordState$ = of({ dataState: DataState.LOADED, registerSuccess: false });
  }
}
