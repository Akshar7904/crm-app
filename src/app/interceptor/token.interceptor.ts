// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from 'rxjs';
import { Key } from '../enum/key.enum';
import { UserService } from '../service/user.service';
import { CustomHttpResponse, Profile } from '../interface/appstates';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private isTokenRefreshing: boolean = false;
  private refreshTokenSubject: BehaviorSubject<CustomHttpResponse<Profile>> = new BehaviorSubject(null);

  constructor(private userService: UserService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip adding token for authentication endpoints
    if (request.url.includes('/user/verify') || request.url.includes('login') || request.url.includes('register')
      || request.url.includes('refresh') || request.url.includes('resetpassword')) {
      return next.handle(request);
    }

    return next.handle(this.addAuthorizationTokenHeader(request, localStorage.getItem(Key.TOKEN)))
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return this.handleRefreshToken(request, next);
          } else {
            return throwError(() => error);
          }
        })
      );
  }

  private handleRefreshToken(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isTokenRefreshing) {
      console.log('Refreshing Token...');
      this.isTokenRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.userService.refreshToken$().pipe(
        switchMap((response) => {
          console.log('Token Refresh Response:', response);
          this.isTokenRefreshing = false;
          this.refreshTokenSubject.next(response);
          console.log('New Token:', response.data.access_token);
          console.log('Sending original request:', request);

          // Save new token
          localStorage.setItem(Key.TOKEN, response.data.access_token);

          return next.handle(this.addAuthorizationTokenHeader(request, response.data.access_token));
        }),
        catchError((error) => {
          this.isTokenRefreshing = false;
          console.error('Token refresh failed:', error);
          // Redirect to login or handle token refresh failure
          this.userService.logOut();
          return throwError(() => error);
        })
      );
    } else {
      // Wait for the token to be refreshed
      return this.refreshTokenSubject.pipe(
        filter(response => response !== null),
        take(1),
        switchMap((response) => {
          return next.handle(this.addAuthorizationTokenHeader(request, response.data.access_token));
        })
      );
    }
  }

  private addAuthorizationTokenHeader(request: HttpRequest<unknown>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
