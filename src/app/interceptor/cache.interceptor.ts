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
    // Profile is now cached - cache is evicted on any non-GET request (PUT/PATCH/POST)
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

    // Clear cache for non-GET requests and downloads
    if (request.method !== 'GET' || request.url.includes('download')) {
      this.httpCache.evictAll();
      return next.handle(request);
    }

    // ✅ CRITICAL: Use FULL URL with query parameters as cache key
    // This prevents data collision between different endpoints
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
            this.httpCache.put(cacheKey, response);
          }
        })
      );
  }
}
