// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { KioskService } from './kiosk.service';
import { BrandingService } from '../../service/branding.service';

type KioskState = 'IDLE' | 'ENTER_ID' | 'ENTER_PIN' | 'CONFIRMING' | 'SUCCESS' | 'ERROR';

@Component({
  standalone: false,
  selector: 'app-kiosk',
  templateUrl: './kiosk.component.html',
  styleUrls: ['./kiosk.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KioskComponent implements OnInit, OnDestroy {

  state: KioskState = 'IDLE';
  currentTime = '';
  currentDate = '';

  employeeIdInput = '';
  pinInput        = '';

  companyId: number = 0;
  result: { action: string; employeeName: string; punchTime: string; hoursWorked?: string } | null = null;
  errorMessage = '';

  private clockSub: Subscription;
  private resetTimer: any;

  constructor(
    private route: ActivatedRoute,
    private kioskService: KioskService,
    public branding: BrandingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.companyId = Number(this.route.snapshot.paramMap.get('companyId'));
    if (this.companyId && !this.branding.loaded) {
      this.branding.loadPublic(this.companyId).subscribe();
    }

    this.clockSub = interval(1000).subscribe(() => {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.currentDate = now.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      this.cdr.markForCheck();
    });

    // Set initial time immediately
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.currentDate = now.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  ngOnDestroy(): void {
    this.clockSub?.unsubscribe();
    clearTimeout(this.resetTimer);
  }

  // ── State machine ──────────────────────────────────────────────

  startEntry(): void {
    this.employeeIdInput = '';
    this.pinInput = '';
    this.state = 'ENTER_ID';
    this.cdr.markForCheck();
  }

  get pinDots(): boolean[] {
    return Array(4).fill(false).map((_, i) => i < (this.pinInput?.length ?? 0));
  }

  get paddedEmployeeId(): string {
    return (this.employeeIdInput ?? '').padStart(4, '0');
  }

  pressKey(key: string): void {
    if (this.state === 'ENTER_ID') {
      if (this.employeeIdInput.length < 4) this.employeeIdInput += key;
    } else if (this.state === 'ENTER_PIN') {
      if (this.pinInput.length < 4) {
        this.pinInput += key;
        if (this.pinInput.length === 4) this.submitPunch();
      }
    }
    this.cdr.markForCheck();
  }

  backspace(): void {
    if (this.state === 'ENTER_ID')  this.employeeIdInput = this.employeeIdInput.slice(0, -1);
    if (this.state === 'ENTER_PIN') this.pinInput = this.pinInput.slice(0, -1);
    this.cdr.markForCheck();
  }

  clear(): void {
    this.employeeIdInput = '';
    this.pinInput = '';
    this.cdr.markForCheck();
  }

  confirmId(): void {
    if (!this.employeeIdInput.trim()) return;
    this.state = 'ENTER_PIN';
    this.cdr.markForCheck();
  }

  submitPunch(): void {
    if (this.pinInput.length < 4 || !this.companyId) return;
    this.state = 'CONFIRMING';
    this.cdr.markForCheck();

    const fullEmployeeId = 'LKC' + this.employeeIdInput.trim().padStart(4, '0');
    this.kioskService.punch(fullEmployeeId, this.pinInput, this.companyId)
      .subscribe({
        next: res => {
          const r = res.data.result;
          this.result = {
            action: r.action,
            employeeName: r.employeeName,
            punchTime: new Date(r.punchTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
            hoursWorked: r.hoursWorked
          };
          this.state = 'SUCCESS';
          this.cdr.markForCheck();
          this.resetTimer = setTimeout(() => this.reset(), 6000);
        },
        error: err => {
          console.error('[KIOSK] punch error:', err?.error);
          this.errorMessage = err?.error?.reason || err?.error?.message || 'Something went wrong. Please try again.';
          this.state = 'ERROR';
          this.cdr.markForCheck();
          this.resetTimer = setTimeout(() => this.reset(), 4000);
        }
      });
  }

  reset(): void {
    clearTimeout(this.resetTimer);
    this.state = 'IDLE';
    this.employeeIdInput = '';
    this.pinInput = '';
    this.result = null;
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  readonly KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#'];
}
