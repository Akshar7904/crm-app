import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of, switchMap } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { AccountType, VerifySate } from 'src/app/interface/appstates';
import { NotificationService } from 'src/app/service/notification.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyComponent implements OnInit {
  verifyState$: Observable<VerifySate>;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  readonly DataState = DataState;
  private resetKey: string;

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private userService: UserService, private notification: NotificationService) { }

  ngOnInit(): void {
    this.verifyState$ = this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const type: AccountType = this.getAccountType(window.location.href);
        this.resetKey = params.get('key');
        return this.userService.verify$(this.resetKey, type)
          .pipe(
            map(response => {
              this.notification.onDefault(response.message);
              return { type, title: 'Verified!', dataState: DataState.LOADED, message: response.message, verifySuccess: true };
            }),
            startWith({ title: 'Verifying...', dataState: DataState.LOADING, message: 'Please wait while we verify the information', verifySuccess: false }),
            catchError((error: string) => {
              this.notification.onError(error);
              return of({ title: error, dataState: DataState.ERROR, error, message: error, verifySuccess: false })
            })
          )
      })
    );
  }

  renewPassword(resetPasswordForm: NgForm): void {
    this.isLoadingSubject.next(true);
    this.verifyState$ = this.userService.renewPassword$({
      key: this.resetKey,
      password: resetPasswordForm.value.password,
      confirmPassword: resetPasswordForm.value.confirmPassword
    }).pipe(
      map(response => {
        this.notification.onDefault(response.message);
        this.isLoadingSubject.next(false);
        setTimeout(() => this.router.navigate(['/login']), 3000);
        return { type: 'account' as AccountType, title: 'Success', dataState: DataState.LOADED, message: response.message + ' Redirecting to login...', verifySuccess: true };
      }),
      startWith({ type: 'password' as AccountType, title: 'Verified!', dataState: DataState.LOADED, verifySuccess: false }),
      catchError((error: string) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
        return of({ type: 'password' as AccountType, title: 'Verified!', dataState: DataState.LOADED, error, verifySuccess: true })
      })
    )
  }

  private getAccountType(url: string): AccountType {
    return url.includes('password') ? 'password' : 'account';
  }

}
