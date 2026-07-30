// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Asset,
  AssetAssignment,
  AssetAssignmentForm,
  AssetCategory,
  AssetForm,
  AssetFulfillmentForm,
  AssetRequest,
  AssetRequestApprovalForm,
  AssetRequestForm,
  AssetRequestStatus,
  AssetReturnForm,
  AssetStatistics,
  AssetStatus
} from '../interface/asset';
import { CustomHttpResponse, Page } from '../interface/appstates';

@Injectable()
export class AssetService {
  private readonly server = environment.apiUrl;
  private readonly apiUrl = `${this.server}/api/v1/assets`;

  constructor(private http: HttpClient) {}

  // ==================== ASSET OPERATIONS ====================

  createAsset(form: AssetForm): Observable<CustomHttpResponse<Asset>> {
    return this.http.post<CustomHttpResponse<Asset>>(`${this.apiUrl}/create`, form);
  }

  updateAsset(id: number, form: AssetForm): Observable<CustomHttpResponse<Asset>> {
    return this.http.put<CustomHttpResponse<Asset>>(`${this.apiUrl}/update/${id}`, form);
  }

  getAssetById(id: number): Observable<CustomHttpResponse<Asset>> {
    return this.http.get<CustomHttpResponse<Asset>>(`${this.apiUrl}/${id}`);
  }

  getAssetByTag(tag: string): Observable<CustomHttpResponse<Asset>> {
    return this.http.get<CustomHttpResponse<Asset>>(`${this.apiUrl}/tag/${tag}`);
  }

  getAllAssets(page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<Asset>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<Asset>>>(`${this.apiUrl}/list`, { params });
  }

  getAssetsByStatus(status: AssetStatus, page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<Asset>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<Asset>>>(`${this.apiUrl}/status/${status}`, { params });
  }

  getAssetsByCategory(category: AssetCategory, page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<Asset>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<Asset>>>(`${this.apiUrl}/category/${category}`, { params });
  }

  getAvailableAssets(): Observable<CustomHttpResponse<Asset[]>> {
    const headers = new HttpHeaders().set('x-skip-cache', 'true');
    return this.http.get<CustomHttpResponse<Asset[]>>(`${this.apiUrl}/available`, { headers });
  }

  getAvailableAssetsByCategory(category: AssetCategory): Observable<CustomHttpResponse<Asset[]>> {
    const headers = new HttpHeaders().set('x-skip-cache', 'true');
    const params = new HttpParams().set('category', category);
    return this.http.get<CustomHttpResponse<Asset[]>>(`${this.apiUrl}/available`, { headers, params });
  }

  searchAssets(query: string, page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<Asset>>> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<Asset>>>(`${this.apiUrl}/search`, { params });
  }

  updateAssetStatus(assetId: number, status: AssetStatus): Observable<CustomHttpResponse<void>> {
    const params = new HttpParams().set('status', status);
    return this.http.put<CustomHttpResponse<void>>(`${this.apiUrl}/${assetId}/status`, null, { params });
  }

  deleteAsset(id: number): Observable<CustomHttpResponse<void>> {
    return this.http.delete<CustomHttpResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // ==================== ASSET REQUEST OPERATIONS ====================

  createRequest(form: AssetRequestForm): Observable<CustomHttpResponse<AssetRequest>> {
    return this.http.post<CustomHttpResponse<AssetRequest>>(`${this.apiUrl}/requests/create`, form);
  }

  getRequestById(id: number): Observable<CustomHttpResponse<AssetRequest>> {
    return this.http.get<CustomHttpResponse<AssetRequest>>(`${this.apiUrl}/requests/${id}`);
  }

  getAllRequests(page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<AssetRequest>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<AssetRequest>>>(`${this.apiUrl}/requests/list`, { params });
  }

  getRequestsByStatus(status: AssetRequestStatus, page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<AssetRequest>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<AssetRequest>>>(`${this.apiUrl}/requests/status/${status}`, { params });
  }

  getMyRequests(page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<AssetRequest>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<AssetRequest>>>(`${this.apiUrl}/requests/my-requests`, { params });
  }

  getPendingRequests(): Observable<CustomHttpResponse<AssetRequest[]>> {
    return this.http.get<CustomHttpResponse<AssetRequest[]>>(`${this.apiUrl}/requests/pending`);
  }

  approveRequest(form: AssetRequestApprovalForm): Observable<CustomHttpResponse<AssetRequest>> {
    return this.http.post<CustomHttpResponse<AssetRequest>>(`${this.apiUrl}/requests/approve`, form);
  }

  rejectRequest(form: AssetRequestApprovalForm): Observable<CustomHttpResponse<AssetRequest>> {
    return this.http.post<CustomHttpResponse<AssetRequest>>(`${this.apiUrl}/requests/reject`, form);
  }

  cancelRequest(requestId: number): Observable<CustomHttpResponse<void>> {
    return this.http.post<CustomHttpResponse<void>>(`${this.apiUrl}/requests/${requestId}/cancel`, null);
  }

  fulfillRequest(form: AssetFulfillmentForm): Observable<CustomHttpResponse<AssetAssignment>> {
    return this.http.post<CustomHttpResponse<AssetAssignment>>(`${this.apiUrl}/requests/fulfill`, form);
  }

  // ==================== ASSET ASSIGNMENT OPERATIONS ====================

  assignAsset(form: AssetAssignmentForm): Observable<CustomHttpResponse<AssetAssignment>> {
    return this.http.post<CustomHttpResponse<AssetAssignment>>(`${this.apiUrl}/assign`, form);
  }

  returnAsset(form: AssetReturnForm): Observable<CustomHttpResponse<AssetAssignment>> {
    return this.http.post<CustomHttpResponse<AssetAssignment>>(`${this.apiUrl}/return`, form);
  }

  getAssignmentById(id: number): Observable<CustomHttpResponse<AssetAssignment>> {
    return this.http.get<CustomHttpResponse<AssetAssignment>>(`${this.apiUrl}/assignments/${id}`);
  }

  getAllAssignments(page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<AssetAssignment>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<AssetAssignment>>>(`${this.apiUrl}/assignments/list`, { params });
  }

  getAssignmentsByAsset(assetId: number, page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<AssetAssignment>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<AssetAssignment>>>(`${this.apiUrl}/${assetId}/history`, { params });
  }

  getMyAssets(): Observable<CustomHttpResponse<AssetAssignment[]>> {
    return this.http.get<CustomHttpResponse<AssetAssignment[]>>(`${this.apiUrl}/my-assets`);
  }

  getMyHistory(page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<AssetAssignment>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<AssetAssignment>>>(`${this.apiUrl}/my-history`, { params });
  }

  getActiveAssignments(page: number = 0, size: number = 10): Observable<CustomHttpResponse<Page<AssetAssignment>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<CustomHttpResponse<Page<AssetAssignment>>>(`${this.apiUrl}/assignments/active`, { params });
  }

  getOverdueAssignments(): Observable<CustomHttpResponse<AssetAssignment[]>> {
    return this.http.get<CustomHttpResponse<AssetAssignment[]>>(`${this.apiUrl}/assignments/overdue`);
  }

  acknowledgeAsset(assignmentId: number): Observable<CustomHttpResponse<void>> {
    return this.http.post<CustomHttpResponse<void>>(`${this.apiUrl}/assignments/${assignmentId}/acknowledge`, null);
  }

  // ==================== STATISTICS ====================

  getStatistics(): Observable<CustomHttpResponse<AssetStatistics>> {
    return this.http.get<CustomHttpResponse<AssetStatistics>>(`${this.apiUrl}/statistics`);
  }
}
