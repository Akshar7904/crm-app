import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Designation, DesignationForm } from '../component/designation/designation.model';
import { DesignationState } from '../interface/designation-state';

/**
 * Service for managing designation operations
 */
@Injectable({
  providedIn: 'root'
})
export class DesignationService {
  private readonly apiUrl = environment.apiUrl + '/api/v1/designations';

  // State management
  private designationStateSubject = new BehaviorSubject<DesignationState>({
    designations: [],
    designation: null,
    loading: false,
    error: null,
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10
  });

  public designationState$ = this.designationStateSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get current state
   */
  private get state(): DesignationState {
    return this.designationStateSubject.value;
  }

  /**
   * Update state
   */
  private setState(newState: Partial<DesignationState>): void {
    this.designationStateSubject.next({
      ...this.state,
      ...newState
    });
  }

  /**
   * Get all designations with pagination
   */
  getDesignations(page: number = 0, size: number = 10): Observable<any> {
    this.setState({ loading: true, error: null });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap(response => {
        const pageData = response.data;
        this.setState({
          designations: pageData.designations || [],
          totalElements: pageData.totalItems || 0,
          totalPages: pageData.totalPages || 0,
          currentPage: pageData.currentPage || 0,
          pageSize: size,
          loading: false,
          error: null
        });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.error?.message || 'Failed to load designations' });
        throw error;
      })
    );
  }

  /**
   * Get all designations without pagination (for dropdowns)
   */
  getAllDesignationsList(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/list`).pipe(
      tap(response => {
        // Don't update main state, just return the list
        console.log('Designations list:', response.data.designations);
      }),
      catchError(error => {
        console.error('Error loading designations list:', error);
        throw error;
      })
    );
  }

  /**
   * Get designation by ID
   */
  getDesignation(id: number): Observable<any> {
    this.setState({ loading: true, error: null });

    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        this.setState({
          designation: response.data.designation,
          loading: false
        });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.error?.message || 'Failed to load designation' });
        throw error;
      })
    );
  }

  /**
   * Search designations
   */
  searchDesignations(searchTerm: string, page: number = 0, size: number = 10): Observable<any> {
    this.setState({ loading: true, error: null });

    const params = new HttpParams()
      .set('term', searchTerm)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(`${this.apiUrl}/search`, { params }).pipe(
      tap(response => {
        const pageData = response.data;
        this.setState({
          designations: pageData.designations || [],
          totalElements: pageData.totalItems || 0,
          totalPages: pageData.totalPages || 0,
          currentPage: pageData.currentPage || 0,
          pageSize: size,
          loading: false,
          error: null
        });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.error?.message || 'Failed to search designations' });
        throw error;
      })
    );
  }

  /**
   * Create designation
   */
  createDesignation(form: DesignationForm): Observable<any> {
    this.setState({ loading: true, error: null });

    return this.http.post<any>(this.apiUrl, form).pipe(
      tap(response => {
        this.setState({ loading: false });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.error?.message || 'Failed to create designation' });
        throw error;
      })
    );
  }

  /**
   * Update designation
   */
  updateDesignation(id: number, form: DesignationForm): Observable<any> {
    this.setState({ loading: true, error: null });

    return this.http.put<any>(`${this.apiUrl}/${id}`, form).pipe(
      tap(response => {
        this.setState({ loading: false });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.error?.message || 'Failed to update designation' });
        throw error;
      })
    );
  }

  /**
   * Delete designation
   */
  deleteDesignation(id: number): Observable<any> {
    this.setState({ loading: true, error: null });

    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        // Remove from local state
        const updatedDesignations = this.state.designations.filter(desig => desig.id !== id);
        this.setState({
          designations: updatedDesignations,
          loading: false
        });
      }),
      catchError(error => {
        this.setState({ loading: false, error: error.error?.message || 'Failed to delete designation' });
        throw error;
      })
    );
  }

  /**
   * Get designations by level
   */
  getDesignationsByLevel(level: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/level/${level}`).pipe(
      tap(response => {
        console.log('Designations by level:', response.data.designations);
      }),
      catchError(error => {
        console.error('Error loading designations by level:', error);
        throw error;
      })
    );
  }

  /**
   * Get designation count
   */
  getDesignationCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/count`);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.setState({ error: null });
  }

  /**
   * Reset state
   */
  resetState(): void {
    this.setState({
      designations: [],
      designation: null,
      loading: false,
      error: null,
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10
    });
  }
}
