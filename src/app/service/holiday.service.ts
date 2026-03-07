import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Holiday, HolidayForm, ApiResponse, HolidayResponse } from '../component/holiday/holiday.model';
import { CustomHttpResponse } from '../interface/appstates';

@Injectable({
  providedIn: 'root'
})
export class HolidayService {
  private readonly apiUrl = environment.apiUrl + '/api/v1/holidays';

  // State management with BehaviorSubject
  private holidaySubject = new BehaviorSubject<CustomHttpResponse<HolidayResponse>>(null!);
  public holidays$ = this.holidaySubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Get paginated holidays
   */
  getHolidays$(page: number = 0, size: number = 10): Observable<CustomHttpResponse<HolidayResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<CustomHttpResponse<HolidayResponse>>(this.apiUrl, { params })
      .pipe(
        tap(response => this.holidaySubject.next(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Get holiday by ID
   */
  getHoliday$(id: number): Observable<CustomHttpResponse<{ holiday: Holiday }>> {
    return this.http.get<CustomHttpResponse<{ holiday: Holiday }>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create new holiday
   */
  createHoliday$(holidayForm: HolidayForm): Observable<CustomHttpResponse<{ holiday: Holiday }>> {
    return this.http.post<CustomHttpResponse<{ holiday: Holiday }>>(this.apiUrl, holidayForm)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update holiday
   */
  updateHoliday$(id: number, holidayForm: HolidayForm): Observable<CustomHttpResponse<{ holiday: Holiday }>> {
    return this.http.put<CustomHttpResponse<{ holiday: Holiday }>>(`${this.apiUrl}/${id}`, holidayForm)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete holiday
   */
  deleteHoliday$(id: number): Observable<CustomHttpResponse<{ deleted: boolean }>> {
    return this.http.delete<CustomHttpResponse<{ deleted: boolean }>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Search holidays
   */
  searchHolidays$(searchTerm: string, page: number = 0, size: number = 10): Observable<CustomHttpResponse<HolidayResponse>> {
    const params = new HttpParams()
      .set('name', searchTerm)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<CustomHttpResponse<HolidayResponse>>(`${this.apiUrl}/search`, { params })
      .pipe(
        tap(response => this.holidaySubject.next(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Get active holidays
   */
  getActiveHolidays$(): Observable<CustomHttpResponse<{ holidays: Holiday[] }>> {
    return this.http.get<CustomHttpResponse<{ holidays: Holiday[] }>>(`${this.apiUrl}/active`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get holidays by year
   */
  getHolidaysByYear$(year: number): Observable<CustomHttpResponse<{ holidays: Holiday[], year: number, totalHolidays: number }>> {
    return this.http.get<CustomHttpResponse<{ holidays: Holiday[], year: number, totalHolidays: number }>>(`${this.apiUrl}/year/${year}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get upcoming holidays
   */
  getUpcomingHolidays$(limit: number = 5): Observable<CustomHttpResponse<{ holidays: Holiday[] }>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<CustomHttpResponse<{ holidays: Holiday[] }>>(`${this.apiUrl}/upcoming`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get holidays by date range
   */
  getHolidaysByDateRange$(startDate: string, endDate: string): Observable<CustomHttpResponse<{ holidays: Holiday[], startDate: string, endDate: string }>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<CustomHttpResponse<{ holidays: Holiday[], startDate: string, endDate: string }>>(`${this.apiUrl}/range`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Check if date is a holiday
   */
  isHoliday$(date: string): Observable<CustomHttpResponse<{ date: string, isHoliday: boolean }>> {
    const params = new HttpParams().set('date', date);
    return this.http.get<CustomHttpResponse<{ date: string, isHoliday: boolean }>>(`${this.apiUrl}/check`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('Holiday Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
