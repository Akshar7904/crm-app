import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, map, startWith, catchError, switchMap, tap } from 'rxjs/operators';
import { AnnouncementService } from 'src/app/service/announcement.service';
import { Announcement, AnnouncementCategory, getCategoryBadgeClass, getPriorityClass } from 'src/app/interface/notification';
import { DataState } from 'src/app/enum/datastate.enum';

interface AnnouncementListState {
  dataState: DataState;
  announcements?: Announcement[];
  pinnedAnnouncements?: Announcement[];
  error?: string;
}

@Component({
  selector: 'app-announcement-list',
  templateUrl: './announcement-list.component.html',
  styleUrls: ['./announcement-list.component.scss']
})
export class AnnouncementListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  state$: Observable<AnnouncementListState>;
  selectedCategory: AnnouncementCategory | 'ALL' = 'ALL';
  selectedAnnouncement: Announcement | null = null;

  readonly DataState = DataState;
  readonly categories: { value: AnnouncementCategory | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'GENERAL', label: 'General' },
    { value: 'POLICY', label: 'Policy' },
    { value: 'HR', label: 'HR' },
    { value: 'IT', label: 'IT' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'EVENT', label: 'Events' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'HOLIDAY', label: 'Holidays' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  constructor(private announcementService: AnnouncementService) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAnnouncements(): void {
    this.state$ = this.refreshTrigger$.pipe(
      switchMap(() => {
        if (this.selectedCategory === 'ALL') {
          return this.announcementService.getAnnouncements$();
        } else {
          return this.announcementService.getAnnouncementsByCategory$(this.selectedCategory);
        }
      }),
      map(response => {
        const announcements = response.data?.announcements || [];
        return {
          dataState: DataState.LOADED,
          announcements: announcements.filter(a => !a.isPinned),
          pinnedAnnouncements: announcements.filter(a => a.isPinned)
        };
      }),
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

  onCategoryChange(category: AnnouncementCategory | 'ALL'): void {
    this.selectedCategory = category;
    this.refresh();
  }

  viewAnnouncement(announcement: Announcement): void {
    // Call API to record view and get fresh data
    this.announcementService.getAnnouncement$(announcement.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Use the fresh data from API (which also increments view count)
          this.selectedAnnouncement = response.data?.announcement || announcement;
        },
        error: () => {
          // Fallback to cached data if API fails
          this.selectedAnnouncement = announcement;
        }
      });
  }

  closeModal(): void {
    this.selectedAnnouncement = null;
  }

  getCategoryBadge(category: string): string {
    return getCategoryBadgeClass(category as any);
  }

  getPriorityClass(priority: string): string {
    return getPriorityClass(priority as any);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return this.formatDate(dateString);
  }
}
