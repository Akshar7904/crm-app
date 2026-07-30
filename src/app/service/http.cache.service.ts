// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

interface CacheEntry {
  response: HttpResponse<any>;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 3 * 60 * 1000;       // 3 minutes — default
const STATIC_TTL_MS  = 60 * 60 * 1000;      // 1 hour   — departments, designations, holidays
const MEDIUM_TTL_MS  = 10 * 60 * 1000;      // 10 minutes — announcements

@Injectable()
export class HttpCacheService {
    private httpResponseCache: { [key: string]: CacheEntry } = {};

    put = (key: string, httpResponse: HttpResponse<any>, ttl: number = DEFAULT_TTL_MS): void => {
        this.httpResponseCache[key] = {
            response: httpResponse,
            expiresAt: Date.now() + ttl
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

    evictByPrefix = (prefix: string): void => {
        Object.keys(this.httpResponseCache).forEach(key => {
            if (key.includes(prefix)) {
                delete this.httpResponseCache[key];
            }
        });
    }

    getTtl = (url: string): number => {
        if (url.includes('/department') || url.includes('/designation') || url.includes('/holiday')) {
            return STATIC_TTL_MS;
        }
        if (url.includes('/announcement')) {
            return MEDIUM_TTL_MS;
        }
        return DEFAULT_TTL_MS;
    }

    logCache = (): void => console.log(this.httpResponseCache);
}
