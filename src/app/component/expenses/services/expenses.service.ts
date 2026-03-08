import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

const FINANCIAL_API = `${environment.apiUrl}/api/v1/financial`;
const CLAIMS_API = `${environment.apiUrl}/api/v1/expense-claims`;

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  constructor(private http: HttpClient) {}

  getSummary(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${FINANCIAL_API}/summary?year=${year}&month=${month}`);
  }

  getIncomeStatement(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${FINANCIAL_API}/income-statement?year=${year}&month=${month}`);
  }

  getMonthlyTrend(year: number): Observable<any> {
    return this.http.get<any>(`${FINANCIAL_API}/monthly-trend?year=${year}`);
  }

  downloadIncomeStatement(year: number, startMonth: number, endMonth: number): Observable<Blob> {
    return this.http.get(
      `${FINANCIAL_API}/income-statement/export?year=${year}&startMonth=${startMonth}&endMonth=${endMonth}`,
      { responseType: 'blob' }
    );
  }

  // Expense claims (existing)
  getAdminClaims(page = 0, size = 20): Observable<any> {
    return this.http.get<any>(`${CLAIMS_API}/list?page=${page}&size=${size}`);
  }

  getMyClaims(employeeId: number, page = 0, size = 20): Observable<any> {
    return this.http.get<any>(`${CLAIMS_API}/employee/${employeeId}?page=${page}&size=${size}`);
  }

  getClaimsByStatus(status: string, page = 0, size = 20): Observable<any> {
    return this.http.get<any>(`${CLAIMS_API}/status/${status}?page=${page}&size=${size}`);
  }
}
