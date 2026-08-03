// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../service/user.service';
import { NotificationService } from '../../service/notification.service';
import { environment } from '@env/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface PolicyMeta {
  id: number;
  policyType: string;
  displayName: string;
  fileName: string;
  uploadedAt: string;
}

export interface PolicyType {
  value: string;
  label: string;
}

@Component({
  standalone: false,
  selector: 'app-company-policy',
  templateUrl: './company-policy.component.html',
  styleUrls: ['./company-policy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyPolicyComponent implements OnInit, OnDestroy {
  companyId: number | null = null;
  companyName  = '';
  isAdmin      = false;
  loading      = true;

  policies: PolicyMeta[] = [];
  policyTypes: PolicyType[] = [];
  searchQuery = '';

  // Viewer state
  viewingPolicy: PolicyMeta | null = null;
  viewerUrl: SafeResourceUrl | null = null;
  viewerLoading = false;
  /** Blob object URL — must be revoked when viewer closes to avoid memory leaks. */
  private _blobUrl: string | null = null;

  // Upload modal state
  showUploadModal = false;
  uploadType      = '';
  uploadLabel     = '';
  selectedFile: File | null = null;
  uploading       = false;

  // Delete confirm state
  deletingId: number | null = null;

  private readonly api = environment.apiUrl + '/api/v1';

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private notification: NotificationService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userService.profile$().subscribe({
      next: res => {
        const user = res?.data?.user as any;
        this.companyId   = user?.companyId ?? null;
        this.companyName = user?.companyName ?? 'Your Company';
        this.isAdmin     = ['ROLE_ADMIN','ROLE_SYSADMIN','ROLE_SUPERADMIN'].includes(user?.roleName);
        if (this.companyId) {
          this.loadPolicyTypes();
          this.loadPolicies();
        } else {
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  ngOnDestroy(): void {
    this.revokeBlobUrl();
  }

  loadPolicyTypes(): void {
    this.http.get<any>(`${this.api}/companies/${this.companyId}/policies/types`).subscribe({
      next: res => {
        this.policyTypes = res.data?.types ?? [];
        this.cdr.markForCheck();
      }
    });
  }

  loadPolicies(): void {
    this.loading = true;
    this.http.get<any>(`${this.api}/companies/${this.companyId}/policies`).subscribe({
      next: res => {
        this.policies = res.data?.policies ?? [];
        this.loading  = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  // ── Viewer ──────────────────────────────────────────────────────────────────

  openViewer(policy: PolicyMeta): void {
    this.viewingPolicy = policy;
    this.viewerUrl     = null;
    this.viewerLoading = true;
    this.revokeBlobUrl();
    this.cdr.markForCheck();

    // Fetch the PDF as a blob via HttpClient — the token interceptor adds the
    // Authorization header automatically, so no token-in-URL is needed.
    const url = `${this.api}/companies/${this.companyId}/policies/${policy.id}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: blob => {
        this._blobUrl  = URL.createObjectURL(blob);
        this.viewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._blobUrl);
        this.viewerLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.viewerLoading = false;
        this.viewingPolicy = null;
        this.notification.onError('Failed to load document.');
        this.cdr.markForCheck();
      }
    });
  }

  closeViewer(): void {
    this.viewingPolicy = null;
    this.viewerUrl     = null;
    this.viewerLoading = false;
    this.revokeBlobUrl();
    this.cdr.markForCheck();
  }

  download(policy: PolicyMeta): void {
    const url = `${this.api}/companies/${this.companyId}/policies/${policy.id}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href     = blobUrl;
        a.download = policy.fileName || 'policy.pdf';
        a.click();
        // Revoke after a short delay to allow the download to start
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      },
      error: () => this.notification.onError('Failed to download document.')
    });
  }

  private revokeBlobUrl(): void {
    if (this._blobUrl) {
      URL.revokeObjectURL(this._blobUrl);
      this._blobUrl = null;
    }
  }

  // ── Upload modal ────────────────────────────────────────────────────────────

  openUploadModal(type = '', label = ''): void {
    this.uploadType      = type;
    this.uploadLabel     = label;
    this.selectedFile    = null;
    this.showUploadModal = true;
    this.cdr.markForCheck();
  }

  openReplaceModal(policy: PolicyMeta): void {
    this.openUploadModal(policy.policyType, policy.displayName);
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.cdr.markForCheck();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      this.notification.onError('Only PDF files are supported.');
      return;
    }
    this.selectedFile = file;
    this.cdr.markForCheck();
  }

  submitUpload(): void {
    if (!this.selectedFile || !this.uploadType || !this.companyId) return;
    this.uploading = true;
    const form = new FormData();
    form.append('file', this.selectedFile);
    form.append('policyType', this.uploadType);
    form.append('displayName', this.uploadLabel);
    this.http.post<any>(`${this.api}/companies/${this.companyId}/policies`, form).subscribe({
      next: () => {
        this.uploading       = false;
        this.showUploadModal = false;
        this.notification.onDefault('Document uploaded successfully.');
        this.loadPolicies();
      },
      error: () => {
        this.uploading = false;
        this.notification.onError('Failed to upload document.');
        this.cdr.markForCheck();
      }
    });
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  confirmDelete(policy: PolicyMeta): void {
    this.deletingId = policy.id;
    this.cdr.markForCheck();
  }

  cancelDelete(): void {
    this.deletingId = null;
    this.cdr.markForCheck();
  }

  executeDelete(policy: PolicyMeta): void {
    this.http.delete<any>(`${this.api}/companies/${this.companyId}/policies/${policy.id}`).subscribe({
      next: () => {
        this.deletingId = null;
        this.notification.onDefault('Document removed.');
        this.loadPolicies();
      },
      error: () => {
        this.deletingId = null;
        this.notification.onError('Failed to remove document.');
        this.cdr.markForCheck();
      }
    });
  }

  labelFor(policyType: string): string {
    return this.policyTypes.find(t => t.value === policyType)?.label ?? policyType;
  }

  get uploadedTypes(): Set<string> {
    return new Set(this.policies.map(p => p.policyType));
  }

  get filteredDocuments(): PolicyMeta[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.policies;
    return this.policies.filter(p =>
      (p.displayName ?? '').toLowerCase().includes(q) ||
      (p.fileName ?? '').toLowerCase().includes(q) ||
      this.labelFor(p.policyType).toLowerCase().includes(q)
    );
  }
}
