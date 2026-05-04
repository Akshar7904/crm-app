// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { KioskService } from './kiosk.service';
import { BrandingService } from '../../service/branding.service';

type KioskState = 'IDLE' | 'ENTER_ID' | 'ENTER_PIN' | 'CONFIRMING' | 'ACTION_SELECT' | 'SUCCESS' | 'ERROR';

interface ActionMeta   { label: string; icon: string; colorClass: string; }
interface ActionOption { action: string; enabled: boolean; reason?: string; }

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

  actionOptions: ActionOption[]  = [];
  selectEmployeeName = '';

  showBreakList = false;

  elapsedSeconds = 0;
  alarmActive    = false;

  private readonly BREAK_LIMIT_SEC  = 15 * 60;
  private readonly LUNCH_LIMIT_SEC  = 30 * 60;
  private readonly GRACE_PERIOD_SEC = 60;

  activeBreaks: Array<{
    employeeName: string;
    employeeId:   string;
    status:       string;
    startTime:    Date;
    elapsedSec:   number;
  }> = [];

  private clockSub:   Subscription;
  private resetTimer: any;
  private elapsedSub: Subscription | null = null;
  private pollSub:    Subscription | null = null;
  private breakStartTime: Date | null = null;
  private activeLimit = 0;

  readonly ACTION_META: Record<string, ActionMeta> = {
    'CLOCK_IN':      { label: 'Clock In',    icon: 'bi-box-arrow-in-right',  colorClass: 'action-btn--in'    },
    'CLOCK_OUT':     { label: 'Clock Out',   icon: 'bi-box-arrow-left',      colorClass: 'action-btn--out'   },
    'START_BREAK_1': { label: 'Break 1',     icon: 'bi-pause-circle',        colorClass: 'action-btn--break' },
    'END_BREAK_1':   { label: 'End Break',   icon: 'bi-play-circle',         colorClass: 'action-btn--break' },
    'START_BREAK_2': { label: 'Break 2',     icon: 'bi-pause-circle-fill',   colorClass: 'action-btn--break' },
    'END_BREAK_2':   { label: 'End Break 2', icon: 'bi-play-circle-fill',    colorClass: 'action-btn--break' },
    'START_LUNCH':   { label: 'Lunch',       icon: 'bi-egg-fried',           colorClass: 'action-btn--lunch' },
    'END_LUNCH':     { label: 'End Lunch',   icon: 'bi-arrow-return-left',   colorClass: 'action-btn--lunch' },
  };

  constructor(
    private route: ActivatedRoute,
    private kioskService: KioskService,
    public branding: BrandingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.companyId = Number(this.route.snapshot.paramMap.get('companyId'));

    if (this.companyId && !this.branding.loaded) {
      this.branding.loadPublic(this.companyId).subscribe(() => this.cdr.markForCheck());
    }

    this.clockSub = interval(1000).subscribe(() => {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.currentDate = now.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      this.activeBreaks.forEach(e => {
        e.elapsedSec = Math.floor((Date.now() - e.startTime.getTime()) / 1000);
      });
      this.cdr.markForCheck();
    });

    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.currentDate = now.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    this.fetchActiveBreaks();
    this.pollSub = interval(30_000).subscribe(() => this.fetchActiveBreaks());
  }

  ngOnDestroy(): void {
    this.clockSub?.unsubscribe();
    this.elapsedSub?.unsubscribe();
    this.pollSub?.unsubscribe();
    clearTimeout(this.resetTimer);
  }

  // ── State machine ──────────────────────────────────────────────

  startEntry(): void {
    this.employeeIdInput = '';
    this.pinInput = '';
    this.showBreakList = false;
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
      .subscribe({ next: res => this.handleResponse(res), error: err => this.handleError(err) });
  }

  selectAction(opt: ActionOption): void {
    if (!opt.enabled) return;
    clearTimeout(this.resetTimer);
    this.state = 'CONFIRMING';
    this.cdr.markForCheck();
    const fullEmployeeId = 'LKC' + this.employeeIdInput.trim().padStart(4, '0');
    this.kioskService.punch(fullEmployeeId, this.pinInput, this.companyId, opt.action)
      .subscribe({ next: res => this.handleResponse(res), error: err => this.handleError(err) });
  }

  toggleBreakList(): void {
    this.showBreakList = !this.showBreakList;
    this.cdr.markForCheck();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(e: KeyboardEvent): void {
    // Don't capture keys when typing in a native input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (this.state) {
      case 'IDLE':
        if (e.key !== 'Tab') this.startEntry();
        break;

      case 'ENTER_ID':
        if (e.key >= '0' && e.key <= '9') this.pressKey(e.key);
        else if (e.key === 'Backspace')    this.backspace();
        else if (e.key === 'Enter')        this.confirmId();
        else if (e.key === 'Escape')       this.reset();
        break;

      case 'ENTER_PIN':
        if (e.key >= '0' && e.key <= '9') this.pressKey(e.key);
        else if (e.key === 'Backspace')    this.backspace();
        else if (e.key === 'Escape')       this.reset();
        break;

      case 'ACTION_SELECT': {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= this.actionOptions.length) {
          const opt = this.actionOptions[num - 1];
          if (opt.enabled) this.selectAction(opt);
        } else if (e.key === 'Escape') {
          this.reset();
        }
        break;
      }

      case 'SUCCESS':
      case 'ERROR':
        if (e.key === 'Enter' || e.key === 'Escape') this.reset();
        break;
    }
  }

  private handleResponse(res: any): void {
    const r = res.data.result;

    if (r.actionOptions && r.actionOptions.length > 0) {
      this.actionOptions     = r.actionOptions;
      this.selectEmployeeName = r.employeeName;
      this.state = 'ACTION_SELECT';
      this.cdr.markForCheck();
      this.resetTimer = setTimeout(() => this.reset(), 60_000);
      return;
    }

    clearTimeout(this.resetTimer);

    if (['START_BREAK_1','END_BREAK_1','START_BREAK_2','END_BREAK_2','START_LUNCH','END_LUNCH'].includes(r.action)) {
      this.fetchActiveBreaks();
    }

    this.result = {
      action:       r.action,
      employeeName: r.employeeName,
      punchTime:    new Date(r.punchTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
      hoursWorked:  r.hoursWorked
    };
    this.state = 'SUCCESS';
    this.cdr.markForCheck();
    this.resetTimer = setTimeout(() => this.reset(), 6000);

    this.stopElapsedTimer();
    if (r.action === 'START_BREAK_1' || r.action === 'START_BREAK_2') {
      this.breakStartTime = new Date(r.punchTime);
      this.activeLimit    = this.BREAK_LIMIT_SEC;
      this.startElapsedTimer();
    } else if (r.action === 'START_LUNCH') {
      this.breakStartTime = new Date(r.punchTime);
      this.activeLimit    = this.LUNCH_LIMIT_SEC;
      this.startElapsedTimer();
    }
  }

  private handleError(err: any): void {
    console.error('[KIOSK] punch error:', err?.error);
    this.errorMessage = err?.error?.reason || err?.error?.message || 'Something went wrong. Please try again.';
    this.state = 'ERROR';
    this.cdr.markForCheck();
    this.resetTimer = setTimeout(() => this.reset(), 4000);
  }

  reset(): void {
    clearTimeout(this.resetTimer);
    this.stopElapsedTimer();
    this.state = 'IDLE';
    this.employeeIdInput    = '';
    this.pinInput           = '';
    this.result             = null;
    this.errorMessage       = '';
    this.actionOptions      = [];
    this.selectEmployeeName = '';
    this.showBreakList      = false;
    this.cdr.markForCheck();
  }

  // ── Elapsed timer ──────────────────────────────────────────────

  private startElapsedTimer(): void {
    this.elapsedSub = interval(1000).subscribe(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.breakStartTime!.getTime()) / 1000);
      this.alarmActive    = this.elapsedSeconds >= this.activeLimit &&
                            this.elapsedSeconds < this.activeLimit + this.GRACE_PERIOD_SEC;
      this.cdr.markForCheck();
    });
  }

  private stopElapsedTimer(): void {
    this.elapsedSub?.unsubscribe();
    this.elapsedSub     = null;
    this.elapsedSeconds = 0;
    this.alarmActive    = false;
    this.breakStartTime = null;
  }

  get elapsedFormatted(): string {
    const m = Math.floor(this.elapsedSeconds / 60);
    const s = this.elapsedSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get limitFormatted(): string {
    return Math.floor(this.activeLimit / 60) + ' min';
  }

  // ── Live board ─────────────────────────────────────────────────

  private fetchActiveBreaks(): void {
    if (!this.companyId) return;
    this.kioskService.getActiveBreaks(this.companyId).subscribe({
      next: res => {
        this.activeBreaks = (res.data.entries as any[]).map(e => ({
          employeeName: e.employeeName,
          employeeId:   e.employeeId,
          status:       e.status,
          startTime:    new Date(e.startTime),
          elapsedSec:   Math.floor((Date.now() - new Date(e.startTime).getTime()) / 1000)
        }));
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  isOverLimit(entry: { status: string; elapsedSec: number }): boolean {
    const limit = entry.status === 'ON_LUNCH' ? this.LUNCH_LIMIT_SEC : this.BREAK_LIMIT_SEC;
    return entry.elapsedSec >= limit;
  }

  isInGrace(entry: { status: string; elapsedSec: number }): boolean {
    const limit = entry.status === 'ON_LUNCH' ? this.LUNCH_LIMIT_SEC : this.BREAK_LIMIT_SEC;
    return entry.elapsedSec >= limit && entry.elapsedSec < limit + this.GRACE_PERIOD_SEC;
  }

  getActionMeta(action: string): ActionMeta {
    return this.ACTION_META[action] ?? { label: action, icon: 'bi-circle', colorClass: '' };
  }

  readonly KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#'];
}
