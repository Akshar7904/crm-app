// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-landing',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent implements OnInit, OnDestroy {

  // ── Module Grid ──────────────────────────────────────────────────────────
  selectedModule: any = null;
  shuffledModules: any[] = [];
  isShuffling = false;
  private shuffleTimer: any = null;

  openModule(mod: any): void { this.selectedModule = mod; }
  closeModule(): void { this.selectedModule = null; }

  trackByModuleName(_index: number, mod: any): string { return mod.name; }

  private shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  readonly marqueeModules = [
    {
      name: 'Dashboard',
      tag: 'Overview',
      icon: 'bi-speedometer2',
      color: '#3b82f6',
      desc: 'Real-time HR command centre with live stats, attendance feed and financial summaries.',
      features: ['Live employee stats at a glance', 'Attendance feed with status dots', 'Financial summary charts', 'Leave approval queue', 'Recent payroll activity']
    },
    {
      name: 'Employees',
      tag: 'People',
      icon: 'bi-people-fill',
      color: '#8b5cf6',
      desc: 'Complete employee lifecycle from onboarding to offboarding with rich profiles and document management.',
      features: ['Rich profiles with photos & docs', 'Department & designation tracking', 'Status management (Active / On Leave)', 'Employee self-service portal', 'Role-based access control']
    },
    {
      name: 'Payroll',
      tag: 'Finance',
      icon: 'bi-cash-stack',
      color: '#10b981',
      desc: 'End-to-end payroll processing with built-in PayFast payment gateway and automated payslip delivery.',
      features: ['Payslip PDF generation per employee', 'Bulk email delivery by pay period', 'Draft → Processed → Paid workflow', 'PayFast payment gateway built-in', 'Monthly salary breakdown view']
    },
    {
      name: 'Attendance',
      tag: 'Time',
      icon: 'bi-clock-history',
      color: '#f59e0b',
      desc: 'Daily attendance tracking for every employee with a full weekly grid and export options.',
      features: ['Weekly grid: Present / Absent / Late', 'Half-day and On-Leave marking', 'Excel & PDF export', 'Clock-in/out audit trail', 'Public holiday calendar integration']
    },
    {
      name: 'Leave Management',
      tag: 'Time',
      icon: 'bi-calendar2-check',
      color: '#6366f1',
      desc: 'Leave request workflow with automatic balance tracking and South African labour law defaults.',
      features: ['One-click approve / reject', 'Doctor note document upload', 'Auto SA Labour Law leave types', 'Leave balance tracking', 'Annual, Sick, Family & Maternity']
    },
    {
      name: 'Kiosk Terminal',
      tag: 'Time',
      icon: 'bi-tablet',
      color: '#06b6d4',
      desc: 'PIN-based self-service clock terminal — mount a tablet on the wall, no phone or login required.',
      features: ['Clock in/out & break tracking', 'Live break board display', 'Works on any tablet browser', 'Employee number + PIN auth', 'Automatic audit record']
    },
    {
      name: 'Expenses',
      tag: 'Finance',
      icon: 'bi-receipt-cutoff',
      color: '#ec4899',
      desc: 'Track every business expense with chart of accounts, vendor management and income statement export.',
      features: ['Chart of accounts management', 'Vendor / supplier directory', 'P&L by date range', 'Excel income statement export', 'Budget vs actual tracking']
    },
    {
      name: 'Accounting',
      tag: 'Finance',
      icon: 'bi-calculator',
      color: '#14b8a6',
      desc: 'Full AP/AR accounting suite covering the entire billing cycle from quote to payment.',
      features: ['Supplier bills & AP management', 'Quotes with convert-to-invoice', 'Credit notes', 'VAT201 calculator & returns', 'Banking reconciliation']
    },
    {
      name: 'Contract Management',
      tag: 'Ops',
      icon: 'bi-file-earmark-text',
      color: '#3b82f6',
      desc: 'Full contract lifecycle — draft, approve, activate, track expiry and store all documents in one place.',
      features: ['Multi-step approval workflow', 'Document upload & download', 'Expiry alerts (30/60/90 days)', 'Daily scheduler: auto-marks EXPIRING_SOON', 'Terminate & renew with full audit']
    },
    {
      name: 'Asset Management',
      tag: 'Ops',
      icon: 'bi-laptop',
      color: '#ef4444',
      desc: 'Track every company asset from laptops to vehicles — assign to employees and log maintenance.',
      features: ['Asset catalogue with categories', 'Assign assets to employees', 'Maintenance & condition tracking', 'Employee self-service asset requests', 'Audit-trail per asset']
    },
    {
      name: 'Invoices',
      tag: 'Finance',
      icon: 'bi-file-earmark-text',
      color: '#f97316',
      desc: 'Create and send professional branded invoices directly from the platform to your clients.',
      features: ['Branded PDF invoice generation', 'Email to clients directly', 'Paid / Pending / Overdue status', 'Linked to client profiles', 'Invoice history per client']
    },
    {
      name: 'Clients',
      tag: 'Finance',
      icon: 'bi-person-lines-fill',
      color: '#22c55e',
      desc: 'Manage your entire client base with contact history, notes and linked invoice records.',
      features: ['Client profiles & contacts', 'Full invoice history per client', 'Linked to accounting module', 'Notes & communication log', 'Quick invoice creation from profile']
    },
    {
      name: 'Expense Claims',
      tag: 'Ops',
      icon: 'bi-tag-fill',
      color: '#a855f7',
      desc: 'Employee expense claim submission, receipt upload and approval workflow in one place.',
      features: ['Receipt photo upload', 'Approve or reject claims', 'Full claim history', 'Category-based tracking', 'Export to accounting']
    },
    {
      name: 'Announcements',
      tag: 'Comms',
      icon: 'bi-megaphone-fill',
      color: '#0ea5e9',
      desc: 'Broadcast company news to specific departments or the whole organisation with priority levels.',
      features: ['Priority levels (Info / Warning / Critical)', 'Target by department or all', 'Pin announcements', 'Schedule expiry date', 'Read / unread tracking']
    },
    {
      name: 'Notifications',
      tag: 'Comms',
      icon: 'bi-bell-fill',
      color: '#64748b',
      desc: 'In-app notification centre for leave approvals, payroll events, contract alerts and system messages.',
      features: ['Filter by notification type', 'Bulk mark as read', 'Real-time unread badge count', 'Priority-based display', 'Contract expiry alerts']
    }
  ];

  // ── Why Tabs (scroll-driven) ─────────────────────────────────────────────
  activeWhyTab = 0;
  setWhyTab(index: number): void { this.activeWhyTab = index; }

  @ViewChild('whySection') whySectionRef?: ElementRef<HTMLElement>;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const el = this.whySectionRef?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const scrolledPast = -rect.top;
    const trackHeight = el.offsetHeight - window.innerHeight;
    if (trackHeight <= 0) return;

    const progress = Math.min(1, Math.max(0, scrolledPast / trackHeight));
    const stepCount = this.whyTabs.length;
    const index = Math.min(stepCount - 1, Math.floor(progress * stepCount));
    if (index !== this.activeWhyTab && rect.top < window.innerHeight && rect.bottom > 0) {
      this.activeWhyTab = index;
    }
  }

  readonly whyTabs = [
    {
      label: '🇿🇦 Built for South Africa',
      icon: 'bi-shield-check',
      title: 'Built for South Africa',
      desc: 'Enterprize360 is designed from the ground up for the South African context — no configuration needed to get started with local compliance.',
      features: [
        'South African Rand (ZAR) currency throughout',
        'SAST timezone (Africa/Johannesburg)',
        'SA public holidays pre-loaded',
        'SA Labour Law leave defaults (Annual, Sick, Family, Maternity)',
        'PayFast payment gateway integration'
      ]
    },
    {
      label: '🔗 All-in-One Platform',
      icon: 'bi-grid-1x2-fill',
      title: 'All-in-One Platform',
      desc: 'HR, Payroll, Accounting, Assets, Invoicing, Leave, Attendance and more — one login, one system, zero integrations to manage.',
      features: [
        '15+ modules in one platform',
        'Single sign-on for all modules',
        'Data flows between modules automatically',
        'No third-party integrations needed',
        'Role-based access per module'
      ]
    },
    {
      label: '☁️ Cloud-Hosted & Fast',
      icon: 'bi-cloud-check-fill',
      title: 'Cloud-Hosted & Fast',
      desc: 'Enterprize360 is deployed on enterprise-grade cloud infrastructure — accessible from any device, always up to date, with no installation required.',
      features: [
        'Hosted on Railway (frontend + API)',
        'PostgreSQL database on Railway',
        'Works on desktop, tablet and mobile',
        'Automatic updates — no IT department needed',
        'Global CDN for fast load times'
      ]
    },
    {
      label: '🏢 Multi-Company Ready',
      icon: 'bi-building',
      title: 'Multi-Company Ready',
      desc: 'Manage multiple entities from a single superadmin account — each company has its own data, employees, branding and settings.',
      features: [
        'Superadmin platform dashboard',
        'Full data isolation per company',
        'Custom branding (logo + colour) per company',
        'Impersonation for support & admin',
        'Usage analytics per company'
      ]
    }
  ];

  ngOnInit(): void {
    this.shuffledModules = this.shuffle(this.marqueeModules);
    this.shuffleTimer = setInterval(() => {
      this.isShuffling = true;
      setTimeout(() => {
        this.shuffledModules = this.shuffle(this.marqueeModules);
        this.isShuffling = false;
      }, 350);
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.shuffleTimer) clearInterval(this.shuffleTimer);
  }
}
