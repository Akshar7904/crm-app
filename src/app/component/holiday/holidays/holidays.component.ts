import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, catchError, map, startWith } from 'rxjs';
import { HolidayService } from '../../../service/holiday.service';
import { Holiday } from '../holiday.model';
import { DataState } from '../../../enum/datastate.enum';
import { HolidayState } from '../../../interface/holiday-state';
import { NotificationService } from '../../../service/notification.service';

/**
 * Holidays List Component
 * Fixed pagination issue - state is now passed from template
 *
 * @author DeCode
 * @version 1.0.3
 * @since 2025-01-10
 */
@Component({
  selector: 'app-holidays',
  templateUrl: './holidays.component.html',
  styleUrls: ['./holidays.component.scss']
})
export class HolidaysComponent implements OnInit {
  holidayState$!: Observable<HolidayState>;
  private dataSubject = new BehaviorSubject<HolidayState>({ dataState: DataState.LOADING });
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  readonly DataState = DataState;
  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();
  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();

  // Cache for optimization
  private lastHolidays: Holiday[] = [];

  constructor(
    private holidayService: HolidayService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadHolidays(0);
  }

  /**
   * Load holidays with pagination
   */
  loadHolidays(page: number = 0, size: number = 10): void {
    console.log('🔵 Loading holidays...', { page, size });

    this.holidayState$ = this.holidayService.getHolidays$(page, size)
      .pipe(
        map(response => {
          console.log('🟢 API Response:', {
            currentPage: response.data.page,
            totalPages: response.data.totalPages,
            totalHolidays: response.data.totalHolidays,
            holidaysCount: response.data.holidays?.length
          });

          this.currentPageSubject.next(response.data.page);
          this.searchTermSubject.next('');

          const newState = {
            dataState: DataState.LOADED,
            appData: {
              holidays: response.data.holidays,
              page: response.data.page,
              size: response.data.size,
              totalHolidays: response.data.totalHolidays,
              totalPages: response.data.totalPages,
              searchTerm: ''
            }
          };

          return newState;
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: any) => {
          console.error('🔴 API Error:', error);
          this.notificationService.onError(error.message || error);
          return of({
            dataState: DataState.ERROR,
            error: error.message || error
          });
        })
      );
  }

  /**
   * Search holidays
   */
  searchHolidays(searchForm: NgForm): void {
    const searchTerm = searchForm.value.searchTerm?.trim();

    if (!searchTerm) {
      this.loadHolidays(0);
      return;
    }

    this.searchHolidaysWithPagination(searchTerm, 0, 10);
  }

  /**
   * Search holidays with pagination
   */
  searchHolidaysWithPagination(searchTerm: string, page: number, size: number): void {
    console.log('🔵 Searching holidays...', { searchTerm, page, size });

    this.holidayState$ = this.holidayService.searchHolidays$(searchTerm, page, size)
      .pipe(
        map(response => {
          console.log('✅ Search Response:', response);

          this.currentPageSubject.next(response.data.page);
          this.searchTermSubject.next(searchTerm);

          const newState = {
            dataState: DataState.LOADED,
            appData: {
              holidays: response.data.holidays,
              page: response.data.page,
              size: response.data.size,
              totalHolidays: response.data.totalHolidays || 0,
              totalPages: response.data.totalPages,
              searchTerm: searchTerm
            }
          };

          return newState;
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          console.error('❌ Search error:', error);
          this.notificationService.onError(error);
          return of({
            dataState: DataState.ERROR,
            error
          });
        })
      );
  }

  /**
   * Navigate to specific page
   * ✅ FIXED: Now accepts state parameter from template
   */
  goToPage(page: number, state: any): void {
    console.log('🔵 goToPage called with:', { page, hasState: !!state });

    if (!state || state.dataState !== DataState.LOADED) {
      console.warn('⚠️ Cannot navigate - invalid state');
      return;
    }

    const totalPages = this.getTotalPages(state);
    console.log('🔵 Navigation details:', { page, totalPages });

    // Validate page number (page is 0-based)
    if (page < 0 || page >= totalPages) {
      console.warn('⚠️ Invalid page navigation attempt:', page, 'Total pages:', totalPages);
      return;
    }

    const searchTerm = state.appData?.searchTerm || '';
    const pageSize = state.appData?.size || 10;

    console.log('✅ Executing navigation:', { page, searchTerm, pageSize });

    if (searchTerm) {
      this.searchHolidaysWithPagination(searchTerm, page, pageSize);
    } else {
      this.loadHolidays(page, pageSize);
    }
  }

  /**
   * Navigate to next or previous page
   * ✅ FIXED: Now accepts state parameter from template
   */
  goToNextOrPreviousPage(direction: 'previous' | 'next', state: any): void {
    console.log('🔵 goToNextOrPreviousPage:', direction);

    if (!state || state.dataState !== DataState.LOADED) {
      console.warn('⚠️ Cannot navigate - invalid state');
      return;
    }

    const currentPage = state.appData?.page || 0;
    const totalPages = this.getTotalPages(state);

    let newPage: number;

    if (direction === 'previous') {
      newPage = Math.max(0, currentPage - 1);
    } else {
      newPage = Math.min(totalPages - 1, currentPage + 1);
    }

    console.log('🔵 Page navigation:', { direction, currentPage, newPage, totalPages });

    // Only navigate if page actually changes
    if (newPage !== currentPage) {
      this.goToPage(newPage, state);
    } else {
      console.log('⚠️ Page navigation blocked - same page');
    }
  }

  /**
   * Get page numbers for pagination display (1-based for UI)
   */
  getPageNumbers(state: any): (number | string)[] {
    if (!state || state.dataState !== DataState.LOADED) {
      return [];
    }

    const currentPage = state.appData?.page || 0;
    const totalPages = this.getTotalPages(state);
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return [];
    }

    // Always show first page (1-based)
    pages.push(1);

    if (totalPages <= 7) {
      // Show all pages for small number of pages
      for (let i = 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate range around current page (convert to 1-based for display)
      const currentPage1Based = currentPage + 1;
      const startPage = Math.max(2, currentPage1Based - 1);
      const endPage = Math.min(totalPages - 1, currentPage1Based + 1);

      // Add ellipsis if needed before middle pages
      if (startPage > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed after middle pages
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }

  /**
   * Select holiday and navigate to detail
   */
  selectHoliday(holiday: Holiday): void {
    if (!holiday || !holiday.id || isNaN(Number(holiday.id))) {
      console.error('❌ Invalid holiday:', holiday);
      this.notificationService.onError('Invalid holiday selected');
      return;
    }

    console.log('✅ Navigating to holiday:', holiday.id);
    this.router.navigate(['/holidays', holiday.id]);
  }

  /**
   * Navigate to create new holiday
   */
  addNewHoliday(): void {
    this.router.navigate(['/holidays/new']);
  }

  /**
   * Delete holiday
   */
  deleteHoliday(holiday: Holiday, event: Event): void {
    event.stopPropagation();

    if (!holiday || !holiday.id || isNaN(Number(holiday.id))) {
      console.error('❌ Invalid holiday for deletion:', holiday);
      this.notificationService.onError('Cannot delete: Invalid holiday');
      return;
    }

    if (confirm(`Are you sure you want to delete "${holiday.holidayName}"?`)) {
      this.isLoadingSubject.next(true);

      this.holidayService.deleteHoliday$(holiday.id).subscribe({
        next: (response) => {
          console.log('✅ Holiday deleted:', response);
          this.notificationService.onSuccess(response.message);
          // Reload current page
          this.loadHolidays(this.currentPageSubject.value);
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          console.error('❌ Delete error:', error);
          this.notificationService.onError(error);
          this.isLoadingSubject.next(false);
        }
      });
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get day of week
   */
  getDayOfWeek(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { weekday: 'long' });
  }

  /**
   * Check if holiday is upcoming
   */
  isUpcoming(dateString: string): boolean {
    const holidayDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  }

  /**
   * Get total pages from state
   */
  getTotalPages(state: any): number {
    if (!state || !state.appData) return 1;

    const totalHolidays = state.appData?.totalHolidays || 0;
    const pageSize = state.appData?.size || 10;
    const totalPages = Math.ceil(totalHolidays / pageSize);
    return totalPages > 0 ? totalPages : 1;
  }

  /**
   * Get holidays array from state (optimized)
   */
  getHolidays(state: any): Holiday[] {
    if (!state || !state.appData) return [];

    const holidays = state.appData?.holidays || [];
    // Only log when the array actually changes
    if (holidays.length > 0 && holidays !== this.lastHolidays) {
      console.log('📋 Displaying holidays:', holidays.length, 'items');
      this.lastHolidays = holidays;
    }
    return holidays;
  }

  /**
   * Get current page for display (1-based)
   */
  getCurrentPage(state: any): number {
    if (!state || !state.appData) return 1;
    return (state.appData?.page || 0) + 1;
  }
}
