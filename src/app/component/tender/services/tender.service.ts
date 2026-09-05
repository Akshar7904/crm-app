// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  Tender, TenderPage, TenderTaskItem, TenderRequirement, TenderPricingLine,
  TenderBidDocument, TenderFollowUp, TenderDashboardStats, TenderReport
} from '../models/tender.model';

@Injectable({ providedIn: 'root' })
export class TenderService {

  private readonly base = `${environment.apiUrl}/api/v1/tenders`;

  constructor(private http: HttpClient) {}

  // ── Tenders ────────────────────────────────────────────────────────────
  getAll(params: { page?: number; size?: number } = {}): Observable<TenderPage> {
    let p = new HttpParams();
    if (params.page !== undefined) p = p.set('page', params.page);
    if (params.size !== undefined) p = p.set('size', params.size);
    return this.http.get<any>(this.base, { params: p }).pipe(map(r => r.data.page));
  }

  getById(id: number): Observable<Tender> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data.tender));
  }

  create(tender: Partial<Tender>): Observable<Tender> {
    return this.http.post<any>(this.base, tender).pipe(map(r => r.data.tender));
  }

  update(id: number, tender: Partial<Tender>): Observable<Tender> {
    return this.http.put<any>(`${this.base}/${id}`, tender).pipe(map(r => r.data.tender));
  }

  uploadAttachment(id: number, file: File): Observable<Tender> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.base}/${id}/attachment`, form).pipe(map(r => r.data.tender));
  }

  downloadAttachment(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/attachment`, { responseType: 'blob' });
  }

  updateGoNoGo(id: number, body: { goNoGoOwnerId?: number; goNoGoOwnerName?: string; goNoGoReason?: string; goNoGoDecision: string }): Observable<Tender> {
    return this.http.put<any>(`${this.base}/${id}/go-no-go`, body).pipe(map(r => r.data.tender));
  }

  updateSubmissionChecks(id: number, checks: { execSignOffRecorded: boolean; fileNamesAndOrderChecked: boolean; portalUploadTestCompleted: boolean; proofOfSubmissionSaved: boolean }): Observable<Tender> {
    return this.http.put<any>(`${this.base}/${id}/submission-checks`, checks).pipe(map(r => r.data.tender));
  }

  updatePostBid(id: number, body: { outcome: string; outcomeReason?: string; lessonLearned?: string }): Observable<Tender> {
    return this.http.put<any>(`${this.base}/${id}/post-bid`, body).pipe(map(r => r.data.tender));
  }

  exportBid(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/export`, { responseType: 'blob' });
  }

  // ── Tasks ──────────────────────────────────────────────────────────────
  getTasks(tenderId: number): Observable<TenderTaskItem[]> {
    return this.http.get<any>(`${this.base}/${tenderId}/tasks`).pipe(map(r => r.data.tasks));
  }
  createTask(tenderId: number, task: Partial<TenderTaskItem>): Observable<TenderTaskItem> {
    return this.http.post<any>(`${this.base}/${tenderId}/tasks`, task).pipe(map(r => r.data.task));
  }
  updateTask(tenderId: number, taskId: number, task: Partial<TenderTaskItem>): Observable<TenderTaskItem> {
    return this.http.put<any>(`${this.base}/${tenderId}/tasks/${taskId}`, task).pipe(map(r => r.data.task));
  }
  deleteTask(tenderId: number, taskId: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${tenderId}/tasks/${taskId}`).pipe(map(() => undefined));
  }

  // ── Requirements ───────────────────────────────────────────────────────
  getRequirements(tenderId: number): Observable<TenderRequirement[]> {
    return this.http.get<any>(`${this.base}/${tenderId}/requirements`).pipe(map(r => r.data.requirements));
  }
  createRequirement(tenderId: number, req: Partial<TenderRequirement>): Observable<TenderRequirement> {
    return this.http.post<any>(`${this.base}/${tenderId}/requirements`, req).pipe(map(r => r.data.requirement));
  }
  updateRequirement(tenderId: number, reqId: number, req: Partial<TenderRequirement>): Observable<TenderRequirement> {
    return this.http.put<any>(`${this.base}/${tenderId}/requirements/${reqId}`, req).pipe(map(r => r.data.requirement));
  }
  deleteRequirement(tenderId: number, reqId: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${tenderId}/requirements/${reqId}`).pipe(map(() => undefined));
  }

  // ── Pricing Lines ──────────────────────────────────────────────────────
  getPricingLines(tenderId: number): Observable<TenderPricingLine[]> {
    return this.http.get<any>(`${this.base}/${tenderId}/pricing-lines`).pipe(map(r => r.data.pricingLines));
  }
  createPricingLine(tenderId: number, line: Partial<TenderPricingLine>): Observable<TenderPricingLine> {
    return this.http.post<any>(`${this.base}/${tenderId}/pricing-lines`, line).pipe(map(r => r.data.pricingLine));
  }
  updatePricingLine(tenderId: number, lineId: number, line: Partial<TenderPricingLine>): Observable<TenderPricingLine> {
    return this.http.put<any>(`${this.base}/${tenderId}/pricing-lines/${lineId}`, line).pipe(map(r => r.data.pricingLine));
  }
  deletePricingLine(tenderId: number, lineId: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${tenderId}/pricing-lines/${lineId}`).pipe(map(() => undefined));
  }
  finalisePricing(tenderId: number): Observable<Tender> {
    return this.http.post<any>(`${this.base}/${tenderId}/pricing-lines/finalise`, {}).pipe(map(r => r.data.tender));
  }

  // ── Bid Documents ──────────────────────────────────────────────────────
  getBidDocuments(tenderId: number): Observable<TenderBidDocument[]> {
    return this.http.get<any>(`${this.base}/${tenderId}/bid-documents`).pipe(map(r => r.data.bidDocuments));
  }
  createBidDocument(tenderId: number, file: File, category: string, displayName: string, description: string): Observable<TenderBidDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    if (displayName) form.append('displayName', displayName);
    if (description) form.append('description', description);
    return this.http.post<any>(`${this.base}/${tenderId}/bid-documents`, form).pipe(map(r => r.data.bidDocument));
  }
  updateBidDocument(tenderId: number, docId: number, doc: Partial<TenderBidDocument>): Observable<TenderBidDocument> {
    return this.http.put<any>(`${this.base}/${tenderId}/bid-documents/${docId}`, doc).pipe(map(r => r.data.bidDocument));
  }
  replaceBidDocument(tenderId: number, docId: number, file: File): Observable<TenderBidDocument> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.base}/${tenderId}/bid-documents/${docId}/replace`, form).pipe(map(r => r.data.bidDocument));
  }
  downloadBidDocument(tenderId: number, docId: number): Observable<Blob> {
    return this.http.get(`${this.base}/${tenderId}/bid-documents/${docId}/file`, { responseType: 'blob' });
  }
  deleteBidDocument(tenderId: number, docId: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${tenderId}/bid-documents/${docId}`).pipe(map(() => undefined));
  }

  // ── Follow-ups ─────────────────────────────────────────────────────────
  getFollowUps(tenderId: number): Observable<TenderFollowUp[]> {
    return this.http.get<any>(`${this.base}/${tenderId}/follow-ups`).pipe(map(r => r.data.followUps));
  }
  createFollowUp(tenderId: number, followUp: Partial<TenderFollowUp>): Observable<TenderFollowUp> {
    return this.http.post<any>(`${this.base}/${tenderId}/follow-ups`, followUp).pipe(map(r => r.data.followUp));
  }
  updateFollowUp(tenderId: number, followUpId: number, followUp: Partial<TenderFollowUp>): Observable<TenderFollowUp> {
    return this.http.put<any>(`${this.base}/${tenderId}/follow-ups/${followUpId}`, followUp).pipe(map(r => r.data.followUp));
  }
  deleteFollowUp(tenderId: number, followUpId: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${tenderId}/follow-ups/${followUpId}`).pipe(map(() => undefined));
  }

  // ── Dashboard & Reporting ──────────────────────────────────────────────
  getDashboardStats(): Observable<TenderDashboardStats> {
    return this.http.get<any>(`${this.base}/dashboard-stats`).pipe(map(r => r.data.stats));
  }
  getReporting(): Observable<TenderReport> {
    return this.http.get<any>(`${this.base}/reporting`).pipe(map(r => r.data.report));
  }
}
