// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Announcement, AnnouncementForm } from '../interface/notification';
import { CustomHttpResponse } from '../interface/appstates';

/**
 * Announcement Service
 * Handles all announcement-related API calls
 */
@Injectable()
export class AnnouncementService {
  private readonly server: string = environment.apiUrl + '/api/v1/announcements';

  constructor(private http: HttpClient) {}

  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Get announcements for current user (filtered by department/role)
   */
  getAnnouncements$ = (page: number = 0, size: number = 10) =>
    <Observable<CustomHttpResponse<{ announcements: Announcement[], count: number }>>>
    this.http.get<CustomHttpResponse<{ announcements: Announcement[], count: number }>>
    (`${this.server}?page=${page}&size=${size}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get single announcement by ID
   */
  getAnnouncement$ = (id: number) =>
    <Observable<CustomHttpResponse<{ announcement: Announcement }>>>
    this.http.get<CustomHttpResponse<{ announcement: Announcement }>>
    (`${this.server}/${id}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get pinned announcements
   */
  getPinnedAnnouncements$ = () =>
    <Observable<CustomHttpResponse<{ announcements: Announcement[] }>>>
    this.http.get<CustomHttpResponse<{ announcements: Announcement[] }>>
    (`${this.server}/pinned`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get announcements by category
   */
  getAnnouncementsByCategory$ = (category: string) =>
    <Observable<CustomHttpResponse<{ announcements: Announcement[] }>>>
    this.http.get<CustomHttpResponse<{ announcements: Announcement[] }>>
    (`${this.server}/category/${category}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all announcements for admin view
   */
  getAllAnnouncementsForAdmin$ = () =>
    <Observable<CustomHttpResponse<{ announcements: Announcement[], count: number }>>>
    this.http.get<CustomHttpResponse<{ announcements: Announcement[], count: number }>>
    (`${this.server}/admin/all`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Create new announcement
   */
  createAnnouncement$ = (announcement: AnnouncementForm) =>
    <Observable<CustomHttpResponse<{ announcement: Announcement }>>>
    this.http.post<CustomHttpResponse<{ announcement: Announcement }>>
    (`${this.server}`, announcement)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Update announcement
   */
  updateAnnouncement$ = (id: number, announcement: AnnouncementForm) =>
    <Observable<CustomHttpResponse<{ announcement: Announcement }>>>
    this.http.put<CustomHttpResponse<{ announcement: Announcement }>>
    (`${this.server}/${id}`, announcement)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Delete announcement
   */
  deleteAnnouncement$ = (id: number) =>
    <Observable<CustomHttpResponse<any>>>
    this.http.delete<CustomHttpResponse<any>>
    (`${this.server}/${id}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Toggle announcement active status
   */
  toggleStatus$ = (id: number, active: boolean) =>
    <Observable<CustomHttpResponse<any>>>
    this.http.post<CustomHttpResponse<any>>
    (`${this.server}/${id}/toggle-status?active=${active}`, {})
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Toggle announcement pin status
   */
  togglePin$ = (id: number, pinned: boolean) =>
    <Observable<CustomHttpResponse<any>>>
    this.http.post<CustomHttpResponse<any>>
    (`${this.server}/${id}/toggle-pin?pinned=${pinned}`, {})
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get announcement statistics
   */
  getStats$ = () =>
    <Observable<CustomHttpResponse<{ activeCount: number }>>>
    this.http.get<CustomHttpResponse<{ activeCount: number }>>
    (`${this.server}/stats`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  // ==================== ERROR HANDLING ====================

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Announcement API Error:', error);
    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || error.error?.reason || `Error Code: ${error.status}`;
    }
    return throwError(() => errorMessage);
  }
}
