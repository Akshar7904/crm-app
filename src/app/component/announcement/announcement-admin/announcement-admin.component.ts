import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, map, startWith, catchError, switchMap } from 'rxjs/operators';
import { AnnouncementService } from 'src/app/service/announcement.service';
import { NotificationService } from 'src/app/service/notification.service';
import { Announcement, AnnouncementForm, AnnouncementCategory, Priority, TargetAudience, getCategoryBadgeClass } from 'src/app/interface/notification';
import { DataState } from 'src/app/enum/datastate.enum';

interface AdminState {
  dataState: DataState;
  announcements?: Announcement[];
  count?: number;
  error?: string;
}

@Component({
  standalone: false,
  selector: 'app-announcement-admin',
  templateUrl: './announcement-admin.component.html',
  styleUrls: ['./announcement-admin.component.scss']
})
export class AnnouncementAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  state$: Observable<AdminState>;

  showCreateModal = false;
  showEditModal = false;
  editingAnnouncement: Announcement | null = null;
  isSubmitting = false;

  readonly DataState = DataState;

  readonly categories: AnnouncementCategory[] = [
    'GENERAL', 'POLICY', 'HR', 'IT', 'FINANCE', 'EVENT', 'TRAINING', 'HOLIDAY', 'URGENT'
  ];

  readonly priorities: Priority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

  readonly audiences: { value: TargetAudience; label: string }[] = [
    { value: 'ALL', label: 'All Employees' },
    { value: 'DEPARTMENT', label: 'Specific Department' },
    { value: 'ROLE', label: 'Specific Role' }
  ];

  constructor(
    private announcementService: AnnouncementService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAnnouncements(): void {
    this.state$ = this.refreshTrigger$.pipe(
      switchMap(() => this.announcementService.getAllAnnouncementsForAdmin$()),
      map(response => ({
        dataState: DataState.LOADED,
        announcements: response.data?.announcements || [],
        count: response.data?.count || 0
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

  openCreateModal(): void {
    this.showCreateModal = true;
    this.editingAnnouncement = null;
  }

  openEditModal(announcement: Announcement): void {
    this.editingAnnouncement = { ...announcement };
    this.showEditModal = true;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.editingAnnouncement = null;
  }

  createAnnouncement(form: NgForm): void {
    if (form.invalid) {
      this.notification.onError('Please fill in all required fields');
      return;
    }

    this.isSubmitting = true;
    const formData: AnnouncementForm = {
      title: form.value.title,
      content: form.value.content,
      summary: form.value.summary,
      category: form.value.category || 'GENERAL',
      priority: form.value.priority || 'NORMAL',
      targetAudience: form.value.targetAudience || 'ALL',
      targetDepartmentId: form.value.targetDepartmentId,
      targetRole: form.value.targetRole,
      isPinned: form.value.isPinned || false,
      expiresAt: form.value.expiresAt,
      attachmentUrl: form.value.attachmentUrl
    };

    this.announcementService.createAnnouncement$(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notification.onSuccess('Announcement created successfully');
          this.closeModals();
          this.refresh();
          this.isSubmitting = false;
        },
        error: (err) => {
          this.notification.onError(err);
          this.isSubmitting = false;
        }
      });
  }

  updateAnnouncement(form: NgForm): void {
    if (!this.editingAnnouncement || form.invalid) {
      this.notification.onError('Please fill in all required fields');
      return;
    }

    this.isSubmitting = true;
    const formData: AnnouncementForm = {
      title: form.value.title,
      content: form.value.content,
      summary: form.value.summary,
      category: form.value.category,
      priority: form.value.priority,
      targetAudience: form.value.targetAudience,
      targetDepartmentId: form.value.targetDepartmentId,
      targetRole: form.value.targetRole,
      isPinned: form.value.isPinned,
      expiresAt: form.value.expiresAt,
      attachmentUrl: form.value.attachmentUrl
    };

    this.announcementService.updateAnnouncement$(this.editingAnnouncement.id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notification.onSuccess('Announcement updated successfully');
          this.closeModals();
          this.refresh();
          this.isSubmitting = false;
        },
        error: (err) => {
          this.notification.onError(err);
          this.isSubmitting = false;
        }
      });
  }

  toggleStatus(announcement: Announcement): void {
    const newStatus = !announcement.isActive;
    this.announcementService.toggleStatus$(announcement.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          announcement.isActive = newStatus;
          this.notification.onSuccess(`Announcement ${newStatus ? 'activated' : 'deactivated'}`);
        },
        error: (err) => this.notification.onError(err)
      });
  }

  togglePin(announcement: Announcement): void {
    const newPin = !announcement.isPinned;
    this.announcementService.togglePin$(announcement.id, newPin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          announcement.isPinned = newPin;
          this.notification.onSuccess(`Announcement ${newPin ? 'pinned' : 'unpinned'}`);
        },
        error: (err) => this.notification.onError(err)
      });
  }

  deleteAnnouncement(id: number): void {
    if (confirm('Are you sure you want to delete this announcement?')) {
      this.announcementService.deleteAnnouncement$(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notification.onSuccess('Announcement deleted');
            this.refresh();
          },
          error: (err) => this.notification.onError(err)
        });
    }
  }

  getCategoryBadge(category: string): string {
    return getCategoryBadgeClass(category as any);
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      LOW:    'ann-badge ann-badge-general',
      NORMAL: 'ann-badge ann-badge-it',
      HIGH:   'ann-badge ann-badge-finance',
      URGENT: 'ann-badge ann-badge-urgent'
    };
    return map[priority] || 'ann-badge ann-badge-general';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
