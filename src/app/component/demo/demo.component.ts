// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Component } from '@angular/core';

export interface DemoModule {
  icon: string;
  color: string;
  name: string;
  tag: string;
  desc: string;
  features: string[];
  route: string;
  badge?: string;
}

@Component({
  standalone: false,
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent {

  readonly stats = [
    { value: '15+', label: 'Modules' },
    { value: '360°', label: 'HR Coverage' },
    { value: 'ZAR', label: 'South African' },
    { value: 'Live', label: 'Cloud-Hosted' },
  ];

  readonly modules: DemoModule[] = [
    {
      icon: 'bi-speedometer2',
      color: '#3b82f6',
      name: 'Dashboard',
      tag: 'Overview',
      desc: 'Real-time HR command centre with live stats, attendance feed, and financial summaries.',
      features: ['Live attendance & GPS clock-in/out', 'Leave balance & pending approvals', 'Financial income vs expense trends'],
      route: '/',
    },
    {
      icon: 'bi-people-fill',
      color: '#8b5cf6',
      name: 'Employees',
      tag: 'People',
      desc: 'Complete employee lifecycle from onboarding to offboarding.',
      features: ['Rich profiles with documents & history', 'Status management (Active, Terminated, On Leave)', 'Department & designation assignment'],
      route: '/employee',
    },
    {
      icon: 'bi-cash-stack',
      color: '#10b981',
      name: 'Payroll',
      tag: 'Finance',
      desc: 'End-to-end payroll processing with built-in payment gateway support.',
      features: ['Payslip generation & PDF download', 'Bulk payslip email delivery', 'PayFast payment gateway integration'],
      route: '/payroll',
      badge: 'PayFast',
    },
    {
      icon: 'bi-clock-history',
      color: '#f59e0b',
      name: 'Attendance',
      tag: 'Time & Work',
      desc: 'Daily attendance tracking for every employee with full audit trail.',
      features: ['Weekly grid view across all staff', 'Mark Present, Absent, Late, Half Day', 'Excel & PDF export reports'],
      route: '/attendance',
    },
    {
      icon: 'bi-calendar2-check',
      color: '#6366f1',
      name: 'Leave',
      tag: 'Time & Work',
      desc: 'Leave request workflow with automatic balance tracking and SA labour law defaults.',
      features: ['Approve / reject with one click', 'Doctor note upload for sick leave', 'Auto-initialised annual, sick & family leave'],
      route: '/admin/leave',
    },
    {
      icon: 'bi-tablet',
      color: '#06b6d4',
      name: 'Kiosk',
      tag: 'Time & Work',
      desc: 'PIN-based self-service clock terminal — no phone or login needed.',
      features: ['Clock in/out, breaks & lunch', 'Live break board with time alerts', 'Works on any tablet or shared screen'],
      route: '/kiosk/1',
      badge: 'Public',
    },
    {
      icon: 'bi-receipt-cutoff',
      color: '#ec4899',
      name: 'Expenses',
      tag: 'Finance',
      desc: 'Track every business expense with a full chart of accounts and vendor management.',
      features: ['Profit & Loss statement by period', 'Chart of accounts (QuickBooks-style)', 'Budget vs actual analysis'],
      route: '/expenses',
    },
    {
      icon: 'bi-calculator',
      color: '#14b8a6',
      name: 'Accounting',
      tag: 'Finance',
      desc: 'A complete accounting suite covering the full AP/AR cycle.',
      features: ['Bills, quotes & credit notes', 'VAT201 return calculator', 'Banking reconciliation & inventory'],
      route: '/accounting',
    },
    {
      icon: 'bi-file-earmark-text',
      color: '#f97316',
      name: 'Invoices',
      tag: 'Finance',
      desc: 'Create and send professional invoices directly from the platform.',
      features: ['Branded invoice generation', 'Email delivery to clients', 'Paid / Pending / Overdue tracking'],
      route: '/invoices',
    },
    {
      icon: 'bi-person-lines-fill',
      color: '#22c55e',
      name: 'Clients',
      tag: 'Finance',
      desc: 'Manage your client base with contact history and invoice records.',
      features: ['Client profiles & contact info', 'Invoice history per client', 'Linked to accounting module'],
      route: '/customers',
    },
    {
      icon: 'bi-laptop',
      color: '#ef4444',
      name: 'Asset Management',
      tag: 'Operations',
      desc: 'Track every company asset from laptops to vehicles across the organisation.',
      features: ['Assign assets to employees', 'Maintenance & retirement tracking', 'Category & status filters'],
      route: '/assets',
    },
    {
      icon: 'bi-tag-fill',
      color: '#a855f7',
      name: 'Expense Claims',
      tag: 'Operations',
      desc: 'Employee expense claim submission and approval workflow.',
      features: ['Submit claims with receipt upload', 'Approve, reject or request info', 'Claim history & status'],
      route: '/expense-claims',
    },
    {
      icon: 'bi-megaphone-fill',
      color: '#0ea5e9',
      name: 'Announcements',
      tag: 'Communication',
      desc: 'Broadcast company news to specific teams, roles or the whole organisation.',
      features: ['Priority levels: Low → Urgent', 'Target by department or role', 'Pin & schedule expiry'],
      route: '/announcements',
    },
    {
      icon: 'bi-bell-fill',
      color: '#64748b',
      name: 'Notifications',
      tag: 'Communication',
      desc: 'In-app notification centre for leave updates, approvals and system alerts.',
      features: ['Filter by type (Leave, Payroll, System)', 'Bulk mark as read / delete', 'Real-time unread badge'],
      route: '/notifications',
    },
    {
      icon: 'bi-building-gear',
      color: '#475569',
      name: 'Company Settings',
      tag: 'Platform',
      desc: 'Brand your ORION workspace with your company logo and colours.',
      features: ['Upload logo & set brand colour', 'Company name & contact details', 'Instant live preview'],
      route: '/settings/company',
    },
  ];
}
