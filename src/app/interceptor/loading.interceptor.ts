// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent, HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../service/loading.service';

/** URL fragments that should NOT trigger the full-screen loader (polling, badges, silent calls). */
const SKIP_LOADING_PATTERNS = [
  '/notifications/count',
  '/notifications/unread',
  '/kiosk/',
  'x-skip-cache',
];

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const skip = SKIP_LOADING_PATTERNS.some(p =>
      req.url.includes(p) || req.headers.has('x-skip-loading')
    );

    if (skip) {
      return next.handle(req);
    }

    this.loadingService.show();
    return next.handle(req).pipe(
      finalize(() => this.loadingService.hide())
    );
  }
}
