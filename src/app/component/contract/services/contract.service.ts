// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  Contract, ContractStats, ContractPage, ContractEnumItem,
  ApprovalStep, DocumentMeta
} from '../models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractService {

  private readonly base = `${environment.apiUrl}/api/v1/contracts`;

  constructor(private http: HttpClient) {}

  // ── Metadata ────────────────────────────────────────────────────────────
  getStatuses(): Observable<ContractEnumItem[]> {
    return this.http.get<any>(`${this.base}/statuses`).pipe(map(r => r.data.statuses));
  }

  getTypes(): Observable<ContractEnumItem[]> {
    return this.http.get<any>(`${this.base}/types`).pipe(map(r => r.data.types));
  }

  getStats(): Observable<ContractStats> {
    return this.http.get<any>(`${this.base}/stats`).pipe(map(r => r.data));
  }

  getExpiring(withinDays = 90): Observable<Contract[]> {
    return this.http.get<any>(`${this.base}/expiring`, { params: { withinDays } })
      .pipe(map(r => r.data.contracts));
  }

  // ── CRUD ────────────────────────────────────────────────────────────────
  search(params: {
    page?: number; size?: number; status?: string; contractType?: string;
    search?: string; sortBy?: string; sortDir?: string;
  }): Observable<ContractPage> {
    let p = new HttpParams();
    if (params.page !== undefined) p = p.set('page', params.page);
    if (params.size !== undefined) p = p.set('size', params.size);
    if (params.status) p = p.set('status', params.status);
    if (params.contractType) p = p.set('contractType', params.contractType);
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDir) p = p.set('sortDir', params.sortDir);
    return this.http.get<any>(this.base, { params: p }).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Contract> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data.contract));
  }

  create(contract: Partial<Contract>): Observable<Contract> {
    return this.http.post<any>(this.base, contract).pipe(map(r => r.data.contract));
  }

  update(id: number, contract: Partial<Contract>): Observable<Contract> {
    return this.http.put<any>(`${this.base}/${id}`, contract).pipe(map(r => r.data.contract));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }

  // ── Status transitions ──────────────────────────────────────────────────
  submit(id: number): Observable<Contract> {
    return this.http.post<any>(`${this.base}/${id}/submit`, {}).pipe(map(r => r.data.contract));
  }

  activate(id: number): Observable<Contract> {
    return this.http.post<any>(`${this.base}/${id}/activate`, {}).pipe(map(r => r.data.contract));
  }

  terminate(id: number, reason: string): Observable<Contract> {
    return this.http.post<any>(`${this.base}/${id}/terminate`, { reason }).pipe(map(r => r.data.contract));
  }

  renew(id: number, data: Partial<Contract>): Observable<Contract> {
    return this.http.post<any>(`${this.base}/${id}/renew`, data).pipe(map(r => r.data.contract));
  }

  // ── Approval ─────────────────────────────────────────────────────────────
  addApprovalStep(contractId: number, step: Partial<ApprovalStep>): Observable<Contract> {
    return this.http.post<any>(`${this.base}/${contractId}/approval-steps`, step).pipe(map(r => r.data.contract));
  }

  approveStep(contractId: number, stepId: number, comment: string): Observable<Contract> {
    return this.http.post<any>(`${this.base}/${contractId}/approval-steps/${stepId}/approve`, { comment })
      .pipe(map(r => r.data.contract));
  }

  rejectStep(contractId: number, stepId: number, comment: string): Observable<Contract> {
    return this.http.post<any>(`${this.base}/${contractId}/approval-steps/${stepId}/reject`, { comment })
      .pipe(map(r => r.data.contract));
  }

  // ── Documents ────────────────────────────────────────────────────────────
  uploadDocument(contractId: number, file: File): Observable<DocumentMeta> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.base}/${contractId}/documents`, form).pipe(map(r => r.data.document));
  }

  getDocumentUrl(contractId: number, docId: number): string {
    return `${this.base}/${contractId}/documents/${docId}`;
  }

  deleteDocument(contractId: number, docId: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${contractId}/documents/${docId}`);
  }
}
