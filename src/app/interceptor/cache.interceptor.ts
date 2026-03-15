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
} from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { HttpCacheService } from '../service/http.cache.service';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {

  constructor(private httpCache: HttpCacheService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> | Observable<HttpResponse<unknown>> {
    // Skip caching for authentication and verification endpoints only
    if (request.url.includes('verify') || request.url.includes('login') || request.url.includes('register')
      || request.url.includes('refresh') || request.url.includes('resetpassword')
      || request.url.includes('new/password')) {
      return next.handle(request);
    }

    // Skip cache for requests with x-skip-cache header (used for real-time data like available assets)
    if (request.headers.has('x-skip-cache')) {
      const cleanedRequest = request.clone({ headers: request.headers.delete('x-skip-cache') });
      return next.handle(cleanedRequest);
    }

    // For non-GET requests: evict only the affected resource, not the entire cache
    if (request.method !== 'GET' || request.url.includes('download') || request.url.includes('export')) {
      const resource = this.getResourceKey(request.url);
      if (resource) {
        this.httpCache.evictByPrefix(resource);
      } else {
        this.httpCache.evictAll();
      }
      return next.handle(request);
    }

    // Use full URL with query parameters as cache key
    const cacheKey = `__${request.urlWithParams}__`;
    const cachedResponse: HttpResponse<any> = this.httpCache.get(cacheKey);

    if (cachedResponse) {
      return of(cachedResponse);
    }

    return this.handleRequestCache(request, next, cacheKey);
  }

  private handleRequestCache(
    request: HttpRequest<any>,
    next: HttpHandler,
    cacheKey: string
  ): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        tap(response => {
          if (response instanceof HttpResponse && request.method !== 'DELETE') {
            const ttl = this.httpCache.getTtl(request.url);
            this.httpCache.put(cacheKey, response, ttl);
          }
        })
      );
  }

  /** Extract the resource segment from the URL: /api/v1/attendance/... -> 'attendance' */
  private getResourceKey(url: string): string {
    const match = url.match(/\/api\/v1\/([^\/]+)/);
    return match ? match[1] : '';
  }
}
