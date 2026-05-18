// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SuperadminService } from '../superadmin.service';
import { NotificationService } from '../../../service/notification.service';

type Tab = 'requests' | 'events';
type StatusFilter = 'all' | '4xx' | '5xx' | 'errors';

@Component({
  standalone: false,
  selector: 'app-superadmin-logs',
  templateUrl: './superadmin-logs.component.html',
  styleUrls: ['./superadmin-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminLogsComponent implements OnInit {

  activeTab: Tab = 'requests';

  // ── HTTP Exchanges (from actuator) ────────────────────────
  allExchanges:   any[] = [];   // raw from actuator
  reqLoading      = false;
  reqExporting    = false;
  statusFilter: StatusFilter = 'all';
  reqMethodFilter = '';
  reqSearch       = '';         // filter by URI

  // ── User Event Logs ───────────────────────────────────────
  evtLogs:       any[] = [];
  evtTotal       = 0;
  evtPage        = 0;
  evtSize        = 50;
  evtLoading     = false;
  evtExporting   = false;
  evtSearch      = '';
  evtFilterEvent = '';
  evtFilterCompany = '';
  evtFrom        = '';
  evtTo          = '';

  companies: any[] = [];

  readonly EVENT_TYPES = [
    'LOGIN_ATTEMPT', 'LOGIN_ATTEMPT_SUCCESS', 'LOGIN_ATTEMPT_FAILURE',
    'PROFILE_UPDATE', 'PROFILE_PICTURE_UPDATE', 'PASSWORD_UPDATE',
    'ROLE_UPDATE', 'ACCOUNT_SETTINGS_UPDATE', 'MFA_UPDATE', 'API_ACCESS'
  ];

  constructor(
    private superadminService: SuperadminService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.superadminService.getCompanies(0, 200).subscribe({
      next: res => { this.companies = res.data?.companies?.content ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.loadExchanges();
  }

  switchTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'events' && this.evtLogs.length === 0) this.loadEvtLogs();
  }

  // ── HTTP Exchange methods (actuator) ─────────────────────
  loadExchanges(): void {
    this.reqLoading = true;
    this.superadminService.getHttpExchanges().subscribe({
      next: res => {
        // Actuator returns { exchanges: [...] }, newest-first
        this.allExchanges = (res.exchanges ?? []).reverse(); // oldest-first for display
        this.reqLoading   = false;
        this.cdr.markForCheck();
      },
      error: err => { this.notification.onError(err); this.reqLoading = false; this.cdr.markForCheck(); }
    });
  }

  setStatusFilter(f: StatusFilter): void { this.statusFilter = f; }

  get filtered(): any[] {
    return this.allExchanges.filter(ex => {
      const status = ex.response?.status ?? 0;
      const uri    = (ex.request?.uri ?? '').toLowerCase();
      const method = ex.request?.method ?? '';

      if (this.statusFilter === '4xx'    && !(status >= 400 && status < 500)) return false;
      if (this.statusFilter === '5xx'    && !(status >= 500))                  return false;
      if (this.statusFilter === 'errors' && !(status >= 400))                  return false;
      if (this.reqMethodFilter && method !== this.reqMethodFilter)             return false;
      if (this.reqSearch && !uri.includes(this.reqSearch.toLowerCase()))       return false;
      return true;
    }).reverse(); // show newest first
  }

  get totalClientErrors(): number { return this.allExchanges.filter(e => { const s = e.response?.status ?? 0; return s >= 400 && s < 500; }).length; }
  get totalServerErrors(): number { return this.allExchanges.filter(e => (e.response?.status ?? 0) >= 500).length; }

  exportExchanges(): void {
    this.reqExporting = true;
    this.superadminService.exportHttpExchanges().subscribe({
      next: blob => { this.downloadBlob(blob, `http-exchanges-${this.today()}.xlsx`); this.reqExporting = false; this.cdr.markForCheck(); },
      error: err  => { this.notification.onError(err); this.reqExporting = false; this.cdr.markForCheck(); }
    });
  }

  durationMs(ex: any): number {
    // timeTaken is ISO-8601 duration e.g. "PT0.045S"
    if (!ex.timeTaken) return 0;
    const match = ex.timeTaken.match(/PT(?:(\d+)M)?(?:([\d.]+)S)?/);
    if (!match) return 0;
    const mins = parseFloat(match[1] ?? '0');
    const secs = parseFloat(match[2] ?? '0');
    return Math.round((mins * 60 + secs) * 1000);
  }

  // ── User event log methods ────────────────────────────────
  loadEvtLogs(): void {
    this.evtLoading = true;
    this.superadminService.getAuditLogs(this.buildEvtFilters()).subscribe({
      next: res => {
        this.evtLogs  = res.data?.logs  ?? [];
        this.evtTotal = res.data?.total ?? 0;
        this.evtLoading = false;
        this.cdr.markForCheck();
      },
      error: err => { this.notification.onError(err); this.evtLoading = false; this.cdr.markForCheck(); }
    });
  }

  applyEvtFilters(): void { this.evtPage = 0; this.loadEvtLogs(); }
  clearEvtFilters(): void {
    this.evtSearch = ''; this.evtFilterEvent = '';
    this.evtFilterCompany = ''; this.evtFrom = ''; this.evtTo = '';
    this.evtPage = 0; this.loadEvtLogs();
  }
  evtNextPage(): void { this.evtPage++; this.loadEvtLogs(); }
  evtPrevPage(): void { if (this.evtPage > 0) { this.evtPage--; this.loadEvtLogs(); } }
  get evtTotalPages() { return Math.ceil(this.evtTotal / this.evtSize); }
  get evtHasNext()    { return (this.evtPage + 1) < this.evtTotalPages; }
  get evtHasPrev()    { return this.evtPage > 0; }
  get evtLoginFailures(): number { return this.evtLogs.filter(l => l.event_type?.includes('FAILURE')).length; }

  exportEvtLogs(): void {
    this.evtExporting = true;
    this.superadminService.exportAuditLogs(this.buildEvtFilters()).subscribe({
      next: blob => { this.downloadBlob(blob, `audit-logs-${this.today()}.xlsx`); this.evtExporting = false; this.cdr.markForCheck(); },
      error: err  => { this.notification.onError(err); this.evtExporting = false; this.cdr.markForCheck(); }
    });
  }

  private buildEvtFilters() {
    return {
      page: this.evtPage, size: this.evtSize,
      eventType: this.evtFilterEvent   || undefined,
      companyId: this.evtFilterCompany ? Number(this.evtFilterCompany) : undefined,
      search:    this.evtSearch        || undefined,
      from:      this.evtFrom          || undefined,
      to:        this.evtTo            || undefined
    };
  }

  eventLabel(type: string): string {
    const map: Record<string, string> = {
      LOGIN_ATTEMPT: 'Login Attempt', LOGIN_ATTEMPT_SUCCESS: 'Login Success',
      LOGIN_ATTEMPT_FAILURE: 'Login Failed', PROFILE_UPDATE: 'Profile Update',
      PROFILE_PICTURE_UPDATE: 'Picture Update', PASSWORD_UPDATE: 'Password Change',
      ROLE_UPDATE: 'Role Update', ACCOUNT_SETTINGS_UPDATE: 'Settings Update', MFA_UPDATE: 'MFA Update'
    };
    return map[type] ?? type;
  }

  eventBadgeClass(type: string): string {
    if (type.includes('FAILURE'))  return 'badge-soft-danger';
    if (type.includes('SUCCESS'))  return 'badge-soft-success';
    if (type.includes('LOGIN'))    return 'badge-soft-primary';
    if (type.includes('PASSWORD')) return 'badge-soft-warning';
    if (type.includes('MFA'))      return 'badge-soft-purple';
    return 'badge-soft-secondary';
  }

  statusClass(code: number): string {
    if (code >= 500) return 'badge-soft-danger';
    if (code >= 400) return 'badge-soft-warning';
    if (code >= 300) return 'badge-soft-secondary';
    return 'badge-soft-success';
  }

  methodClass(method: string): string {
    const m: Record<string, string> = {
      GET: 'method-get', POST: 'method-post', PUT: 'method-put',
      PATCH: 'method-patch', DELETE: 'method-delete'
    };
    return m[method] ?? 'badge-soft-secondary';
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    window.URL.revokeObjectURL(url);
  }

  private today(): string { return new Date().toISOString().slice(0, 10); }

  trackByIndex = (index: number) => index;
  trackByValue = (index: number, value: any) => value;
  trackById = (index: number, item: any) => item.id;
}
