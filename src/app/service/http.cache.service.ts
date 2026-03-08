import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

interface CacheEntry {
  response: HttpResponse<any>;
  expiresAt: number;
}

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

@Injectable()
export class HttpCacheService {
    private httpResponseCache: { [key: string]: CacheEntry } = {};

    put = (key: string, httpResponse: HttpResponse<any>): void => {
        this.httpResponseCache[key] = {
            response: httpResponse,
            expiresAt: Date.now() + CACHE_TTL_MS
        };
    }

    get = (key: string): HttpResponse<any> | null | undefined => {
        const entry = this.httpResponseCache[key];
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            delete this.httpResponseCache[key];
            return null;
        }
        return entry.response;
    }

    evict = (key: string): boolean => delete this.httpResponseCache[key];

    evictAll = (): void => {
        this.httpResponseCache = {};
    }

    logCache = (): void => console.log(this.httpResponseCache);
}
