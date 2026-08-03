// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpParams} from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';
import { CustomHttpResponse, Page } from '../interface/appstates';
import { Payroll, PayrollDTO } from '../interface/payroll';

export interface PayrollStats {
  totalPayrolls: number;
  draftPayrolls: number;
  processedPayrolls: number;
  paidPayrolls: number;
}

@Injectable()
export class PayrollService {

  private readonly server = environment.apiUrl + '/api/v1';

  private payrollsSubject = new BehaviorSubject<CustomHttpResponse<Page<Payroll>> | null>(null);
  public payrolls$ = this.payrollsSubject.asObservable();
  private listCache = new Map<string, Observable<CustomHttpResponse<Page<Payroll>>>>();

  constructor(private http: HttpClient) {}

  initiatePayment(payrollId: number): Observable<CustomHttpResponse<{ paymentUrl: string; formData: Record<string, string> }>> {
    console.log(`🌐 PayrollService.initiatePayment() calling: ${this.server}/payroll/${payrollId}/pay`);
    return this.http.post<CustomHttpResponse<{ paymentUrl: string; formData: Record<string, string> }>>(
      `${this.server}/payroll/${payrollId}/pay`,
      null
    ).pipe(
      tap(response => console.log('✅ PayrollService.initiatePayment() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.initiatePayment() error:', err);
        throw err;
      })
    );
  }

  /** Check payment status */
  checkPaymentStatus(payrollId: number): Observable<CustomHttpResponse<{ status: string }>> {
    console.log(`🌐 PayrollService.checkPaymentStatus() calling: ${this.server}/payroll/${payrollId}/payment-status`);
    return this.http.get<CustomHttpResponse<{ status: string }>>(
      `${this.server}/payroll/${payrollId}/payment-status`
    ).pipe(
      tap(response => console.log('✅ PayrollService.checkPaymentStatus() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.checkPaymentStatus() error:', err);
        throw err;
      })
    );
  }

  /** Get payment transactions */
  getPaymentTransactions(employeeId?: number): Observable<CustomHttpResponse<{ transactions: any[] }>> {
    const url = employeeId
      ? `${this.server}/payroll/payment-transactions/employee/${employeeId}`
      : `${this.server}/payroll/payment-transactions`;

    console.log(`🌐 PayrollService.getPaymentTransactions() calling: ${url}`);
    return this.http.get<CustomHttpResponse<{ transactions: any[] }>>(url).pipe(
      tap(response => console.log('✅ PayrollService.getPaymentTransactions() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.getPaymentTransactions() error:', err);
        throw err;
      })
    );
  }

  /** Verify payment by reference */
  verifyPayment(reference: string): Observable<CustomHttpResponse<any>> {
    console.log(`🌐 PayrollService.verifyPayment() calling: ${this.server}/payroll/verify-payment/${reference}`);
    return this.http.get<CustomHttpResponse<any>>(
      `${this.server}/payroll/verify-payment/${reference}`
    ).pipe(
      tap(response => console.log('✅ PayrollService.verifyPayment() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.verifyPayment() error:', err);
        throw err;
      })
    );
  }

  /** Bulk payment */
  initiateBulkPayment(payrollIds: number[]): Observable<CustomHttpResponse<{ transactions: any[], total: number }>> {
    console.log(`🌐 PayrollService.initiateBulkPayment() calling: ${this.server}/payroll/pay-bulk`);
    return this.http.post<CustomHttpResponse<{ transactions: any[], total: number }>>(
      `${this.server}/payroll/pay-bulk`,
      { payroll_ids: payrollIds }
    ).pipe(
      tap(response => console.log('✅ PayrollService.initiateBulkPayment() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.initiateBulkPayment() error:', err);
        throw err;
      })
    );
  }

  /** Get all payrolls with pagination */
  getPayrolls(page: number = 0, size: number = 10):
    Observable<CustomHttpResponse<Page<Payroll>>> {
    const key = `list:${page}:${size}`;
    if (this.listCache.has(key)) {
      return this.listCache.get(key)!;
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    console.log(`🌐 PayrollService.getPayrolls() calling: ${this.server}/payroll?page=${page}&size=${size}`);

    const obs = this.http.get<CustomHttpResponse<any>>(
      `${this.server}/payroll`,
      { params }
    ).pipe(
      tap(response => {
        console.log('✅ PayrollService received response:', response);

        // Transform backend response to match frontend expectations
        const transformedResponse: CustomHttpResponse<Page<Payroll>> = {
          timestamp: response.timestamp,
          statusCode: response.statusCode,
          status: response.status,
          message: response.message,
          data: {
            content: response.data.payrolls || [],
            totalElements: response.data.totalElements || 0,
            totalPages: response.data.totalPages || 0,
            size: response.data.size || size,
            numberOfElements: response.data.payrolls?.length || 0,
            number: response.data.page || page
          }
        };

        console.log('📦 Transformed response:', transformedResponse);
        this.payrollsSubject.next(transformedResponse);
      }),
      catchError(err => {
        this.listCache.delete(key);
        console.error('❌ PayrollService error:', err);
        throw err;
      }),
      shareReplay(1)
    );
    this.listCache.set(key, obs);
    return obs;
  }

  /** Get payroll by ID */
  getPayroll(id: number): Observable<CustomHttpResponse<{ payroll: Payroll }>> {
    console.log(`🌐 PayrollService.getPayroll() calling: ${this.server}/payroll/${id}`);
    return this.http.get<CustomHttpResponse<{ payroll: Payroll }>>(
      `${this.server}/payroll/${id}`
    ).pipe(
      tap(response => console.log('✅ PayrollService.getPayroll() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.getPayroll() error:', err);
        throw err;
      })
    );
  }

  /** Payrolls for an employee (Admin endpoint) */
  getEmployeePayrolls(employeeId: number):
    Observable<CustomHttpResponse<{ payrolls: Payroll[] }>> {

    console.log(`🌐 PayrollService.getEmployeePayrolls() calling: ${this.server}/payroll/employee/${employeeId}`);
    return this.http.get<CustomHttpResponse<{ payrolls: Payroll[] }>>(
      `${this.server}/payroll/employee/${employeeId}`
    ).pipe(
      tap(response => console.log('✅ PayrollService.getEmployeePayrolls() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.getEmployeePayrolls() error:', err);
        throw err;
      })
    );
  }

  /**
   * Get current user's own payrolls (Self-service endpoint)
   * ✅ No special permissions required - employees can access their own payroll data
   */
  getMyPayrolls(): Observable<CustomHttpResponse<{ payrolls: Payroll[] }>> {
    console.log(`🌐 PayrollService.getMyPayrolls() calling: ${this.server}/payroll/my-payrolls`);
    return this.http.get<CustomHttpResponse<{ payrolls: Payroll[] }>>(
      `${this.server}/payroll/my-payrolls`
    ).pipe(
      tap(response => console.log('✅ PayrollService.getMyPayrolls() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.getMyPayrolls() error:', err);
        throw err;
      })
    );
  }

  /**
   * Get a specific payroll record for current user (Self-service endpoint)
   * ✅ No special permissions required - employees can view their own payslips
   */
  getMyPayroll(payrollId: number): Observable<CustomHttpResponse<{ payroll: Payroll }>> {
    console.log(`🌐 PayrollService.getMyPayroll() calling: ${this.server}/payroll/my-payroll/${payrollId}`);
    return this.http.get<CustomHttpResponse<{ payroll: Payroll }>>(
      `${this.server}/payroll/my-payroll/${payrollId}`
    ).pipe(
      tap(response => console.log('✅ PayrollService.getMyPayroll() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.getMyPayroll() error:', err);
        throw err;
      })
    );
  }

  /** Payrolls by status */
  getPayrollsByStatus(status: string):
    Observable<CustomHttpResponse<Page<Payroll>>> {
    const key = `status:${status}`;
    if (this.listCache.has(key)) {
      return this.listCache.get(key)!;
    }

    console.log(`🌐 PayrollService.getPayrollsByStatus() calling: ${this.server}/payroll/status/${status}`);

    const obs = this.http.get<CustomHttpResponse<any>>(
      `${this.server}/payroll/status/${status}`
    ).pipe(
      tap(response => {
        console.log('✅ PayrollService (by status) received response:', response);

        // Transform array response to Page format
        const transformedResponse: CustomHttpResponse<Page<Payroll>> = {
          timestamp: response.timestamp,
          statusCode: response.statusCode,
          status: response.status,
          message: response.message,
          data: {
            content: response.data.payrolls || [],
            totalElements: response.data.payrolls?.length || 0,
            totalPages: 1,
            size: response.data.payrolls?.length || 0,
            numberOfElements: response.data.payrolls?.length || 0,
            number: 0
          }
        };

        console.log('📦 Transformed response (by status):', transformedResponse);
        this.payrollsSubject.next(transformedResponse);
      }),
      catchError(err => {
        this.listCache.delete(key);
        console.error('❌ PayrollService.getPayrollsByStatus() error:', err);
        throw err;
      }),
      shareReplay(1)
    );
    this.listCache.set(key, obs);
    return obs;
  }

  /** Payrolls between date period */
  getPayrollsByPeriod(startDate: string, endDate: string):
    Observable<CustomHttpResponse<{ payrolls: Payroll[] }>> {

    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    console.log(`🌐 PayrollService.getPayrollsByPeriod() calling: ${this.server}/payroll/period`);
    return this.http.get<CustomHttpResponse<{ payrolls: Payroll[] }>>(
      `${this.server}/payroll/period`, { params }
    ).pipe(
      tap(response => console.log('✅ PayrollService.getPayrollsByPeriod() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.getPayrollsByPeriod() error:', err);
        throw err;
      })
    );
  }

  /** Create payroll */
  createPayroll(dto: PayrollDTO):
    Observable<CustomHttpResponse<{ payroll: Payroll }>> {

    console.log('🌐 PayrollService.createPayroll() calling:', dto);
    return this.http.post<CustomHttpResponse<{ payroll: Payroll }>>(
      `${this.server}/payroll`, dto
    ).pipe(
      tap(response => { this.listCache.clear(); console.log('✅ PayrollService.createPayroll() response:', response); }),
      catchError(err => {
        console.error('❌ PayrollService.createPayroll() error:', err);
        throw err;
      })
    );
  }

  /** Update payroll */
  updatePayroll(id: number, dto: PayrollDTO):
    Observable<CustomHttpResponse<{ payroll: Payroll }>> {

    console.log(`🌐 PayrollService.updatePayroll() calling: ${this.server}/payroll/${id}`, dto);
    return this.http.put<CustomHttpResponse<{ payroll: Payroll }>>(
      `${this.server}/payroll/${id}`, dto
    ).pipe(
      tap(response => { this.listCache.clear(); console.log('✅ PayrollService.updatePayroll() response:', response); }),
      catchError(err => {
        console.error('❌ PayrollService.updatePayroll() error:', err);
        throw err;
      })
    );
  }

  /** Delete payroll */
  deletePayroll(id: number): Observable<CustomHttpResponse<void>> {
    console.log(`🌐 PayrollService.deletePayroll() calling: ${this.server}/payroll/${id}`);
    return this.http.delete<CustomHttpResponse<void>>(
      `${this.server}/payroll/${id}`
    ).pipe(
      tap(response => { this.listCache.clear(); console.log('✅ PayrollService.deletePayroll() response:', response); }),
      catchError(err => {
        console.error('❌ PayrollService.deletePayroll() error:', err);
        throw err;
      })
    );
  }

  /** Process payroll for employee */
  processEmployeePayroll(
    employeeId: number,
    periodStart: string,
    periodEnd: string
  ): Observable<CustomHttpResponse<{ payroll: Payroll }>> {

    const params = new HttpParams()
      .set('periodStart', periodStart)
      .set('periodEnd', periodEnd);

    console.log(`🌐 PayrollService.processEmployeePayroll() calling: ${this.server}/payroll/process/employee/${employeeId}`);
    return this.http.post<CustomHttpResponse<{ payroll: Payroll }>>(
      `${this.server}/payroll/process/employee/${employeeId}`,
      null,
      { params }
    ).pipe(
      tap(response => { this.listCache.clear(); console.log('✅ PayrollService.processEmployeePayroll() response:', response); }),
      catchError(err => {
        console.error('❌ PayrollService.processEmployeePayroll() error:', err);
        throw err;
      })
    );
  }

  /** Bulk payroll processing */
  processBulkPayroll(
    employeeIds: number[],
    periodStart: string,
    periodEnd: string
  ): Observable<CustomHttpResponse<{ payrolls: Payroll[], count: number }>> {

    console.log('🌐 PayrollService.processBulkPayroll() calling:', { employeeIds, periodStart, periodEnd });
    return this.http.post<CustomHttpResponse<{ payrolls: Payroll[], count: number }>>(
      `${this.server}/payroll/process/bulk`,
      { employeeIds, periodStart, periodEnd }
    ).pipe(
      tap(response => { this.listCache.clear(); console.log('✅ PayrollService.processBulkPayroll() response:', response); }),
      catchError(err => {
        console.error('❌ PayrollService.processBulkPayroll() error:', err);
        throw err;
      })
    );
  }

  /** Recalculate payroll */
  recalculatePayroll(id: number):
    Observable<CustomHttpResponse<{ payroll: Payroll }>> {

    console.log(`🌐 PayrollService.recalculatePayroll() calling: ${this.server}/payroll/${id}/recalculate`);
    return this.http.post<CustomHttpResponse<{ payroll: Payroll }>>(
      `${this.server}/payroll/${id}/recalculate`,
      null
    ).pipe(
      tap(response => { this.listCache.clear(); console.log('✅ PayrollService.recalculatePayroll() response:', response); }),
      catchError(err => {
        console.error('❌ PayrollService.recalculatePayroll() error:', err);
        throw err;
      })
    );
  }

  /** Approve payroll */
  approvePayroll(id: number):
    Observable<CustomHttpResponse<{ payroll: Payroll }>> {

    console.log(`🌐 PayrollService.approvePayroll() calling: ${this.server}/payroll/${id}/approve`);
    return this.http.put<CustomHttpResponse<{ payroll: Payroll }>>(
      `${this.server}/payroll/${id}/approve`,
      null
    ).pipe(
      tap(response => { this.listCache.clear(); console.log('✅ PayrollService.approvePayroll() response:', response); }),
      catchError(err => {
        console.error('❌ PayrollService.approvePayroll() error:', err);
        throw err;
      })
    );
  }

  /** Mark as paid */
  markAsPaid(id: number):
    Observable<CustomHttpResponse<{ payroll: Payroll }>> {

    console.log(`🌐 PayrollService.markAsPaid() calling: ${this.server}/payroll/${id}/paid`);
    return this.http.put<CustomHttpResponse<{ payroll: Payroll }>>(
      `${this.server}/payroll/${id}/paid`,
      null
    ).pipe(
      tap(response => { this.listCache.clear(); console.log('✅ PayrollService.markAsPaid() response:', response); }),
      catchError(err => {
        console.error('❌ PayrollService.markAsPaid() error:', err);
        throw err;
      })
    );
  }

  /** Cancel payroll */
  cancelPayroll(id: number):
    Observable<CustomHttpResponse<{ payroll: Payroll }>> {

    console.log(`🌐 PayrollService.cancelPayroll() calling: ${this.server}/payroll/${id}/cancel`);
    return this.http.put<CustomHttpResponse<{ payroll: Payroll }>>(
      `${this.server}/payroll/${id}/cancel`,
      null
    ).pipe(
      tap(response => { this.listCache.clear(); console.log('✅ PayrollService.cancelPayroll() response:', response); }),
      catchError(err => {
        console.error('❌ PayrollService.cancelPayroll() error:', err);
        throw err;
      })
    );
  }

  /** Payroll statistics */
  getPayrollStats(): Observable<CustomHttpResponse<PayrollStats>> {
    console.log(`🌐 PayrollService.getPayrollStats() calling: ${this.server}/payroll/stats`);
    return this.http.get<CustomHttpResponse<PayrollStats>>(
      `${this.server}/payroll/stats`
    ).pipe(
      tap(response => console.log('✅ PayrollService.getPayrollStats() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.getPayrollStats() error:', err);
        throw err;
      })
    );
  }

  /**
   * Download payslip as PDF (Admin)
   */
  downloadPayslip$ = (payrollId: number): Observable<HttpEvent<Blob>> =>
    this.http.get(`${this.server}/payroll/payslip/download/${payrollId}`,
      { reportProgress: true, observe: 'events', responseType: 'blob' })
      .pipe(
        tap(console.log),
        catchError(err => {
          console.error('❌ Payslip failed to download:', err);
          throw err;
        })
      );

  /**
   * Download employee's own payslip (Employee self-service)
   */
  downloadMyPayslip$ = (payrollId: number): Observable<HttpEvent<Blob>> =>
    this.http.get(`${this.server}/payroll/my-payslip/download/${payrollId}`,
      { reportProgress: true, observe: 'events', responseType: 'blob' })
      .pipe(
        tap(console.log),
        catchError(err => {
          console.error('❌ Payslip failed to download:', err);
          throw err;
        })
      );

  /**
   * Download bulk payslips as ZIP
   */
  downloadBulkPayslips$ = (periodStart: string, periodEnd: string): Observable<HttpEvent<Blob>> =>
    this.http.get(`${this.server}/payroll/payslip/bulk-download?periodStart=${periodStart}&periodEnd=${periodEnd}`,
      { reportProgress: true, observe: 'events', responseType: 'blob' })
      .pipe(
        tap(console.log),
        catchError(err => {
          console.error('❌ Payslip bulk to download failed:', err);
          throw err;
        })
      );

  /** Manually trigger payslip emails for a given month (all eligible employees) */
  triggerPayslipEmails(year: number, month: number): Observable<CustomHttpResponse<void>> {
    const params = new HttpParams().set('year', year).set('month', month);
    console.log(`🌐 PayrollService.triggerPayslipEmails() → year=${year} month=${month}`);
    return this.http.post<CustomHttpResponse<void>>(
      `${this.server}/payroll/admin/send-payslips`, null, { params }
    ).pipe(
      tap(response => console.log('✅ PayrollService.triggerPayslipEmails() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.triggerPayslipEmails() error:', err);
        throw err;
      })
    );
  }

  /** Send payslip emails only to the selected payroll IDs */
  triggerPayslipEmailsForSelected(payrollIds: number[]): Observable<CustomHttpResponse<void>> {
    console.log(`🌐 PayrollService.triggerPayslipEmailsForSelected() → ids=${payrollIds}`);
    return this.http.post<CustomHttpResponse<void>>(
      `${this.server}/payroll/admin/send-payslips/selected`, payrollIds
    ).pipe(
      tap(response => console.log('✅ PayrollService.triggerPayslipEmailsForSelected() response:', response)),
      catchError(err => {
        console.error('❌ PayrollService.triggerPayslipEmailsForSelected() error:', err);
        throw err;
      })
    );
  }
}
