// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
// employee.service.ts - UPDATED WITH SELF-SERVICE AND DOCUMENT ENDPOINTS
// ✅ Integrates with existing DecodePayroll Angular codebase
// ✅ ALL /employee endpoints use /api/v1 prefix (matches EmployeeController)
// ✅ Added /me endpoints for self-service
// ✅ Added document management endpoints
// ✅ Maintains backward compatibility with existing endpoints

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Employee, EmployeeForm, Department, Designation } from '../component/employee/employee.model';
import { CustomHttpResponse, Page, EmployeeState } from '../interface/appstates';
import { UserModel } from '../component/profile/user.model';
import { EmployeeStats } from '../interface/employee-state';

@Injectable()
export class EmployeeService {
  private readonly server: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ==================== SELF-SERVICE PROFILE ENDPOINTS (NEW) ====================

  /**
   * Get own employee profile
   * GET /api/v1/employee/me
   */
  getMyProfile$ = () => <Observable<CustomHttpResponse<EmployeeState>>>
    this.http.get<CustomHttpResponse<EmployeeState>>
    (`${this.server}/api/v1/employee/me`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Update own employee profile
   * PUT /api/v1/employee/me/update
   */
  updateMyProfile$ = (employeeForm: any) => <Observable<CustomHttpResponse<EmployeeState>>>
    this.http.put<CustomHttpResponse<EmployeeState>>
    (`${this.server}/api/v1/employee/me/update`, employeeForm)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  // ==================== SELF-SERVICE DOCUMENT ENDPOINTS (NEW) ====================

  /**
   * Get own documents
   * GET /api/v1/employee/me/documents
   */
  getMyDocuments$ = () => <Observable<CustomHttpResponse<{ documents: any[], count: number }>>>
    this.http.get<CustomHttpResponse<{ documents: any[], count: number }>>
    (`${this.server}/api/v1/employee/me/documents`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get own documents by type
   * GET /api/v1/employee/me/documents/type/{type}
   */
  getMyDocumentsByType$ = (documentType: string) => <Observable<CustomHttpResponse<{ documents: any[] }>>>
    this.http.get<CustomHttpResponse<{ documents: any[] }>>
    (`${this.server}/api/v1/employee/me/documents/type/${documentType}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Upload own document
   * POST /api/v1/employee/me/documents/upload
   */
  uploadMyDocument$ = (file: File, documentType: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (description) {
      formData.append('description', description);
    }
    return <Observable<CustomHttpResponse<any>>>
      this.http.post<CustomHttpResponse<any>>
      (`${this.server}/api/v1/employee/me/documents/upload`, formData)
        .pipe(
          tap(console.log),
          catchError(this.handleError)
        );
  };

  /**
   * Delete own document
   * DELETE /api/v1/employee/me/documents/{documentId}
   */
  deleteMyDocument$ = (documentId: number) => <Observable<CustomHttpResponse<any>>>
    this.http.delete<CustomHttpResponse<any>>
    (`${this.server}/api/v1/employee/me/documents/${documentId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  // ==================== ADMIN/MANAGER EMPLOYEE ENDPOINTS ====================

  /**
   * Get paginated list of employees
   */
  employees$ = (page: number = 0) => <Observable<CustomHttpResponse<Page<Employee> & UserModel & EmployeeStats>>>
    this.http.get<CustomHttpResponse<Page<Employee> & UserModel & EmployeeStats>>
    (`${this.server}/api/v1/employee/list?page=${page}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employee by ID
   * ✅ FIXED: Uses /api/v1/employee
   */
  employee$ = (employeeId: number) => <Observable<CustomHttpResponse<EmployeeState>>>
    this.http.get<CustomHttpResponse<EmployeeState>>
    (`${this.server}/api/v1/employee/get/${employeeId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employee by employee ID (e.g., LKC0001)
   * ✅ FIXED: Uses /api/v1/employee
   */
  employeeByEmployeeId$ = (employeeId: string) => <Observable<CustomHttpResponse<EmployeeState>>>
    this.http.get<CustomHttpResponse<EmployeeState>>
    (`${this.server}/api/v1/employee/by-employee-id/${employeeId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Search employees by name, email, or employee ID
   * Backend expects 'query' parameter (not 'name')
   */
  searchEmployees$ = (query: string = '', page: number = 0) => <Observable<CustomHttpResponse<Page<Employee> & UserModel>>>
    this.http.get<CustomHttpResponse<Page<Employee> & UserModel>>
    (`${this.server}/api/v1/employee/search?query=${query}&page=${page}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employees by department
   * ✅ FIXED: Uses /api/v1/employee
   */
  employeesByDepartment$ = (departmentId: number) => <Observable<CustomHttpResponse<{ employees: Employee[] } & UserModel>>>
    this.http.get<CustomHttpResponse<{ employees: Employee[] } & UserModel>>
    (`${this.server}/api/v1/employee/by-department/${departmentId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employee by user ID
   * GET /api/v1/employee/by-user/{userId}
   */
  employeeByUserId$ = (userId: number) => <Observable<CustomHttpResponse<EmployeeState>>>
    this.http.get<CustomHttpResponse<EmployeeState>>
    (`${this.server}/api/v1/employee/by-user/${userId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Update existing employee
   * ✅ FIXED: Uses /api/v1/employee
   */
  update$ = (employeeForm: EmployeeForm) => <Observable<CustomHttpResponse<EmployeeState>>>
    this.http.put<CustomHttpResponse<EmployeeState>>
    (`${this.server}/api/v1/employee/update`, employeeForm)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Update employee status (Admin only)
   * PATCH /api/v1/employee/status/{id}?status={status}
   */
  updateEmployeeStatus$ = (employeeId: number, status: string) => {
    const params = new HttpParams().set('status', status);
    return <Observable<CustomHttpResponse<EmployeeState>>>
      this.http.patch<CustomHttpResponse<EmployeeState>>
      (`${this.server}/api/v1/employee/status/${employeeId}`, null, { params })
        .pipe(
          tap(console.log),
          catchError(this.handleError)
        );
  };

  /**
   * Get employee statistics
   */
  employeeStats$ = () => <Observable<CustomHttpResponse<EmployeeStats>>>
    this.http.get<CustomHttpResponse<EmployeeStats>>
    (`${this.server}/api/v1/employee/stats`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employee count by department
   * GET /api/v1/employee/department/{departmentId}/count
   */
  getEmployeeCountByDepartment$ = (departmentId: number) =>
    <Observable<CustomHttpResponse<{ departmentId: number, employeeCount: number }>>>
      this.http.get<CustomHttpResponse<{ departmentId: number, employeeCount: number }>>
      (`${this.server}/api/v1/employee/department/${departmentId}/count`)
        .pipe(
          tap(console.log),
          catchError(this.handleError)
        );

  // ==================== DOCUMENT MANAGEMENT ENDPOINTS (ADMIN/MANAGER) ====================

  /**
   * Get employee documents (Admin/Manager)
   * GET /api/v1/employee/{employeeId}/documents
   */
  getEmployeeDocuments$ = (employeeId: number) => <Observable<CustomHttpResponse<{ documents: any[], count: number }>>>
    this.http.get<CustomHttpResponse<{ documents: any[], count: number }>>
    (`${this.server}/api/v1/employee/${employeeId}/documents`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get employee documents by type (Admin/Manager)
   * GET /api/v1/employee/{employeeId}/documents/type/{documentType}
   */
  getEmployeeDocumentsByType$ = (employeeId: number, documentType: string) =>
    <Observable<CustomHttpResponse<{ documents: any[] }>>>
      this.http.get<CustomHttpResponse<{ documents: any[] }>>
      (`${this.server}/api/v1/employee/${employeeId}/documents/type/${documentType}`)
        .pipe(
          tap(console.log),
          catchError(this.handleError)
        );

  /**
   * Upload document for employee (Admin only)
   * POST /api/v1/employee/{employeeId}/documents/upload
   */
  uploadEmployeeDocument$ = (employeeId: number, file: File, documentType: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (description) {
      formData.append('description', description);
    }
    return <Observable<CustomHttpResponse<any>>>
      this.http.post<CustomHttpResponse<any>>
      (`${this.server}/api/v1/employee/${employeeId}/documents/upload`, formData)
        .pipe(
          tap(console.log),
          catchError(this.handleError)
        );
  };

  /**
   * Get single document
   * GET /api/v1/employee/documents/{documentId}
   */
  getDocument$ = (documentId: number) => <Observable<CustomHttpResponse<{ document: any }>>>
    this.http.get<CustomHttpResponse<{ document: any }>>
    (`${this.server}/api/v1/employee/documents/${documentId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Update document (Admin only)
   * PUT /api/v1/employee/documents/update
   */
  updateDocument$ = (document: any) => <Observable<CustomHttpResponse<{ document: any }>>>
    this.http.put<CustomHttpResponse<{ document: any }>>
    (`${this.server}/api/v1/employee/documents/update`, document)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Verify document (Admin only)
   * PUT /api/v1/employee/documents/{documentId}/verify
   */
  verifyDocument$ = (documentId: number) => <Observable<CustomHttpResponse<any>>>
    this.http.put<CustomHttpResponse<any>>
    (`${this.server}/api/v1/employee/documents/${documentId}/verify`, {})
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Delete document (Admin only)
   * DELETE /api/v1/employee/documents/{documentId}
   */
  deleteDocument$ = (documentId: number) => <Observable<CustomHttpResponse<any>>>
    this.http.delete<CustomHttpResponse<any>>
    (`${this.server}/api/v1/employee/documents/${documentId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Delete all employee documents (Admin only)
   * DELETE /api/v1/employee/{employeeId}/documents/delete-all
   */
  deleteAllEmployeeDocuments$ = (employeeId: number) => <Observable<CustomHttpResponse<any>>>
    this.http.delete<CustomHttpResponse<any>>
    (`${this.server}/api/v1/employee/${employeeId}/documents/delete-all`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Download document by filename
   * Returns blob for file download
   * @deprecated Use downloadDocumentById$ instead
   */
  downloadDocument$ = (filename: string): Observable<Blob> =>
    this.http.get(`${this.server}/api/v1/employee/documents/download/${filename}`, {
      responseType: 'blob'
    }).pipe(
      tap(console.log),
      catchError(this.handleError)
    );

  /**
   * Download document by ID
   * GET /api/v1/employee/documents/download/{documentId}
   * Returns blob for file download
   */
  downloadDocumentById$ = (documentId: number): Observable<Blob> =>
    this.http.get(`${this.server}/api/v1/employee/documents/download/${documentId}`, {
      responseType: 'blob'
    }).pipe(
      tap(console.log),
      catchError(this.handleError)
    );

  /**
   * Get document download URL
   */
  getDocumentDownloadUrl(filename: string): string {
    return `${this.server}/api/v1/employee/documents/download/${filename}`;
  }

  // ==================== LEGACY ENDPOINTS (Keep for backward compatibility) ====================

  /**
   * Create new employee (basic - no invitation)
   * ✅ FIXED: Uses /api/v1/employee
   */
  newEmployee$ = (employeeForm: EmployeeForm) => <Observable<CustomHttpResponse<Employee & UserModel>>>
    this.http.post<CustomHttpResponse<Employee & UserModel>>
    (`${this.server}/api/v1/employee/create`, employeeForm)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Delete/Deactivate employee
   * ✅ FIXED: Uses /api/v1/employee
   */
  deleteEmployee$ = (id: number) => <Observable<CustomHttpResponse<any>>>
    this.http.delete<CustomHttpResponse<any>>
    (`${this.server}/api/v1/employee/delete/${id}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Upload employee photo
   * ✅ FIXED: Uses /api/v1/employee
   */
  uploadPhoto$ = (id: number, file: File) => <Observable<CustomHttpResponse<{ imageUrl: string }>>>
    this.http.put<CustomHttpResponse<{ imageUrl: string }>>
    (`${this.server}/api/v1/employee/photo/${id}`, this.getFormData(file))
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Download employee report
   */
  downloadReport$ = () => <Observable<HttpEvent<Blob>>>
    this.http.get(`${this.server}/api/v1/employee/download/report`,
      { reportProgress: true, observe: 'events', responseType: 'blob' })
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get all departments (for dropdowns)
   */
  departments$ = () => <Observable<CustomHttpResponse<{ departments: Department[] } & UserModel>>>
    this.http.get<CustomHttpResponse<{ departments: Department[] } & UserModel>>
    (`${this.server}/api/v1/departments/all`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Get all designations (for dropdowns)
   */
  designations$ = () => <Observable<CustomHttpResponse<{ designations: Designation[] } & UserModel>>>
    this.http.get<CustomHttpResponse<{ designations: Designation[] } & UserModel>>
    (`${this.server}/api/v1/designations/list`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  /**
   * Create FormData for file upload
   */
  private getFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      errorMessage = `A client error occurred - ${error.error.message}`;
    } else {
      if (error.error.reason) {
        errorMessage = error.error.reason;
        console.log(errorMessage);
      } else {
        errorMessage = `An error occurred - Error status ${error.status}`;
      }
    }
    return throwError(() => errorMessage);
  }
}
