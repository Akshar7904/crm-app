// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ElementRef, HostListener } from '@angular/core';

/**
 * Calendar Event Interface
 */
export interface CalendarEvent {
  id?: number;
  title: string;
  date: string;
  type: 'holiday' | 'leave' | 'event' | 'announcement' | 'attendance' | 'intern-school';
  description?: string;
  status?: string;
  isRecurring?: boolean;
  countryCode?: string;
  metadata?: {
    isPublicHoliday?: boolean;
    isCustomHoliday?: boolean;
    isAttendance?: boolean;
    checkInTime?: string;
    checkOutTime?: string;
    attendanceType?: string;
    employeeName?: string;
    totalWorkHours?: number | string;
    checkInLocation?: string;
    status?: string;
    [key: string]: any;
  };
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
}

@Component({
  standalone: false,
  selector: 'app-dashboard-calendar',
  templateUrl: './dashboard-calendar.component.html',
  styleUrls: ['./dashboard-calendar.component.scss']
})
export class DashboardCalendarComponent implements OnInit, OnChanges {
  @Input() title: string = 'Calendar';
  @Input() events: CalendarEvent[] = [];
  @Input() upcomingEvents: CalendarEvent[] = [];
  @Input() maxDisplay: number = 5;
  @Output() eventClick = new EventEmitter<CalendarEvent>();

  currentDate: Date = new Date();
  selectedDate: Date | null = null;
  calendarDays: CalendarDay[] = [];
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  showEventsSidebar: boolean = true;

  // Popup state - uses fixed viewport positioning
  popupDay: CalendarDay | null = null;
  popupStyle: { [key: string]: string } = {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.popupDay) {
      const popup = this.elementRef.nativeElement.querySelector('.day-popup');
      if (popup && !popup.contains(event.target)) {
        this.closePopup();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closePopup();
  }

  ngOnInit(): void {
    this.generateCalendar();
  }

  ngOnChanges(): void {
    this.generateCalendar();
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDay);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentLoop = new Date(startDate);
    while (currentLoop <= endDate) {
      const dayDate = new Date(currentLoop);
      const dayEvents = this.getEventsForDate(dayDate);

      this.calendarDays.push({
        date: dayDate,
        dayNumber: dayDate.getDate(),
        isCurrentMonth: dayDate.getMonth() === month,
        isToday: dayDate.getTime() === today.getTime(),
        isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
        events: dayEvents
      });

      currentLoop.setDate(currentLoop.getDate() + 1);
    }
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    const dateStr = this.formatDateToISO(date);
    const allEvents = this.upcomingEvents.length > 0 ? this.upcomingEvents : this.events;

    return allEvents.filter(event => {
      const eventDateStr = event.date.split('T')[0];
      return eventDateStr === dateStr;
    });
  }

  formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.closePopup();
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.closePopup();
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.closePopup();
    this.generateCalendar();
  }

  selectDate(day: CalendarDay, event: MouseEvent): void {
    if (!day.isCurrentMonth) return;
    this.selectedDate = day.date;

    if (day.events.length > 0) {
      event.stopPropagation();
      event.preventDefault();
      this.openPopup(day, event);
    } else {
      this.closePopup();
    }
  }

  openPopup(day: CalendarDay, event: MouseEvent): void {
    const popupW = 300;
    const popupMaxH = 360;
    const margin = 6;

    // Use absolute positioning relative to .ms-calendar (position:relative)
    // so CSS transforms on ancestor cards don't break placement.
    const calendarEl = this.elementRef.nativeElement as HTMLElement;
    const calendarRect = calendarEl.getBoundingClientRect();

    const cell = (event.currentTarget as Element) || (event.target as Element);
    const cellRect = cell?.getBoundingClientRect?.() ?? {
      left: event.clientX, right: event.clientX,
      top: event.clientY, bottom: event.clientY
    };

    // Popup opens below the cell, left-aligned to it — both relative to .ms-calendar
    let left = cellRect.left - calendarRect.left;
    let top = cellRect.bottom - calendarRect.top + 4;

    // Flip left if popup would overflow calendar right edge
    if (left + popupW > calendarRect.width - margin) {
      left = cellRect.right - calendarRect.left - popupW;
    }
    if (left < margin) left = margin;

    // Flip up if popup would overflow calendar bottom edge
    if (top + popupMaxH > calendarRect.height - margin) {
      top = cellRect.top - calendarRect.top - popupMaxH - 4;
    }
    if (top < margin) top = margin;

    this.popupStyle = {
      position: 'absolute',
      top: top + 'px',
      left: left + 'px',
      width: popupW + 'px',
      'max-height': popupMaxH + 'px',
      'z-index': '9999'
    };
    this.popupDay = day;
  }

  closePopup(): void {
    this.popupDay = null;
  }

  onEventClick(event: CalendarEvent, e: MouseEvent): void {
    e.stopPropagation();
    this.eventClick.emit(event);
  }

  getMonthYearDisplay(): string {
    return this.currentDate.toLocaleDateString('en-ZA', {
      month: 'long',
      year: 'numeric'
    });
  }

  getEventTypeClass(event: CalendarEvent): string {
    if (event.type === 'holiday' && event.metadata?.isPublicHoliday) return 'event-public-holiday';
    if (event.type === 'holiday' && event.metadata?.isCustomHoliday) return 'event-custom-holiday';
    if (event.metadata?.isAttendance) return 'event-attendance';
    switch (event.type) {
      case 'holiday': return 'event-holiday';
      case 'leave': return 'event-leave';
      case 'event': return 'event-event';
      case 'announcement': return 'event-announcement';
      case 'attendance': return 'event-attendance';
      case 'intern-school': return 'event-intern-school';
      default: return 'event-default';
    }
  }

  getEventDotColor(event: CalendarEvent): string {
    if (event.type === 'holiday' && event.metadata?.isPublicHoliday) return '#dc3545';
    if (event.type === 'holiday' && event.metadata?.isCustomHoliday) return '#7978E9';
    if (event.metadata?.isAttendance) return '#28a745';
    switch (event.type) {
      case 'holiday': return '#17a2b8';
      case 'leave': return '#ffc107';
      case 'event': return '#005c8f';
      case 'announcement': return '#6610f2';
      case 'attendance': return '#28a745';
      case 'intern-school': return '#6f42c1';
      default: return '#6c757d';
    }
  }

  getEventBadge(event: CalendarEvent): string {
    if (event.metadata?.isPublicHoliday) return 'Public Holiday';
    if (event.metadata?.isCustomHoliday) return 'Company Holiday';
    if (event.metadata?.isAttendance) return 'Attendance';
    switch (event.type) {
      case 'holiday': return 'Holiday';
      case 'leave': return event.status || 'Leave';
      case 'event': return 'Event';
      case 'announcement': return 'Announcement';
      case 'attendance': return 'Attendance';
      case 'intern-school': return 'School Day';
      default: return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  getUpcomingEvents(): CalendarEvent[] {
    const allEvents = this.upcomingEvents.length > 0 ? this.upcomingEvents : this.events;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allEvents
      .filter(event => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, this.maxDisplay);
  }

  getDaysUntil(dateString: string): number {
    const eventDate = new Date(dateString);
    const today = new Date();
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  isSelected(day: CalendarDay): boolean {
    if (!this.selectedDate) return false;
    return day.date.getTime() === this.selectedDate.getTime();
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'WORKING': return 'Working';
      case 'ON_BREAK1': return 'Tea Break 1';
      case 'ON_LUNCH': return 'On Lunch';
      case 'ON_BREAK2': return 'Tea Break 2';
      case 'CLOCKED_OUT': return 'Clocked Out';
      default: return status || '';
    }
  }

  getEventIcon(event: CalendarEvent): string {
    switch (event.type) {
      case 'holiday': return 'bi-calendar-event-fill';
      case 'leave': return 'bi-calendar-x';
      case 'event': return 'bi-megaphone-fill';
      case 'announcement': return 'bi-bell-fill';
      case 'attendance': return 'bi-person-check-fill';
      case 'intern-school': return 'bi-mortarboard-fill';
      default: return 'bi-circle-fill';
    }
  }
}
