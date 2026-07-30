// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { forkJoin, interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { SuperadminService } from '../superadmin.service';

@Component({
  standalone: false,
  selector: 'app-superadmin-health',
  templateUrl: './superadmin-health.component.html',
  styleUrls: ['./superadmin-health.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminHealthComponent implements OnInit, OnDestroy {
  health: any      = null;
  info: any        = null;
  memUsed          = 0;   // bytes
  memMax           = 0;   // bytes
  memPercent       = 0;
  uptimeSeconds    = 0;
  liveThreads      = 0;
  requestCount     = 0;
  loading          = true;
  lastRefreshed    = new Date();
  autoRefresh      = true;

  private pollSub?: Subscription;

  constructor(
    private superadminService: SuperadminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  startPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(30_000).pipe(startWith(0)).subscribe(() => {
      if (this.autoRefresh) this.loadAll();
    });
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
  }

  refreshNow(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      health:   this.superadminService.getHealth(),
      info:     this.superadminService.getInfo(),
      memUsed:  this.superadminService.getMetric('jvm.memory.used'),
      memMax:   this.superadminService.getMetric('jvm.memory.max'),
      uptime:   this.superadminService.getMetric('process.uptime'),
      threads:  this.superadminService.getMetric('jvm.threads.live'),
      requests: this.superadminService.getMetric('http.server.requests')
    }).subscribe({
      next: result => {
        this.health       = result.health;
        this.info         = result.info;
        this.memUsed      = result.memUsed?.measurements?.[0]?.value ?? 0;
        this.memMax       = result.memMax?.measurements?.[0]?.value ?? 0;
        this.memPercent   = this.memMax > 0 ? Math.round((this.memUsed / this.memMax) * 100) : 0;
        this.uptimeSeconds = result.uptime?.measurements?.[0]?.value ?? 0;
        this.liveThreads  = result.threads?.measurements?.[0]?.value ?? 0;
        this.requestCount = result.requests?.measurements?.find((m: any) => m.statistic === 'COUNT')?.value ?? 0;
        this.lastRefreshed = new Date();
        this.loading       = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  get overallStatus(): string  { return this.health?.status ?? 'UNKNOWN'; }
  get dbStatus(): string       { return this.health?.components?.db?.status ?? 'UNKNOWN'; }
  get diskStatus(): string     { return this.health?.components?.diskSpace?.status ?? 'UNKNOWN'; }
  get diskFreeGb(): number     {
    const free = this.health?.components?.diskSpace?.details?.free ?? 0;
    return Math.round(free / (1024 ** 3) * 10) / 10;
  }
  get diskTotalGb(): number    {
    const total = this.health?.components?.diskSpace?.details?.total ?? 0;
    return Math.round(total / (1024 ** 3) * 10) / 10;
  }

  get memUsedMb(): number      { return Math.round(this.memUsed  / (1024 ** 2)); }
  get memMaxMb():  number      { return Math.round(this.memMax   / (1024 ** 2)); }

  get uptimeFormatted(): string {
    const s = Math.round(this.uptimeSeconds);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600)  / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  statusClass(s: string): string {
    return s === 'UP' ? 'status-up' : s === 'DOWN' ? 'status-down' : 'status-unknown';
  }

  memBarClass(): string {
    if (this.memPercent >= 90) return 'bg-danger';
    if (this.memPercent >= 70) return 'bg-warning';
    return 'bg-success';
  }

  trackByValue = (index: number, value: any) => value;
}
