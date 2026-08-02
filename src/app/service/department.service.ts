// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, EMPTY } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Department, DepartmentForm } from '../component/department/department.model';
import { DepartmentState } from '../interface/department-state';

/**
 * Service for managing department operations
 * Implements reactive state management with BehaviorSubject
 */
@Injectable()
export class DepartmentService {
  private readonly apiUrl = environment.apiUrl + '/api/v1/departments';

  // State management with BehaviorSubject for real-time updates
  private departmentStateSubject = new BehaviorSubject<DepartmentState>({
    departments: [],
    department: null,
    loading: false,
    error: null,
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10
  });

  public departmentState$ = this.departmentStateSubject.asObservable();

  private loadedKeys = new Set<string>();

  constructor(private http: HttpClient) {}

  /**
   * Get current state
   */
  private get state(): DepartmentState {
    return this.departmentStateSubject.value;
  }

  /**
   * Update state - triggers real-time updates to all subscribers
   */
  private setState(newState: Partial<DepartmentState>): void {
    const updatedState = {
      ...this.state,
      ...newState
    };
    console.log('🔄 Setting new state:', updatedState);
    this.departmentStateSubject.next(updatedState);
  }

  /**
   * Get all departments with pagination
   */
  getDepartments(page: number = 0, size: number = 10, force: boolean = false): Observable<any> {
    const cacheKey = `list:${page}:${size}`;
    if (!force && this.loadedKeys.has(cacheKey)) {
      return EMPTY;
    }
    console.log(`📞 Calling getDepartments(page=${page}, size=${size})`);
    this.setState({ loading: true, error: null });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const url = `${this.apiUrl}?page=${page}&size=${size}`;
    console.log('📡 Request URL:', url);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap(response => {
        console.log('✅ Raw API Response:', response);
        console.log('📦 Response.data:', response.data);

        // Extract departments array from response
        let departments: Department[] = [];
        let totalElements = 0;
        let totalPages = 0;
        let currentPage = page;

        // Check the structure of the response
        if (response && response.data) {
          console.log('🔍 Analyzing response.data structure...');
          console.log('  - Is response.data an array?', Array.isArray(response.data));
          console.log('  - response.data.departments exists?', !!response.data.departments);
          console.log('  - response.data.content exists?', !!response.data.content);
          console.log('  - response.data.page exists?', !!response.data.page);

          // Try multiple structures
          if (Array.isArray(response.data.departments)) {
            console.log('✓ Found: response.data.departments (array)');
            departments = response.data.departments;
            totalElements = response.data.totalItems || response.data.totalElements || departments.length;
            totalPages = response.data.totalPages || 1;
            currentPage = response.data.currentPage || page;
          } else if (response.data.departments?.content && Array.isArray(response.data.departments.content)) {
            console.log('✓ Found: response.data.departments.content (paginated)');
            departments = response.data.departments.content;
            totalElements = response.data.departments.totalElements || departments.length;
            totalPages = response.data.departments.totalPages || 1;
            currentPage = response.data.departments.number || page;
          } else if (Array.isArray(response.data.content)) {
            console.log('✓ Found: response.data.content (paginated)');
            departments = response.data.content;
            totalElements = response.data.totalElements || departments.length;
            totalPages = response.data.totalPages || 1;
            currentPage = response.data.currentPage || response.data.number || page;
          } else if (Array.isArray(response.data)) {
            console.log('✓ Found: response.data (direct array)');
            departments = response.data;
            totalElements = departments.length;
            totalPages = 1;
          } else if (response.data.page) {
            console.log('✓ Found: response.data.page structure');
            if (Array.isArray(response.data.page.content)) {
              departments = response.data.page.content;
            } else if (Array.isArray(response.data.page)) {
              departments = response.data.page;
            }
            totalElements = response.data.totalElements || departments.length;
            totalPages = response.data.totalPages || 1;
            currentPage = response.data.currentPage || page;
          } else {
            console.log('❌ Unknown structure, printing full response.data:');
            console.log(JSON.stringify(response.data, null, 2));
          }
        } else {
          console.log('❌ No response.data found');
        }

        console.log('📊 Extracted data:');
        console.log('  - Departments array:', departments);
        console.log('  - Array length:', departments.length);
        console.log('  - Total elements:', totalElements);
        console.log('  - Total pages:', totalPages);
        console.log('  - Current page:', currentPage);

        // Make sure we have an array
        if (!Array.isArray(departments)) {
          console.error('❌ Departments is not an array! Type:', typeof departments);
          console.error('❌ Departments value:', departments);
          departments = [];
        }

        const newState = {
          departments: departments,
          totalElements: totalElements,
          totalPages: totalPages,
          currentPage: currentPage,
          pageSize: size,
          loading: false
        };

        console.log('💾 Saving state:', newState);
        this.setState(newState);
        this.loadedKeys.add(cacheKey);
      }),
      catchError(error => {
        console.error('❌ Error loading departments:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);

        this.setState({
          loading: false,
          departments: [],
          error: error.error?.message || error.message || 'Failed to load departments'
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all departments without pagination (for dropdowns)
   */
  getAllDepartments(): Observable<Department[]> {
    console.log('📞 Calling getAllDepartments()');

    return this.http.get<any>(`${this.apiUrl}/all`).pipe(
      map(response => {
        console.log('✅ Get all departments response:', response);

        let departments: Department[] = [];

        if (response.data) {
          if (Array.isArray(response.data.departments)) {
            departments = response.data.departments;
          } else if (Array.isArray(response.data)) {
            departments = response.data;
          }
        }

        console.log('📊 Extracted departments:', departments);
        return Array.isArray(departments) ? departments : [];
      }),
      tap(departments => {
        this.setState({
          departments: departments
        });
      }),
      catchError(error => {
        console.error('❌ Error loading all departments:', error);
        this.setState({ error: error.error?.message || 'Failed to load departments' });
        return throwError(() => error);
      })
    );
  }

  /**
   * Search departments
   */
  searchDepartments(query: string, page: number = 0, size: number = 10, force: boolean = false): Observable<any> {
    const cacheKey = `search:${query}:${page}:${size}`;
    if (!force && this.loadedKeys.has(cacheKey)) {
      return EMPTY;
    }
    console.log(`📞 Calling searchDepartments(query="${query}", page=${page}, size=${size})`);
    this.setState({ loading: true, error: null });

    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(`${this.apiUrl}/search`, { params }).pipe(
      tap(response => {
        console.log('✅ Search departments response:', response);

        let departments: Department[] = [];
        let totalElements = 0;
        let totalPages = 0;

        if (response.data) {
          if (Array.isArray(response.data.departments)) {
            departments = response.data.departments;
            totalElements = response.data.totalItems || response.data.totalElements || departments.length;
            totalPages = response.data.totalPages || 1;
          } else if (response.data.departments?.content) {
            departments = response.data.departments.content;
            totalElements = response.data.departments.totalElements || departments.length;
            totalPages = response.data.departments.totalPages || 1;
          } else if (Array.isArray(response.data.content)) {
            departments = response.data.content;
            totalElements = response.data.totalElements || departments.length;
            totalPages = response.data.totalPages || 1;
          } else if (Array.isArray(response.data)) {
            departments = response.data;
            totalElements = departments.length;
            totalPages = 1;
          }
        }

        console.log('📊 Extracted departments:', departments, 'Length:', departments.length);

        if (!Array.isArray(departments)) {
          console.error('❌ Departments is not an array:', departments);
          departments = [];
        }

        this.setState({
          departments: departments,
          totalElements: totalElements,
          totalPages: totalPages,
          currentPage: page,
          pageSize: size,
          loading: false
        });
        this.loadedKeys.add(cacheKey);
      }),
      catchError(error => {
        console.error('❌ Error searching departments:', error);
        this.setState({
          loading: false,
          departments: [],
          error: error.error?.message || 'Search failed'
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Get department by ID
   */
  getDepartmentById(id: number): Observable<Department> {
    this.setState({ loading: true, error: null });

    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        console.log('Get department by ID response:', response);
        return response.data?.department || response.data;
      }),
      tap(department => {
        this.setState({
          department: department,
          loading: false
        });
      }),
      catchError(error => {
        console.error('Error loading department:', error);
        this.setState({
          loading: false,
          error: error.error?.message || 'Failed to load department'
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new department
   */
  createDepartment(form: DepartmentForm): Observable<Department> {
    this.setState({ loading: true, error: null });

    return this.http.post<any>(this.apiUrl, form).pipe(
      map(response => {
        console.log('Create department response:', response);
        return response.data?.department || response.data;
      }),
      tap(() => {
        this.loadedKeys.clear();
        this.setState({ loading: false });
      }),
      catchError(error => {
        console.error('Error creating department:', error);
        this.setState({
          loading: false,
          error: error.error?.message || 'Failed to create department'
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing department
   */
  updateDepartment(id: number, form: DepartmentForm): Observable<Department> {
    this.setState({ loading: true, error: null });

    return this.http.put<any>(`${this.apiUrl}/${id}`, form).pipe(
      map(response => {
        console.log('Update department response:', response);
        return response.data?.department || response.data;
      }),
      tap(() => {
        this.loadedKeys.clear();
        this.setState({ loading: false });
      }),
      catchError(error => {
        console.error('Error updating department:', error);
        this.setState({
          loading: false,
          error: error.error?.message || 'Failed to update department'
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete department
   */
  deleteDepartment(id: number): Observable<any> {
    this.setState({ loading: true, error: null });

    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        this.loadedKeys.clear();
        console.log('Delete department response:', response);
        const updatedDepartments = this.state.departments.filter(dept => dept.id !== id);
        this.setState({
          departments: updatedDepartments,
          totalElements: this.state.totalElements - 1,
          loading: false
        });
      }),
      catchError(error => {
        console.error('Error deleting department:', error);
        this.setState({
          loading: false,
          error: error.error?.message || 'Failed to delete department'
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Get departments by manager
   */
  getDepartmentsByManager(managerId: number): Observable<Department[]> {
    return this.http.get<any>(`${this.apiUrl}/manager/${managerId}`).pipe(
      map(response => {
        console.log('Get departments by manager response:', response);
        const departments = response.data?.departments || [];
        return Array.isArray(departments) ? departments : [];
      }),
      tap(departments => {
        this.setState({
          departments: departments
        });
      }),
      catchError(error => {
        console.error('Error loading departments by manager:', error);
        this.setState({ error: error.error?.message || 'Failed to load departments' });
        return throwError(() => error);
      })
    );
  }

  /**
   * Get department count
   */
  getDepartmentCount(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/count`).pipe(
      map(response => {
        console.log('Get department count response:', response);
        return response.data?.count || 0;
      }),
      catchError(error => {
        console.error('Error getting department count:', error);
        return throwError(() => error);
      })
    );
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
      departments: [],
      department: null,
      loading: false,
      error: null,
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10
    });
  }
}
