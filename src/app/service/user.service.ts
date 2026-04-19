// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, shareReplay, tap, throwError } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AccountType, CustomHttpResponse, Profile } from '../interface/appstates';
import { UserModel } from '../component/profile/user.model';
import { Key } from '../enum/key.enum';

@Injectable()
export class UserService {
  private readonly server: string = environment.apiUrl + '/api/v1';
  private jwtHelper = new JwtHelperService();

  // Cached profile — all 15 components share one HTTP call per session
  private profileCache$: Observable<CustomHttpResponse<Profile>> | null = null;

  constructor(private http: HttpClient) { }

  getCompaniesForEmail$ = (email: string) =>
    this.http.get<any>(`${this.server}/auth/companies`, { params: { email } })
      .pipe(catchError(this.handleError));

  login$ = (email: string, password: string, companyId?: number) => <Observable<CustomHttpResponse<Profile>>>
    this.http.post<CustomHttpResponse<Profile>>(`${this.server}/user/login`, { email, password, companyId })
      .pipe(catchError(this.handleError));

  save$ = (user: UserModel) => <Observable<CustomHttpResponse<Profile>>>
    this.http.post<CustomHttpResponse<Profile>>(`${this.server}/user/register`, user)
      .pipe(catchError(this.handleError));

  requestPasswordReset$ = (email: string) => <Observable<CustomHttpResponse<Profile>>>
    this.http.get<CustomHttpResponse<Profile>>(`${this.server}/user/resetpassword/${email}`)
      .pipe(catchError(this.handleError));

  verifyCode$ = (email: string, code: string) => <Observable<CustomHttpResponse<Profile>>>
    this.http.get<CustomHttpResponse<Profile>>(`${this.server}/user/verify/code/${email}/${code}`)
      .pipe(catchError(this.handleError));

  verifyTotpLogin$ = (email: string, code: string) => <Observable<CustomHttpResponse<Profile>>>
    this.http.post<CustomHttpResponse<Profile>>(`${this.server}/user/mfa/verify`, { email, code })
      .pipe(catchError(this.handleError));

  verify$ = (key: string, type: AccountType) => <Observable<CustomHttpResponse<Profile>>>
    this.http.get<CustomHttpResponse<Profile>>(`${this.server}/user/verify/${type}/${key}`)
      .pipe(catchError(this.handleError));

  renewPassword$ = (form: { key: string, password: string, confirmPassword: string }) => <Observable<CustomHttpResponse<Profile>>>
    this.http.put<CustomHttpResponse<Profile>>(`${this.server}/user/new/password`, form)
      .pipe(catchError(this.handleError));

  profile$ = (): Observable<CustomHttpResponse<Profile>> => {
    if (!this.profileCache$) {
      this.profileCache$ = this.http.get<CustomHttpResponse<Profile>>(`${this.server}/user/profile`)
        .pipe(
          shareReplay(1),
          catchError(err => {
            this.profileCache$ = null; // bust cache on error so next call retries
            return this.handleError(err);
          })
        );
    }
    return this.profileCache$;
  };

  /** Call after a profile mutation (update name, image, etc.) to force a fresh fetch */
  clearProfileCache(): void {
    this.profileCache$ = null;
  }

  update$ = (user: UserModel) => <Observable<CustomHttpResponse<Profile>>>
    this.http.patch<CustomHttpResponse<Profile>>(`${this.server}/user/update`, user)
      .pipe(catchError(this.handleError));

  refreshToken$ = () => <Observable<CustomHttpResponse<Profile>>>
    this.http.get<CustomHttpResponse<Profile>>(
      `${this.server}/user/refresh/token`,
      { headers: { Authorization: `Bearer ${localStorage.getItem(Key.REFRESH_TOKEN)}` } }
    ).pipe(
      tap(response => {
        localStorage.removeItem(Key.TOKEN);
        localStorage.removeItem(Key.REFRESH_TOKEN);
        localStorage.setItem(Key.TOKEN, response.data.access_token);
        localStorage.setItem(Key.REFRESH_TOKEN, response.data.refresh_token);
      }),
      catchError(this.handleError)
    );

  updatePassword$ = (form: { currentPassword: string, newPassword: string, confirmNewPassword: string }) => <Observable<CustomHttpResponse<Profile>>>
    this.http.patch<CustomHttpResponse<Profile>>(`${this.server}/user/update/password`, form)
      .pipe(catchError(this.handleError));

  updateRoles$ = (roleName: string) => <Observable<CustomHttpResponse<Profile>>>
    this.http.patch<CustomHttpResponse<Profile>>(`${this.server}/user/update/role/${roleName}`, {})
      .pipe(catchError(this.handleError));

  updateUserRoleAsAdmin$ = (userId: number, roleName: string) => <Observable<CustomHttpResponse<any>>>
    this.http.patch<CustomHttpResponse<any>>(`${this.server}/user/admin/update-role?userId=${userId}&roleName=${roleName}`, {})
      .pipe(catchError(this.handleError));

  updateAccountSettings$ = (settings: { enabled: boolean, notLocked: boolean }) => <Observable<CustomHttpResponse<Profile>>>
    this.http.patch<CustomHttpResponse<Profile>>(`${this.server}/user/update/settings`, settings)
      .pipe(catchError(this.handleError));

  toggleMfa$ = () => <Observable<CustomHttpResponse<Profile>>>
    this.http.patch<CustomHttpResponse<Profile>>(`${this.server}/user/togglemfa`, {})
      .pipe(catchError(this.handleError));

  setupMfa$ = () => <Observable<CustomHttpResponse<any>>>
    this.http.get<CustomHttpResponse<any>>(`${this.server}/user/mfa/setup`)
      .pipe(catchError(this.handleError));

  enableMfa$ = (code: string) => <Observable<CustomHttpResponse<Profile>>>
    this.http.post<CustomHttpResponse<Profile>>(`${this.server}/user/mfa/enable`, { code })
      .pipe(catchError(this.handleError));

  disableMfa$ = (code: string) => <Observable<CustomHttpResponse<Profile>>>
    this.http.post<CustomHttpResponse<Profile>>(`${this.server}/user/mfa/disable`, { code })
      .pipe(catchError(this.handleError));

  updateImage$ = (formData: FormData) => <Observable<CustomHttpResponse<Profile>>>
    this.http.patch<CustomHttpResponse<Profile>>(`${this.server}/user/update/image`, formData)
      .pipe(catchError(this.handleError));

  logOut() {
    localStorage.removeItem(Key.TOKEN);
    localStorage.removeItem(Key.REFRESH_TOKEN);
    this.profileCache$ = null;
  }

  isAuthenticated = (): boolean => (
    this.jwtHelper.decodeToken<string>(localStorage.getItem(Key.TOKEN)) &&
    !this.jwtHelper.isTokenExpired(localStorage.getItem(Key.TOKEN))
  );

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      errorMessage = `A client error occurred - ${error.error.message}`;
    } else {
      errorMessage = error.error?.reason ?? `An error occurred - Error status ${error.status}`;
    }
    return throwError(() => errorMessage);
  }
}
