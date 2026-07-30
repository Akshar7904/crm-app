// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StockMovementType } from '../models/product-catalog.model';

@Injectable()
export class InventoryService {

  private base = `${environment.apiUrl}/api/v1/inventory`;

  constructor(private http: HttpClient) {}

  getStats$(): Observable<any> {
    return this.http.get<any>(`${this.base}/stats`);
  }

  getTracked$(): Observable<any> {
    return this.http.get<any>(`${this.base}/tracked`);
  }

  getLowStock$(): Observable<any> {
    return this.http.get<any>(`${this.base}/low-stock`);
  }

  getMovementsByProduct$(productId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/movements/product/${productId}`);
  }

  getMovements$(start?: string, end?: string): Observable<any> {
    let params = new HttpParams();
    if (start) params = params.set('start', start);
    if (end)   params = params.set('end', end);
    return this.http.get<any>(`${this.base}/movements`, { params });
  }

  recordMovement$(productId: number, type: StockMovementType, quantity: number,
                   unitCost?: number, reference?: string, notes?: string): Observable<any> {
    let params = new HttpParams()
      .set('productId', productId.toString())
      .set('type', type)
      .set('quantity', quantity.toString());
    if (unitCost  != null) params = params.set('unitCost', unitCost.toString());
    if (reference)         params = params.set('reference', reference);
    if (notes)             params = params.set('notes', notes);
    return this.http.post<any>(`${this.base}/movement`, null, { params });
  }

  enableTracking$(productId: number, initialStock: number, unitCost?: number, reorderPoint?: number): Observable<any> {
    let params = new HttpParams().set('initialStock', initialStock.toString());
    if (unitCost    != null) params = params.set('unitCost', unitCost.toString());
    if (reorderPoint != null) params = params.set('reorderPoint', reorderPoint.toString());
    return this.http.post<any>(`${this.base}/enable/${productId}`, null, { params });
  }

  disableTracking$(productId: number): Observable<any> {
    return this.http.post<any>(`${this.base}/disable/${productId}`, null);
  }

  updateReorderPoint$(productId: number, reorderPoint: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/reorder-point/${productId}`, null, {
      params: new HttpParams().set('reorderPoint', reorderPoint.toString())
    });
  }
}
