// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse } from 'src/app/interface/appstates';
import { Page } from 'src/app/interface/appstates';
import { State } from 'src/app/interface/state';
import {
  Asset,
  AssetCategory,
  AssetRequest,
  AssetRequestApprovalForm,
  AssetRequestStatus,
  AssetFulfillmentForm,
  AssetCondition
} from 'src/app/interface/asset';
import { AssetService } from 'src/app/service/asset.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  standalone: false,
  selector: 'app-asset-requests',
  templateUrl: './asset-requests.component.html',
  styleUrls: ['./asset-requests.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetRequestsComponent implements OnInit {
  requestsState$: Observable<State<CustomHttpResponse<Page<AssetRequest>>>>;
  availableAssets$: Observable<Asset[]>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<Page<AssetRequest>>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();
  readonly DataState = DataState;
  readonly AssetRequestStatus = AssetRequestStatus;

  selectedStatus: AssetRequestStatus | '' = '';
  selectedRequest: AssetRequest | null = null;
  showApproveModal = false;
  showRejectModal = false;
  showFulfillModal = false;
  approvalNotes = '';
  rejectionReason = '';
  selectedAssetId: number | null = null;
  availableAssets: Asset[] = [];
  currentUser: any;

  constructor(
    private router: Router,
    private assetService: AssetService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.requestsState$ = this.assetService.getAllRequests(0, 10)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  filterByStatus(status: AssetRequestStatus | ''): void {
    this.selectedStatus = status;
    this.currentPageSubject.next(0);

    if (!status) {
      this.loadRequests();
      return;
    }

    this.requestsState$ = this.assetService.getRequestsByStatus(status, 0, 10)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  goToPage(pageNumber: number): void {
    const observable = this.selectedStatus
      ? this.assetService.getRequestsByStatus(this.selectedStatus, pageNumber, 10)
      : this.assetService.getAllRequests(pageNumber, 10);

    this.requestsState$ = observable
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          this.currentPageSubject.next(pageNumber);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.LOADED, error, appData: this.dataSubject.value });
        })
      );
  }

  goToNextOrPreviousPage(direction: string): void {
    this.goToPage(
      direction === 'forward' ? this.currentPageSubject.value + 1 : this.currentPageSubject.value - 1
    );
  }

  openApproveModal(request: AssetRequest): void {
    this.selectedRequest = request;
    this.approvalNotes = '';
    this.showApproveModal = true;
    this.cdr.markForCheck();
  }

  openRejectModal(request: AssetRequest): void {
    this.selectedRequest = request;
    this.rejectionReason = '';
    this.showRejectModal = true;
    this.cdr.markForCheck();
  }

  openFulfillModal(request: AssetRequest): void {
    this.selectedRequest = request;
    this.selectedAssetId = null;
    this.availableAssets = [];
    this.showFulfillModal = true;
    this.loadAvailableAssets(request.assetCategory);
  }

  private loadAvailableAssets(category?: AssetCategory, isFallback = false): void {
    const assets$ = category
      ? this.assetService.getAvailableAssetsByCategory(category)
      : this.assetService.getAvailableAssets();
    assets$.subscribe({
      next: (response) => {
        this.availableAssets = ((response.data as any)?.assets as Asset[]) || [];
        // If category-specific query returned empty, fall back to ALL available assets
        if (this.availableAssets.length === 0 && category && !isFallback) {
          this.loadAvailableAssets(undefined, true);
          return;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.onError('Failed to load available assets');
        this.availableAssets = [];
        this.cdr.markForCheck();
      }
    });
  }

  closeModals(): void {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.showFulfillModal = false;
    this.selectedRequest = null;
    this.cdr.markForCheck();
  }

  approveRequest(): void {
    if (!this.selectedRequest) return;

    const form: AssetRequestApprovalForm = {
      requestId: this.selectedRequest.id,
      approvedById: this.currentUser?.id,
      approvedByName: `${this.currentUser?.firstName || ''} ${this.currentUser?.lastName || ''}`.trim() || 'Unknown',
      approvalNotes: this.approvalNotes || ''
    };

    this.isLoadingSubject.next(true);
    this.assetService.approveRequest(form).subscribe({
      next: () => {
        this.notification.onSuccess('Request approved successfully');
        this.isLoadingSubject.next(false);
        this.closeModals();
        this.loadRequests();
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  rejectRequest(): void {
    if (!this.selectedRequest || !this.rejectionReason) {
      this.notification.onError('Please provide a rejection reason');
      return;
    }

    const form: AssetRequestApprovalForm = {
      requestId: this.selectedRequest.id,
      approvedById: this.currentUser?.id,
      approvedByName: `${this.currentUser?.firstName || ''} ${this.currentUser?.lastName || ''}`.trim() || 'Unknown',
      rejectionReason: this.rejectionReason
    };

    this.isLoadingSubject.next(true);
    this.assetService.rejectRequest(form).subscribe({
      next: () => {
        this.notification.onSuccess('Request rejected');
        this.isLoadingSubject.next(false);
        this.closeModals();
        this.loadRequests();
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  fulfillRequest(): void {
    if (!this.selectedRequest || !this.selectedAssetId) {
      this.notification.onError('Please select an asset');
      return;
    }

    const form: AssetFulfillmentForm = {
      requestId: this.selectedRequest.id,
      assetId: this.selectedAssetId,
      fulfilledById: this.currentUser?.id,
      fulfilledByName: `${this.currentUser?.firstName} ${this.currentUser?.lastName}`,
      conditionOnAssignment: AssetCondition.GOOD,
      expectedReturnDate: this.selectedRequest.expectedReturnDate?.toString()
    };

    this.isLoadingSubject.next(true);
    this.assetService.fulfillRequest(form).subscribe({
      next: () => {
        this.notification.onSuccess('Request fulfilled - Asset assigned successfully');
        this.isLoadingSubject.next(false);
        this.closeModals();
        this.loadRequests();
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  getRequests(state: any): AssetRequest[] {
    const data = state?.appData?.data || state?.data;
    if (!data) return [];
    if (data.page?.content) return data.page.content;
    if (Array.isArray(data)) return data;
    return [];
  }

  hasRequests(state: any): boolean {
    return this.getRequests(state).length > 0;
  }

  getTotalPages(state: any): number {
    return state?.appData?.data?.page?.totalPages || 0;
  }

  getStatusClass(status: AssetRequestStatus): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'badge-soft-warning',
      'APPROVED': 'badge-soft-info',
      'REJECTED': 'badge-soft-danger',
      'CANCELLED': 'badge-soft-secondary',
      'FULFILLED': 'badge-soft-success'
    };
    return classes[status] || 'badge-soft-secondary';
  }

  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'LOW': 'badge-soft-secondary',
      'NORMAL': 'badge-soft-primary',
      'HIGH': 'badge-soft-warning',
      'URGENT': 'badge-soft-danger'
    };
    return classes[priority] || 'badge-soft-secondary';
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private getCurrentUser(): any {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch {
      return null;
    }
  }
}
