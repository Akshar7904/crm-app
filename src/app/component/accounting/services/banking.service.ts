// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BankAccount, BankTransaction } from '../models/banking.model';

@Injectable()
export class BankingService {

  private base = `${environment.apiUrl}/api/v1/banking`;

  constructor(private http: HttpClient) {}

  // Accounts
  getAccounts$(page = 0, size = 20): Observable<any> {
    return this.http.get(`${this.base}/accounts/list?page=${page}&size=${size}`);
  }

  getActiveAccounts$(): Observable<any> {
    return this.http.get(`${this.base}/accounts/active`);
  }

  getAccount$(id: number): Observable<any> {
    return this.http.get(`${this.base}/accounts/${id}`);
  }

  createAccount$(account: BankAccount): Observable<any> {
    return this.http.post(`${this.base}/accounts/create`, account);
  }

  updateAccount$(account: BankAccount): Observable<any> {
    return this.http.put(`${this.base}/accounts/update`, account);
  }

  toggleAccount$(id: number): Observable<any> {
    return this.http.patch(`${this.base}/accounts/${id}/toggle`, {});
  }

  deleteAccount$(id: number): Observable<any> {
    return this.http.delete(`${this.base}/accounts/${id}`);
  }

  // Transactions
  getTransactions$(accountId: number, page = 0, size = 20): Observable<any> {
    return this.http.get(`${this.base}/transactions/list/${accountId}?page=${page}&size=${size}`);
  }

  createTransaction$(transaction: BankTransaction): Observable<any> {
    return this.http.post(`${this.base}/transactions/create`, transaction);
  }

  reconcileTransaction$(id: number): Observable<any> {
    return this.http.patch(`${this.base}/transactions/${id}/reconcile`, {});
  }

  deleteTransaction$(id: number): Observable<any> {
    return this.http.delete(`${this.base}/transactions/${id}`);
  }
}
