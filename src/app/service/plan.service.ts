// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

export interface Plan {
  id: number;
  planKey: 'FREE' | 'BUSINESS' | 'ENTERPRISE';
  name: string;
  monthlyPrice: number | null;
  maxStaff: number | null;
  maxCustomers: number | null;
  storageGb: number | null;
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  constructor(private http: HttpClient) {}

  getAll$(): Observable<Plan[]> {
    return this.http.get<any>(`${environment.apiUrl}/api/v1/plans`).pipe(
      map(res => res?.data?.plans ?? [])
    );
  }
}
