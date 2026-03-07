import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, map, startWith, catchError, switchMap } from 'rxjs/operators';
import { NotificationApiService } from 'src/app/service/notification-api.service';
import { Notification, NotificationType, getNotificationIcon, getPriorityClass } from 'src/app/interface/notification';
import { DataState } from 'src/app/enum/datastate.enum';

interface NotificationListState {
  dataState: DataState;
  notifications?: Notification[];
  totalCount?: number;
  error?: string;
}

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  state$: Observable<NotificationListState>;

  currentPage = 0;
  pageSize = 20;
  selectedFilter: NotificationType | 'ALL' = 'ALL';

  readonly DataState = DataState;
  readonly filters: { value: NotificationType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'LEAVE', label: 'Leave' },
    { value: 'CLAIM', label: 'Claims' },
    { value: 'PAYSLIP', label: 'Payslips' },
    { value: 'ATTENDANCE', label: 'Attendance' },
    { value: 'APPROVAL', label: 'Approvals' },
    { value: 'SYSTEM', label: 'System' }
  ];

  constructor(private notificationService: NotificationApiService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.state$ = this.refreshTrigger$.pipe(
      switchMap(() => {
        if (this.selectedFilter === 'ALL') {
          return this.notificationService.getNotifications$(this.currentPage, this.pageSize);
        } else {
          return this.notificationService.getNotificationsByType$(this.selectedFilter);
        }
      }),
      map(response => ({
        dataState: DataState.LOADED,
        notifications: response.data?.notifications || [],
        totalCount: (response.data as any)?.totalCount || response.data?.notifications?.length || 0
      })),
      startWith({ dataState: DataState.LOADING }),
      catchError(error => of({
        dataState: DataState.ERROR,
        error: error
      }))
    );
  }

  refresh(): void {
    this.refreshTrigger$.next();
  }

  onFilterChange(filter: NotificationType | 'ALL'): void {
    this.selectedFilter = filter;
    this.currentPage = 0;
    this.refresh();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.refresh();
  }

  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead$(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notification.isRead = true;
            this.notificationService.refreshUnreadCount();
          },
          error: (err) => {
            console.error('Error marking as read:', err);
            notification.isRead = false;
            this.notificationService.refreshUnreadCount();
          }
        });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refresh();
          this.notificationService.refreshUnreadCount();
        },
        error: (err) => {
          console.error('Error marking all as read:', err);
          this.refresh();
          this.notificationService.refreshUnreadCount();
        }
      });
  }

  deleteNotification(id: number): void {
    if (confirm('Delete this notification?')) {
      this.notificationService.deleteNotification$(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.refresh();
            this.notificationService.refreshUnreadCount();
          },
          error: (err) => {
            console.error('Error deleting notification:', err);
            this.refresh();
          }
        });
    }
  }

  deleteAllNotifications(): void {
    if (confirm('Delete all notifications? This cannot be undone.')) {
      this.notificationService.deleteAllNotifications$()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.refresh();
            this.notificationService.refreshUnreadCount();
          },
          error: (err) => console.error('Error deleting all:', err)
        });
    }
  }

  getIcon(type: string): string {
    return getNotificationIcon(type as any);
  }

  getPriorityClass(priority: string): string {
    return getPriorityClass(priority as any);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return this.formatDate(dateString);
  }
}
