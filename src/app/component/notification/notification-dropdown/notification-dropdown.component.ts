// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationApiService } from 'src/app/service/notification-api.service';
import { Notification, getNotificationIcon, getPriorityClass } from 'src/app/interface/notification';

@Component({
  standalone: false,
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  notifications: Notification[] = [];
  isLoading = false;
  hasError  = false;

  unreadCount$ = this.notificationService.unreadCount$;

  constructor(
    private notificationService: NotificationApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.notificationService.refreshUnreadCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.hasError  = false;
    this.notificationService.getUnreadNotifications$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.notifications = response.data?.notifications ?? [];
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.hasError  = true;
        }
      });
  }

  /**
   * Optimistic update: remove from local list immediately so the UI
   * never flickers back to "unread". Server is updated in the background;
   * on error the list is reloaded from source.
   */
  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (notification.isRead) return;

    // Remove optimistically
    this.notifications = this.notifications.filter(n => n.id !== notification.id);

    this.notificationService.markAsRead$(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => {
          // Revert on failure
          this.loadNotifications();
          this.notificationService.refreshUnreadCount();
        }
      });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications = [];
        },
        error: () => {
          this.loadNotifications();
          this.notificationService.refreshUnreadCount();
        }
      });
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.notifications = this.notifications.filter(n => n.id !== id);

    this.notificationService.deleteNotification$(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => {
          this.loadNotifications();
          this.notificationService.refreshUnreadCount();
        }
      });
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.markAsRead(notification, new MouseEvent('click'));
    }
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  getIcon(type: string): string { return getNotificationIcon(type as any); }
  getPriorityClass(p: string): string { return getPriorityClass(p as any); }

  getTimeAgo(dateString: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60)    return 'Just now';
    if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString();
  }
}
