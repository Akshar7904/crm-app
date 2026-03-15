// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Notification, NotificationType } from '../interface/notification';
import { CustomHttpResponse } from '../interface/appstates';

/**
 * Notification API Service
 * Handles all notification-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  private readonly server: string = environment.apiUrl + '/api/v1/notifications';

  // Observable for unread count (for navbar badge)
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  private readonly skipCacheHeaders = new HttpHeaders().set('x-skip-cache', 'true');

  constructor(private http: HttpClient) {}

  // ==================== GET NOTIFICATIONS ====================

  /**
   * Get paginated notifications for current user
   */
  getNotifications$ = (page: number = 0, size: number = 20) =>
    <Observable<CustomHttpResponse<{ notifications: Notification[], totalCount: number, page: number, size: number }>>>
    this.http.get<CustomHttpResponse<{ notifications: Notification[], totalCount: number, page: number, size: number }>>
    (`${this.server}?page=${page}&size=${size}`, { headers: this.skipCacheHeaders })
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get unread notifications
   */
  getUnreadNotifications$ = () =>
    <Observable<CustomHttpResponse<{ notifications: Notification[] }>>>
    this.http.get<CustomHttpResponse<{ notifications: Notification[] }>>
    (`${this.server}/unread`, { headers: this.skipCacheHeaders })
      .pipe(
        tap(response => {
          if (response.data?.notifications) {
            this.unreadCountSubject.next(response.data.notifications.length);
          }
        }),
        catchError(this.handleError)
      );

  /**
   * Get unread notification count
   */
  getUnreadCount$ = () =>
    <Observable<CustomHttpResponse<{ unreadCount: number }>>>
    this.http.get<CustomHttpResponse<{ unreadCount: number }>>
    (`${this.server}/count`, { headers: this.skipCacheHeaders })
      .pipe(
        tap(response => {
          if (response.data?.unreadCount !== undefined) {
            this.unreadCountSubject.next(response.data.unreadCount);
          }
        }),
        catchError(this.handleError)
      );

  /**
   * Get notifications by type
   */
  getNotificationsByType$ = (type: NotificationType) =>
    <Observable<CustomHttpResponse<{ notifications: Notification[] }>>>
    this.http.get<CustomHttpResponse<{ notifications: Notification[] }>>
    (`${this.server}/type/${type}`, { headers: this.skipCacheHeaders })
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  // ==================== NOTIFICATION ACTIONS ====================

  /**
   * Mark a notification as read
   */
  markAsRead$ = (id: number) =>
    <Observable<CustomHttpResponse<any>>>
    this.http.post<CustomHttpResponse<any>>
    (`${this.server}/${id}/read`, {})
      .pipe(
        tap(() => {
          // Decrement unread count
          const current = this.unreadCountSubject.value;
          if (current > 0) {
            this.unreadCountSubject.next(current - 1);
          }
        }),
        catchError(this.handleError)
      );

  /**
   * Mark all notifications as read
   */
  markAllAsRead$ = () =>
    <Observable<CustomHttpResponse<any>>>
    this.http.post<CustomHttpResponse<any>>
    (`${this.server}/read-all`, {})
      .pipe(
        tap(() => {
          this.unreadCountSubject.next(0);
        }),
        catchError(this.handleError)
      );

  /**
   * Delete a notification
   */
  deleteNotification$ = (id: number) =>
    <Observable<CustomHttpResponse<any>>>
    this.http.delete<CustomHttpResponse<any>>
    (`${this.server}/${id}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Delete all notifications
   */
  deleteAllNotifications$ = () =>
    <Observable<CustomHttpResponse<any>>>
    this.http.delete<CustomHttpResponse<any>>
    (`${this.server}/all`)
      .pipe(
        tap(() => {
          this.unreadCountSubject.next(0);
        }),
        catchError(this.handleError)
      );

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Send notification to a user (Admin only)
   */
  sendNotification$ = (notification: Partial<Notification>) =>
    <Observable<CustomHttpResponse<{ notification: Notification }>>>
    this.http.post<CustomHttpResponse<{ notification: Notification }>>
    (`${this.server}/send`, notification)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  // ==================== HELPER METHODS ====================

  /**
   * Refresh unread count
   */
  refreshUnreadCount(): void {
    this.getUnreadCount$().subscribe();
  }

  /**
   * Get current unread count value
   */
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Notification API Error:', error);
    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || error.error?.reason || `Error Code: ${error.status}`;
    }
    return throwError(() => errorMessage);
  }
}
