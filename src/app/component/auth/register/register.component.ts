// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable, catchError, map, of, startWith } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { RegisterState } from 'src/app/interface/appstates';
import { NotificationService } from 'src/app/service/notification.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  registerState$: Observable<RegisterState> = of({ dataState: DataState.LOADED });
  readonly DataState = DataState;

  constructor(private userService: UserService, private notification: NotificationService) { }

  register(registerForm: NgForm): void {
    // The visible form no longer collects a password — the account is
    // pending administrator review anyway, so the applicant can't sign in
    // yet. A random placeholder still has to be sent because the backend
    // requires a non-empty password; the real one gets set later via the
    // existing "Forgot Password?" flow once the account is approved.
    const payload = { ...registerForm.value, password: this.generatePlaceholderPassword() };
    this.registerState$ = this.userService.save$(payload)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          console.log(response);
          registerForm.reset();
          return { dataState: DataState.LOADED, registerSuccess: true, message: response.message };
        }),
        startWith({ dataState: DataState.LOADING, registerSuccess: false }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, registerSuccess: false, error })
        })
      );
  }

  createAccountForm(): void {
    this.registerState$ = of({ dataState: DataState.LOADED, registerSuccess: false });
  }

  private generatePlaceholderPassword(): string {
    return `Pending-${crypto.randomUUID()}`;
  }

}
