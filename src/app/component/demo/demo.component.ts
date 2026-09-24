// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  standalone: false,
  selector: 'app-landing',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent {

  // ── Contact / Demo Request Modal ─────────────────────────────────────────
  showContactModal = false;
  contactSubmitting = false;
  contactSubmitted = false;
  contactForm = this.emptyContactForm();

  private emptyContactForm() {
    return { firstName: '', lastName: '', companyName: '', email: '', contactNumber: '', subject: '', message: '' };
  }

  openContactModal(subject: string = ''): void {
    this.contactForm = this.emptyContactForm();
    this.contactForm.subject = subject;
    this.contactSubmitted = false;
    this.showContactModal = true;
  }

  closeContactModal(): void {
    this.showContactModal = false;
  }

  submitContactForm(): void {
    const f = this.contactForm;
    if (!f.firstName.trim() || !f.lastName.trim() || !f.email.trim() || !f.message.trim()) return;
    this.contactSubmitting = true;

    const bodyLines = [
      `First Name: ${f.firstName}`,
      `Last Name: ${f.lastName}`,
      `Company Name: ${f.companyName}`,
      `Email Address: ${f.email}`,
      `Contact Number: ${f.contactNumber}`,
      `Subject: ${f.subject}`,
      '',
      f.message
    ];
    const subjectLine = f.subject ? f.subject : 'Enterprise360 website enquiry';
    const mailto = `mailto:akshar@silverspectrumsolutions.co.za?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;

    this.contactSubmitting = false;
    this.contactSubmitted = true;
  }

  // ── Module Grid ──────────────────────────────────────────────────────────
  selectedModule: any = null;
  private closeModuleTimer: ReturnType<typeof setTimeout> | null = null;

  openModule(mod: any): void {
    this.cancelCloseModule();
    this.selectedModule = mod;
  }
  closeModule(): void {
    this.cancelCloseModule();
    this.selectedModule = null;
  }
  /** Give the pointer a moment to travel from the tile to the popup before closing, so hovering across the gap doesn't snap it shut. */
  scheduleCloseModule(): void {
    this.cancelCloseModule();
    this.closeModuleTimer = setTimeout(() => { this.selectedModule = null; }, 250);
  }
  cancelCloseModule(): void {
    if (this.closeModuleTimer) {
      clearTimeout(this.closeModuleTimer);
      this.closeModuleTimer = null;
    }
  }

  trackByModuleName(_index: number, mod: any): string { return mod.name; }

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Wraps a module's inner <path> markup in the shared Tabler-style <svg> shell and sanitizes it
   * for [innerHTML]. width/height are baked in as 100% (rather than sized via CSS) because content
   * inserted via [innerHTML] falls outside Angular's view encapsulation, so scoped stylesheet rules
   * can never match it — the actual pixel size is controlled by sizing the parent span instead.
   */
  getIconHtml(mod: any): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${mod.iconSvg}</svg>`
    );
  }

  readonly marqueeModules = [
    {
      name: 'Dashboard',
      tag: 'Overview',
      iconSvg: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M13.41 10.59l2.59 -2.59" /><path d="M7 12a5 5 0 0 1 5 -5" />',
      color: '#3b82f6',
      desc: 'Real-time HR command centre with live stats, attendance feed and financial summaries.',
      features: ['Live employee stats at a glance', 'Attendance feed with status dots', 'Financial summary charts', 'Leave approval queue', 'Recent payroll activity']
    },
    {
      name: 'Employees',
      tag: 'People',
      iconSvg: '<path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />',
      color: '#8b5cf6',
      desc: 'Complete employee lifecycle from onboarding to offboarding with rich profiles and document management.',
      features: ['Rich profiles with photos & docs', 'Department & designation tracking', 'Status management (Active / On Leave)', 'Employee self-service portal', 'Role-based access control']
    },
    {
      name: 'Payroll',
      tag: 'Finance',
      iconSvg: '<path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M3 8a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -8" /><path d="M18 12h.01" /><path d="M6 12h.01" />',
      color: '#10b981',
      desc: 'End-to-end payroll processing with a built-in payment gateway and automated payslip delivery.',
      features: ['Payslip PDF generation per employee', 'Bulk email delivery by pay period', 'Draft → Processed → Paid workflow', 'Payment gateway integrations available', 'Monthly salary breakdown view']
    },
    {
      name: 'Attendance',
      tag: 'Time',
      iconSvg: '<path d="M20.942 13.021a9 9 0 1 0 -9.407 7.967" /><path d="M12 7v5l3 3" /><path d="M15 19l2 2l4 -4" />',
      color: '#f59e0b',
      desc: 'Daily attendance tracking for every employee with a full weekly grid and export options.',
      features: ['Weekly grid: Present / Absent / Late', 'Half-day and On-Leave marking', 'Excel & PDF export', 'Clock-in/out audit trail', 'Public holiday calendar integration']
    },
    {
      name: 'Leave Management',
      tag: 'Time',
      iconSvg: '<path d="M11.5 21h-5.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M15 19l2 2l4 -4" />',
      color: '#6366f1',
      desc: 'Leave request workflow with automatic balance tracking and South African labour law defaults.',
      features: ['One-click approve / reject', 'Doctor note document upload', 'Auto SA Labour Law leave types', 'Leave balance tracking', 'Annual, Sick, Family & Maternity']
    },
    {
      name: 'Kiosk Terminal',
      tag: 'Time',
      iconSvg: '<path d="M5 4a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v16a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1v-16" /><path d="M11 17a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />',
      color: '#06b6d4',
      desc: 'PIN-based self-service clock terminal — mount a tablet on the wall, no phone or login required.',
      features: ['Clock in/out & break tracking', 'Live break board display', 'Works on any tablet browser', 'Employee number + PIN auth', 'Automatic audit record']
    },
    {
      name: 'Expenses',
      tag: 'Finance',
      iconSvg: '<path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2" /><path d="M14 8h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5m2 0v1.5m0 -9v1.5" />',
      color: '#ec4899',
      desc: 'Track every business expense with chart of accounts, vendor management and income statement export.',
      features: ['Chart of accounts management', 'Vendor / supplier directory', 'P&L by date range', 'Excel income statement export', 'Budget vs actual tracking']
    },
    {
      name: 'Accounting',
      tag: 'Finance',
      iconSvg: '<path d="M4 5a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -14" /><path d="M8 8a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v1a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1l0 -1" /><path d="M8 14l0 .01" /><path d="M12 14l0 .01" /><path d="M16 14l0 .01" /><path d="M8 17l0 .01" /><path d="M12 17l0 .01" /><path d="M16 17l0 .01" />',
      color: '#14b8a6',
      desc: 'Full AP/AR accounting suite covering the entire billing cycle from quote to payment.',
      features: ['Supplier bills & AP management', 'Quotes with convert-to-invoice', 'Credit notes', 'VAT201 calculator & returns', 'Banking reconciliation']
    },
    {
      name: 'Contract Management',
      tag: 'Ops',
      iconSvg: '<path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" />',
      color: '#3b82f6',
      desc: 'Full contract lifecycle — draft, approve, activate, track expiry and store all documents in one place.',
      features: ['Multi-step approval workflow', 'Document upload & download', 'Expiry alerts (30/60/90 days)', 'Daily scheduler: auto-marks EXPIRING_SOON', 'Terminate & renew with full audit']
    },
    {
      name: 'Asset Management',
      tag: 'Ops',
      iconSvg: '<path d="M3 19l18 0" /><path d="M5 7a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1l0 -8" />',
      color: '#ef4444',
      desc: 'Track every company asset from laptops to vehicles — assign to employees and log maintenance.',
      features: ['Asset catalogue with categories', 'Assign assets to employees', 'Maintenance & condition tracking', 'Employee self-service asset requests', 'Audit-trail per asset']
    },
    {
      name: 'Invoices',
      tag: 'Finance',
      iconSvg: '<path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /><path d="M9 7l1 0" /><path d="M9 13l6 0" /><path d="M13 17l2 0" />',
      color: '#f97316',
      desc: 'Create and send professional branded invoices directly from the platform to your clients.',
      features: ['Branded PDF invoice generation', 'Email to clients directly', 'Paid / Pending / Overdue status', 'Linked to client profiles', 'Invoice history per client']
    },
    {
      name: 'Clients',
      tag: 'Finance',
      iconSvg: '<path d="M20 6v12a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2" /><path d="M10 16h6" /><path d="M11 11a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 8h3" /><path d="M4 12h3" /><path d="M4 16h3" />',
      color: '#22c55e',
      desc: 'Manage your entire client base with contact history, notes and linked invoice records.',
      features: ['Client profiles & contacts', 'Full invoice history per client', 'Linked to accounting module', 'Notes & communication log', 'Quick invoice creation from profile']
    },
    {
      name: 'Expense Claims',
      tag: 'Ops',
      iconSvg: '<path d="M6.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3" />',
      color: '#a855f7',
      desc: 'Employee expense claim submission, receipt upload and approval workflow in one place.',
      features: ['Receipt photo upload', 'Approve or reject claims', 'Full claim history', 'Category-based tracking', 'Export to accounting']
    },
    {
      name: 'Announcements',
      tag: 'Comms',
      iconSvg: '<path d="M18 8a3 3 0 0 1 0 6" /><path d="M10 8v11a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1v-5" /><path d="M12 8l4.524 -3.77a.9 .9 0 0 1 1.476 .692v12.156a.9 .9 0 0 1 -1.476 .692l-4.524 -3.77h-8a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h8" />',
      color: '#0ea5e9',
      desc: 'Broadcast company news to specific departments or the whole organisation with priority levels.',
      features: ['Priority levels (Info / Warning / Critical)', 'Target by department or all', 'Pin announcements', 'Schedule expiry date', 'Read / unread tracking']
    },
    {
      name: 'Notifications',
      tag: 'Comms',
      iconSvg: '<path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" />',
      color: '#64748b',
      desc: 'In-app notification centre for leave approvals, payroll events, contract alerts and system messages.',
      features: ['Filter by notification type', 'Bulk mark as read', 'Real-time unread badge count', 'Priority-based display', 'Contract expiry alerts']
    }
  ];

  // ── Why Choose Enterprise360 (4-card grid) ───────────────────────────────
  readonly whyCards = [
    {
      label: '🇿🇦 Built for South Africa',
      iconSvg: '<path d="M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06" /><path d="M15 19l2 2l4 -4" />',
      color: '#7c3aed',
      title: 'Built for South Africa',
      desc: 'Designed from the ground up for the South African context — no configuration needed to get started with local compliance.',
      features: [
        'South African Rand (ZAR) currency throughout',
        'SAST timezone (Africa/Johannesburg)',
        'SA public holidays pre-loaded',
        'SA Labour Law leave defaults'
      ]
    },
    {
      label: '🔗 All-in-One Platform',
      iconSvg: '<path d="M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" /><path d="M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" /><path d="M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" /><path d="M14 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />',
      color: '#4ea41b',
      title: 'All-in-One Platform',
      desc: 'HR, Payroll, Accounting, Assets, Invoicing, Leave, Attendance and more — one login, one system, zero integrations to manage.',
      features: [
        '15+ modules in one platform',
        'Single sign-on for all modules',
        'Data flows between modules automatically',
        'Role-based access per module'
      ]
    },
    {
      label: '☁️ Cloud-Hosted & Fast',
      iconSvg: '<path d="M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878" />',
      color: '#0ea5e0',
      title: 'Cloud-Hosted & Fast',
      desc: 'Deployed on enterprise-grade cloud infrastructure — accessible from any device, always up to date, with no installation required.',
      features: [
        'Hosted on Railway (frontend + API)',
        'Works on desktop, tablet and mobile',
        'Automatic updates — no IT department needed',
        'Global CDN for fast load times'
      ]
    },
    {
      label: '🏢 Multi-Company Ready',
      iconSvg: '<path d="M3 21l18 0" /><path d="M5 21v-14l8 -4v18" /><path d="M19 21v-10l-6 -4" /><path d="M9 9l0 .01" /><path d="M9 12l0 .01" /><path d="M9 15l0 .01" /><path d="M9 18l0 .01" />',
      color: '#f59e0b',
      title: 'Multi-Company Ready',
      desc: 'Manage multiple entities from a single superadmin account — each company has its own data, employees, branding and settings.',
      features: [
        'Superadmin platform dashboard',
        'Full data isolation per company',
        'Custom branding (logo + colour) per company',
        'Usage analytics per company'
      ]
    }
  ];
}
