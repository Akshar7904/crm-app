// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

/**
 * Holiday Model and Interfaces
 * Handles both SA public holidays and custom company holidays
 *
 * @author DeCode
 * @version 2.0.0
 * @since 2025-01-12
 */

/**
 * Holiday Entity
 * Represents a holiday in the system
 */
export interface Holiday {
  id: number;
  holidayName: string;
  holidayDate: string; // ISO date string (YYYY-MM-DD)
  holidayDay: string; // Day of week (Monday, Tuesday, etc.)
  description?: string;
  isRecurring: boolean; // True for annual holidays like Christmas, New Year
  isActive: boolean;
  countryCode: string; // ISO country code (ZA for South Africa)
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number; // User ID of creator
}

/**
 * Holiday Form Data
 * Used when creating or updating holidays
 */
export interface HolidayForm {
  holidayName: string;
  holidayDate: string;
  holidayDay?: string; // Optional, can be auto-calculated from date
  description?: string;
  isRecurring?: boolean; // Default: false
  isActive?: boolean; // Default: true
  countryCode?: string; // Default: 'ZA'
}

/**
 * Holiday Response (Paginated)
 * Response structure for holiday list endpoints
 */
export interface HolidayResponse {
  holidays: Holiday[];
  page: number; // Current page (0-based)
  size: number; // Page size
  totalHolidays: number; // Total number of holidays
  totalPages: number; // Total number of pages
}

/**
 * Holiday Statistics
 * Dashboard statistics for holidays
 */
export interface HolidayStats {
  totalHolidays: number;
  upcomingHolidays: Holiday[];
  currentYearHolidays: number;
  activeHolidays: number;
  publicHolidays: number; // SA public holidays
  customHolidays: number; // Company-specific holidays
}

/**
 * Generic API Response Wrapper
 */
export interface ApiResponse<T> {
  timeStamp: string;
  statusCode: number;
  status: string; // HTTP status text
  message: string;
  data: T;
}

/**
 * SA Public Holidays for 2025
 * These are the official public holidays in South Africa
 */
export const SA_PUBLIC_HOLIDAYS_2025: HolidayForm[] = [
  {
    holidayName: "New Year's Day",
    holidayDate: '2025-01-01',
    holidayDay: 'Wednesday',
    description: 'New Year celebration',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Human Rights Day",
    holidayDate: '2025-03-21',
    holidayDay: 'Friday',
    description: 'Human Rights commemoration',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Good Friday",
    holidayDate: '2025-04-18',
    holidayDay: 'Friday',
    description: 'Good Friday observance',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Family Day",
    holidayDate: '2025-04-21',
    holidayDay: 'Monday',
    description: 'Day after Easter Sunday',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Freedom Day",
    holidayDate: '2025-04-27',
    holidayDay: 'Sunday',
    description: 'Celebration of freedom and democracy',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Freedom Day (Observed)",
    holidayDate: '2025-04-28',
    holidayDay: 'Monday',
    description: 'Freedom Day observed (falls on Sunday)',
    isRecurring: false,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Workers' Day",
    holidayDate: '2025-05-01',
    holidayDay: 'Thursday',
    description: 'International Workers Day',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Youth Day",
    holidayDate: '2025-06-16',
    holidayDay: 'Monday',
    description: 'Commemoration of the 1976 Soweto Uprising',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "National Women's Day",
    holidayDate: '2025-08-09',
    holidayDay: 'Saturday',
    description: 'Celebration of women\'s contributions',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Heritage Day",
    holidayDate: '2025-09-24',
    holidayDay: 'Wednesday',
    description: 'Celebration of South African culture and diversity',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Day of Reconciliation",
    holidayDate: '2025-12-16',
    holidayDay: 'Tuesday',
    description: 'Reconciliation and unity',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Christmas Day",
    holidayDate: '2025-12-25',
    holidayDay: 'Thursday',
    description: 'Christmas celebration',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  },
  {
    holidayName: "Day of Goodwill",
    holidayDate: '2025-12-26',
    holidayDay: 'Friday',
    description: 'Day after Christmas',
    isRecurring: true,
    isActive: true,
    countryCode: 'ZA'
  }
];

/**
 * Holiday Utility Functions
 */
export class HolidayUtils {
  /**
   * Check if a holiday is a SA public holiday
   */
  static isPublicHoliday(holiday: Holiday): boolean {
    return holiday.countryCode === 'ZA' && holiday.isRecurring;
  }

  /**
   * Check if a holiday is a custom/company holiday
   */
  static isCustomHoliday(holiday: Holiday): boolean {
    return !holiday.isRecurring || holiday.countryCode !== 'ZA';
  }

  /**
   * Get holiday type label
   */
  static getHolidayTypeLabel(holiday: Holiday): string {
    if (this.isPublicHoliday(holiday)) {
      return 'Public Holiday';
    } else if (this.isCustomHoliday(holiday)) {
      return 'Company Holiday';
    }
    return 'Holiday';
  }

  /**
   * Format holiday date for display
   */
  static formatHolidayDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Check if holiday is upcoming
   */
  static isUpcoming(dateString: string): boolean {
    const holidayDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  }

  /**
   * Check if holiday is today
   */
  static isToday(dateString: string): boolean {
    const holidayDate = new Date(dateString);
    const today = new Date();
    return (
      holidayDate.getDate() === today.getDate() &&
      holidayDate.getMonth() === today.getMonth() &&
      holidayDate.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Get days until holiday
   */
  static getDaysUntil(dateString: string): number {
    const holidayDate = new Date(dateString);
    const today = new Date();
    holidayDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = holidayDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
