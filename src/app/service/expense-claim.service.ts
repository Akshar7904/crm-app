// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
// expense-claim.service.ts
// Updated to match ExpenseClaimController endpoints

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CustomHttpResponse, Page } from '../interface/appstates';
import { ExpenseClaim, ExpenseClaimApprovalForm, ExpenseClaimStatus } from '../interface/expense-claim.model';
import { UserModel } from '../component/profile/user.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseClaimService {
  private readonly server: string = environment.apiUrl + '/api/v1';

  constructor(private http: HttpClient) {}

  // Shared response type - matches controller response structure
  private mapResponse<T>(obs: Observable<T>): Observable<T> {
    return obs.pipe(tap(console.log), catchError(this.handleError));
  }

  /**
   * Create new expense claim
   * POST /expense-claims/create
   */
  createExpenseClaim$ = (expenseClaim: ExpenseClaim) =>
    this.mapResponse(
      this.http.post<CustomHttpResponse<{ user: UserModel; expenseClaim: ExpenseClaim }>>(
        `${this.server}/expense-claims/create`,
        expenseClaim
      )
    );

  /**
   * Update existing expense claim
   * PUT /expense-claims/update/{id}
   */
  updateExpenseClaim$ = (id: number, expenseClaim: ExpenseClaim) =>
    this.mapResponse(
      this.http.put<CustomHttpResponse<{ user: UserModel; expenseClaim: ExpenseClaim }>>(
        `${this.server}/expense-claims/update/${id}`,
        expenseClaim
      )
    );

  /**
   * Get all expense claims with pagination
   * GET /expense-claims/list?page={page}&size={size}
   */
  expenseClaims$ = (page: number = 0, size: number = 10) =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{ user: UserModel; page: Page<ExpenseClaim>; pendingCount: number }>>(
        `${this.server}/expense-claims/list`,
        { params: { page: page.toString(), size: size.toString() } }
      )
    );

  /**
   * Get expense claims by employee
   * GET /expense-claims/employee/{employeeId}?page={page}&size={size}
   */
  expenseClaimsByEmployee$ = (employeeId: number, page: number = 0, size: number = 10) =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{ user: UserModel; page: Page<ExpenseClaim>; pendingCount: number }>>(
        `${this.server}/expense-claims/employee/${employeeId}`,
        { params: { page: page.toString(), size: size.toString() } }
      )
    );

  /**
   * Get expense claims by status
   * GET /expense-claims/status/{status}?page={page}&size={size}
   */
  expenseClaimsByStatus$ = (status: ExpenseClaimStatus, page: number = 0, size: number = 10) =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{ user: UserModel; page: Page<ExpenseClaim> }>>(
        `${this.server}/expense-claims/status/${status}`,
        { params: { page: page.toString(), size: size.toString() } }
      )
    );

  /**
   * Get single expense claim by ID
   * GET /expense-claims/{id}
   */
  expenseClaim$ = (id: number) =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{ user: UserModel; expenseClaim: ExpenseClaim }>>(
        `${this.server}/expense-claims/${id}`
      )
    );

  /**
   * Search expense claims
   * GET /expense-claims/search?query={query}&page={page}&size={size}
   */
  searchExpenseClaims$ = (query: string, page: number = 0, size: number = 10) =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{ user: UserModel; page: Page<ExpenseClaim> }>>(
        `${this.server}/expense-claims/search`,
        { params: { query, page: page.toString(), size: size.toString() } }
      )
    );

  /**
   * Approve expense claim
   * POST /expense-claims/approve
   */
  approveExpenseClaim$ = (approvalForm: ExpenseClaimApprovalForm) =>
    this.mapResponse(
      this.http.post<CustomHttpResponse<{ user: UserModel; expenseClaim: ExpenseClaim }>>(
        `${this.server}/expense-claims/approve`,
        approvalForm
      )
    );

  /**
   * Reject expense claim
   * POST /expense-claims/reject
   */
  rejectExpenseClaim$ = (approvalForm: ExpenseClaimApprovalForm) =>
    this.mapResponse(
      this.http.post<CustomHttpResponse<{ user: UserModel; expenseClaim: ExpenseClaim }>>(
        `${this.server}/expense-claims/reject`,
        approvalForm
      )
    );

  /**
   * Mark expense claim as paid
   * PUT /expense-claims/mark-paid/{id}?approvedBy={approvedBy}
   */
  markAsPaid$ = (id: number, approvedBy: number) =>
    this.mapResponse(
      this.http.put<CustomHttpResponse<{ user: UserModel; expenseClaim: ExpenseClaim }>>(
        `${this.server}/expense-claims/mark-paid/${id}`,
        {},
        { params: { approvedBy: approvedBy.toString() } }
      )
    );

  /**
   * Cancel expense claim
   * PUT /expense-claims/cancel/{id}?employeeId={employeeId}
   */
  cancelExpenseClaim$ = (id: number, employeeId: number) =>
    this.mapResponse(
      this.http.put<CustomHttpResponse<{ user: UserModel; expenseClaim: ExpenseClaim }>>(
        `${this.server}/expense-claims/cancel/${id}`,
        {},
        { params: { employeeId: employeeId.toString() } }
      )
    );

  /**
   * Delete expense claim
   * DELETE /expense-claims/delete/{id}
   */
  deleteExpenseClaim$ = (id: number) =>
    this.mapResponse(
      this.http.delete<CustomHttpResponse<{ user: UserModel; deleted: boolean }>>(
        `${this.server}/expense-claims/delete/${id}`
      )
    );

  /**
   * Download expense claims report
   * GET /expense-claims/download/report?employeeId={}&status={}&startDate={}&endDate={}
   */
  downloadReport$ = (
    employeeId?: number,
    status?: ExpenseClaimStatus,
    startDate?: string,
    endDate?: string
  ): Observable<Blob> => {
    let params = new HttpParams();

    if (employeeId) {
      params = params.set('employeeId', employeeId.toString());
    }
    if (status) {
      params = params.set('status', status);
    }
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http
      .get(`${this.server}/expense-claims/download/report`, {
        params,
        responseType: 'blob'
      })
      .pipe(catchError(this.handleError));
  };

  /**
   * Upload receipt for an expense claim
   * POST /expense-claims/{id}/receipt
   */
  uploadReceipt$ = (claimId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.server}/expense-claims/${claimId}/receipt`, formData);
  };

  /**
   * Get expense claim statistics
   * GET /expense-claims/statistics
   */
  getStatistics$ = () =>
    this.mapResponse(
      this.http.get<CustomHttpResponse<{
        user: UserModel;
        pendingCount: number;
        monthlyTotal: number
      }>>(
        `${this.server}/expense-claims/statistics`
      )
    );

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage =
      error.error?.reason ||
      error.error?.message ||
      (error.error instanceof ErrorEvent
        ? `A client error occurred - ${error.error.message}`
        : `An error occurred - Error status ${error.status}`);

    return throwError(() => errorMessage);
  }
}
