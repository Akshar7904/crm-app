/**
 * Notification Model
 * Personal notifications for employees
 */
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: Priority;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
  icon?: string;
  createdAt: string;
  readAt?: string;
}

/**
 * Announcement Model
 * Company-wide announcements
 */
export interface Announcement {
  id: number;
  title: string;
  content: string;
  summary?: string;
  category: AnnouncementCategory;
  priority: Priority;
  targetAudience: TargetAudience;
  targetDepartmentId?: number;
  targetRole?: string;
  createdBy: number;
  createdByName?: string;
  isActive: boolean;
  isPinned: boolean;
  expiresAt?: string;
  publishAt?: string;
  attachmentUrl?: string;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Form for creating/updating announcements
 */
export interface AnnouncementForm {
  title: string;
  content: string;
  summary?: string;
  category?: AnnouncementCategory;
  priority?: Priority;
  targetAudience?: TargetAudience;
  targetDepartmentId?: number;
  targetRole?: string;
  isPinned?: boolean;
  expiresAt?: string;
  publishAt?: string;
  attachmentUrl?: string;
}

export type NotificationType =
  | 'LEAVE'
  | 'CLAIM'
  | 'PAYSLIP'
  | 'ATTENDANCE'
  | 'PROFILE'
  | 'DOCUMENT'
  | 'APPROVAL'
  | 'SYSTEM';

export type AnnouncementCategory =
  | 'GENERAL'
  | 'POLICY'
  | 'HR'
  | 'IT'
  | 'FINANCE'
  | 'EVENT'
  | 'TRAINING'
  | 'HOLIDAY'
  | 'URGENT';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type TargetAudience = 'ALL' | 'DEPARTMENT' | 'ROLE';

/**
 * Notification state for component
 */
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  loading: boolean;
}

/**
 * Announcement state for component
 */
export interface AnnouncementState {
  announcements: Announcement[];
  pinnedAnnouncements: Announcement[];
  count: number;
  loading: boolean;
}

/**
 * Helper functions
 */
export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    LEAVE: 'bi-calendar-event',
    CLAIM: 'bi-receipt',
    PAYSLIP: 'bi-file-earmark-text',
    ATTENDANCE: 'bi-clock',
    PROFILE: 'bi-person',
    DOCUMENT: 'bi-file-earmark',
    APPROVAL: 'bi-check-circle',
    SYSTEM: 'bi-info-circle'
  };
  return icons[type] || 'bi-bell';
};

export const getPriorityClass = (priority: Priority): string => {
  const classes: Record<Priority, string> = {
    LOW: 'text-secondary',
    NORMAL: 'text-primary',
    HIGH: 'text-warning',
    URGENT: 'text-danger'
  };
  return classes[priority] || 'text-primary';
};

export const getCategoryBadgeClass = (category: AnnouncementCategory): string => {
  const classes: Record<AnnouncementCategory, string> = {
    GENERAL: 'bg-secondary',
    POLICY: 'bg-info',
    HR: 'bg-primary',
    IT: 'bg-dark',
    FINANCE: 'bg-success',
    EVENT: 'bg-purple',
    TRAINING: 'bg-warning',
    HOLIDAY: 'bg-success',
    URGENT: 'bg-danger'
  };
  return classes[category] || 'bg-secondary';
};
