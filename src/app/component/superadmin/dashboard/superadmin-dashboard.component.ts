// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { SuperadminService } from '../superadmin.service';
import { HolidayService } from '../../../service/holiday.service';
import { Key } from '../../../enum/key.enum';
import { NotificationService } from '../../../service/notification.service';

Chart.register(...registerables);

@Component({
  standalone: false,
  selector: 'app-superadmin-dashboard',
  templateUrl: './superadmin-dashboard.component.html',
  styleUrls: ['./superadmin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('growthChart') growthChartRef!: ElementRef;

  stats: any    = null;
  companies: any[] = [];
  loading       = true;
  impersonating = false;
  currentYear   = new Date().getFullYear();

  // Calendar
  calendarDate      = new Date();
  calendarEvents:   any[] = [];  // announcements
  calendarHolidays: any[] = [];  // holidays

  // Calendar popup
  popupCell: { date: Date | null; events: any[]; holidays: any[] } | null = null;
  popupStyle: { [key: string]: string } = {};

  private chart: Chart | null = null;
  private dataLoaded = false;
  private viewReady  = false;

  // Create Admin modal
  showAdminModal           = false;
  adminTargetCompany: any  = null;
  savingAdmin              = false;
  createdAdminCredentials: { email: string; tempPassword: string } | null = null;

  constructor(
    private superadminService: SuperadminService,
    private holidayService: HolidayService,
    private notification: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.impersonating = this.superadminService.isImpersonating();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryBuildChart();
  }

  loadData(): void {
    this.loading = true;
    this.superadminService.getStats().subscribe({
      next: res => { this.stats = res.data; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
    this.superadminService.getCompanies(0, 100).subscribe({
      next: res => {
        this.companies = res.data?.companies?.content ?? [];
        this.dataLoaded = true;
        this.cdr.markForCheck();
        this.tryBuildChart();
      },
      error: () => {}
    });
    // Load platform announcements as calendar events
    this.superadminService.getPlatformAnnouncements().subscribe({
      next: res => { this.calendarEvents = res.data?.announcements ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });
    // Load holidays for the current year
    this.holidayService.getHolidaysByYear$(this.currentYear).subscribe({
      next: res => { this.calendarHolidays = res.data?.holidays ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  private tryBuildChart(): void {
    if (!this.viewReady || !this.dataLoaded || !this.growthChartRef) return;
    if (this.chart) { this.chart.destroy(); this.chart = null; }

    const labels = this.companies.slice(0, 8).map(c => c.name || c.code || `Co. ${c.id}`);
    // Use user counts per company if available; fall back to placeholder
    const data   = this.companies.slice(0, 8).map(() => Math.floor(Math.random() * 0)); // zero until real data

    const cfg: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Employees',
            data: this.companies.slice(0, 8).map(c => c.userCount ?? c.employeeCount ?? 0),
            backgroundColor: [
              'rgba(44,123,229,.8)', 'rgba(0,217,126,.8)', 'rgba(246,195,67,.8)',
              'rgba(230,55,87,.7)', 'rgba(123,94,167,.8)', 'rgba(32,201,151,.8)',
              'rgba(44,123,229,.5)', 'rgba(0,217,126,.5)'
            ],
            borderColor: ['#2c7be5','#00d97e','#f6c343','#e63757','#7b5ea7','#20c997','#2c7be5','#00d97e'],
            borderWidth: 2,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    };
    this.chart = new Chart(this.growthChartRef.nativeElement, cfg);
  }

  ngOnDestroy(): void { this.chart?.destroy(); }

  round(n: number): number { return Math.round(n); }

  // ── Calendar ──────────────────────────────────────────────────
  get calendarYear():  number { return this.calendarDate.getFullYear(); }
  get calendarMonth(): number { return this.calendarDate.getMonth(); }

  get calendarMonthLabel(): string {
    return this.calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  get calendarDays(): Array<{ date: Date | null; events: any[]; holidays: any[] }> {
    const year  = this.calendarYear;
    const month = this.calendarMonth;
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ date: Date | null; events: any[]; holidays: any[] }> = [];
    // Leading blanks
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, events: [], holidays: [] });
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const events = this.calendarEvents.filter(e => {
        if (!e.created_at) return false;
        const ev = new Date(e.created_at);
        return ev.getFullYear() === year && ev.getMonth() === month && ev.getDate() === d;
      });
      const holidays = this.calendarHolidays.filter(h => {
        if (!h.holidayDate) return false;
        const hd = new Date(h.holidayDate);
        return hd.getFullYear() === year && hd.getMonth() === month && hd.getDate() === d;
      });
      cells.push({ date, events, holidays });
    }
    return cells;
  }

  isToday(date: Date | null): boolean {
    if (!date) return false;
    const t = new Date();
    return date.getFullYear() === t.getFullYear() &&
           date.getMonth()    === t.getMonth()    &&
           date.getDate()     === t.getDate();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.popupCell) {
      const popup = this.elementRef.nativeElement.querySelector('.cal-popup');
      if (popup && !popup.contains(event.target)) {
        this.closePopup();
        this.cdr.markForCheck();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closePopup();
    this.cdr.markForCheck();
  }

  openPopup(cell: { date: Date | null; events: any[]; holidays: any[] }, event: MouseEvent): void {
    if (!cell.date || (cell.events.length === 0 && cell.holidays.length === 0)) {
      this.closePopup();
      return;
    }
    event.stopPropagation();

    const popupW = 280;
    const popupMaxH = 320;
    const margin = 6;

    const calendarEl = this.elementRef.nativeElement as HTMLElement;
    const calendarRect = calendarEl.getBoundingClientRect();

    const target = event.currentTarget as Element;
    const cellRect = target?.getBoundingClientRect?.() ?? {
      left: event.clientX, right: event.clientX,
      top: event.clientY, bottom: event.clientY
    };

    let left = cellRect.left - calendarRect.left;
    let top  = cellRect.bottom - calendarRect.top + 4;

    if (left + popupW > calendarRect.width - margin) {
      left = cellRect.right - calendarRect.left - popupW;
    }
    if (left < margin) left = margin;
    if (top + popupMaxH > calendarRect.height - margin) {
      top = cellRect.top - calendarRect.top - popupMaxH - 4;
    }
    if (top < margin) top = margin;

    this.popupStyle = {
      position: 'absolute',
      top:  top  + 'px',
      left: left + 'px',
      width: popupW + 'px',
      'max-height': popupMaxH + 'px',
      'z-index': '9999'
    };
    this.popupCell = cell;
    this.cdr.markForCheck();
  }

  closePopup(): void {
    this.popupCell = null;
  }

  prevMonth(): void {
    this.calendarDate = new Date(this.calendarYear, this.calendarMonth - 1, 1);
    this.closePopup();
  }
  nextMonth(): void {
    this.calendarDate = new Date(this.calendarYear, this.calendarMonth + 1, 1);
    this.closePopup();
  }

  // ── Impersonation ─────────────────────────────────────────────
  impersonate(company: any): void {
    const currentToken = localStorage.getItem(Key.TOKEN);
    if (currentToken) localStorage.setItem(Key.SUPERADMIN_TOKEN, currentToken);
    this.superadminService.impersonate(company.id).subscribe({
      next: res => {
        localStorage.setItem(Key.TOKEN, res.data.access_token);
        localStorage.setItem(Key.COMPANY_ID, String(company.id));
        this.notification.onDefault(`Now viewing as: ${company.name}`);
        this.router.navigate(['/']);
      },
      error: err => this.notification.onError(err)
    });
  }

  exitImpersonation(): void {
    this.superadminService.exitImpersonation();
    this.impersonating = false;
    this.notification.onDefault('Returned to Super-Admin view');
    window.location.reload();
  }

  // ── Create Admin modal ────────────────────────────────────────
  openCreateAdmin(company: any): void {
    this.adminTargetCompany = company;
    this.createdAdminCredentials = null;
    this.showAdminModal = true;
  }

  closeAdminModal(): void {
    this.showAdminModal = false;
    this.adminTargetCompany = null;
    this.createdAdminCredentials = null;
  }

  createAdmin(form: NgForm): void {
    if (form.invalid) return;
    this.savingAdmin = true;
    this.superadminService.createCompanyAdmin(this.adminTargetCompany.id, form.value).subscribe({
      next: res => {
        this.savingAdmin = false;
        this.createdAdminCredentials = { email: res.data.email, tempPassword: res.data.tempPassword };
        this.cdr.markForCheck();
        this.notification.onDefault('Company admin created successfully');
      },
      error: err => { this.savingAdmin = false; this.notification.onError(err); this.cdr.markForCheck(); }
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => this.notification.onDefault('Copied to clipboard'));
  }

  trackById = (index: number, item: any) => item.id;
  trackByValue = (index: number, value: any) => value;
  trackByIndex = (index: number) => index;
}
