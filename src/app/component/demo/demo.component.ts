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

  readonly whyItems = [
    { icon: 'bi-shield-check',     title: 'Built for South Africa',  desc: 'ZAR currency, SAST timezone, SA public holidays, and PayFast — no configuration needed.' },
    { icon: 'bi-grid-1x2-fill',    title: 'All-in-One Platform',     desc: 'HR, Payroll, Accounting, Assets and more — one login, one system, zero integrations.' },
    { icon: 'bi-cloud-check-fill', title: 'Cloud-Hosted & Fast',     desc: 'Deployed on Vercel and Render — accessible from any device, always up to date.' },
    { icon: 'bi-people-fill',      title: 'Multi-Company Ready',     desc: 'Run multiple entities from a single superadmin account with full data isolation.' },
  ];

  readonly howSteps = [
    { num: '01', icon: 'bi-building',        title: 'Set Up Your Company',  desc: 'Upload your logo, set your brand colour, add departments, designations and public holidays.' },
    { num: '02', icon: 'bi-person-plus-fill', title: 'Invite Your Team',    desc: 'Add employees, assign roles, configure leave entitlements and payroll salaries.' },
    { num: '03', icon: 'bi-rocket-takeoff',  title: 'Run Payroll & HR',     desc: 'Process payroll, approve leave, track attendance, manage assets and send invoices — all in one place.' },
  ];

  readonly modules: DemoModule[] = [
    {
      icon: 'bi-speedometer2',      color: '#3b82f6', name: 'Dashboard',        tag: 'Overview',
      desc: 'Real-time HR command centre with live stats, attendance feed and financial summaries.',
      features: ['Live GPS clock-in/out', 'Leave balance & pending approvals', 'Income vs expense trends'],
      route: '/',
    },
    {
      icon: 'bi-people-fill',       color: '#8b5cf6', name: 'Employees',        tag: 'People',
      desc: 'Complete employee lifecycle from onboarding to offboarding.',
      features: ['Rich profiles with documents', 'Status management', 'Department & designation'],
      route: '/employee',
    },
    {
      icon: 'bi-cash-stack',        color: '#10b981', name: 'Payroll',           tag: 'Finance',
      desc: 'End-to-end payroll processing with built-in PayFast payment gateway.',
      features: ['Payslip PDF generation', 'Bulk email delivery', 'PayFast integration'],
      route: '/payroll', badge: 'PayFast',
    },
    {
      icon: 'bi-clock-history',     color: '#f59e0b', name: 'Attendance',        tag: 'Time',
      desc: 'Daily attendance tracking for every employee with a full audit trail.',
      features: ['Weekly grid view', 'Mark Present / Absent / Late', 'Excel & PDF export'],
      route: '/attendance',
    },
    {
      icon: 'bi-calendar2-check',   color: '#6366f1', name: 'Leave',             tag: 'Time',
      desc: 'Leave request workflow with automatic balance tracking and SA labour law defaults.',
      features: ['One-click approve/reject', 'Doctor note upload', 'Auto SA law defaults'],
      route: '/admin/leave',
    },
    {
      icon: 'bi-tablet',            color: '#06b6d4', name: 'Kiosk',             tag: 'Time',
      desc: 'PIN-based self-service clock terminal — no phone or login needed.',
      features: ['Clock in/out & breaks', 'Live break board', 'Works on any tablet'],
      route: '/kiosk/1', badge: 'Public',
    },
    {
      icon: 'bi-receipt-cutoff',    color: '#ec4899', name: 'Expenses',          tag: 'Finance',
      desc: 'Track every business expense with chart of accounts and vendor management.',
      features: ['P&L by period', 'Chart of accounts', 'Budget vs actual'],
      route: '/expenses',
    },
    {
      icon: 'bi-calculator',        color: '#14b8a6', name: 'Accounting',        tag: 'Finance',
      desc: 'Complete accounting suite covering the full AP/AR cycle.',
      features: ['Bills, quotes & credit notes', 'VAT201 calculator', 'Banking reconciliation'],
      route: '/accounting',
    },
    {
      icon: 'bi-file-earmark-text', color: '#f97316', name: 'Invoices',          tag: 'Finance',
      desc: 'Create and send professional invoices directly from the platform.',
      features: ['Branded PDF invoices', 'Email delivery to clients', 'Paid/Pending/Overdue'],
      route: '/invoices',
    },
    {
      icon: 'bi-person-lines-fill', color: '#22c55e', name: 'Clients',           tag: 'Finance',
      desc: 'Manage your client base with contact history and invoice records.',
      features: ['Client profiles', 'Invoice history per client', 'Linked accounting'],
      route: '/customers',
    },
    {
      icon: 'bi-laptop',            color: '#ef4444', name: 'Asset Management',  tag: 'Ops',
      desc: 'Track every company asset from laptops to vehicles.',
      features: ['Assign to employees', 'Maintenance tracking', 'Category & status filters'],
      route: '/assets',
    },
    {
      icon: 'bi-tag-fill',          color: '#a855f7', name: 'Expense Claims',    tag: 'Ops',
      desc: 'Employee claim submission and approval workflow.',
      features: ['Receipt upload', 'Approve or reject', 'Claim history'],
      route: '/expense-claims',
    },
    {
      icon: 'bi-megaphone-fill',    color: '#0ea5e9', name: 'Announcements',     tag: 'Comms',
      desc: 'Broadcast company news to specific teams or the whole organisation.',
      features: ['Priority levels', 'Target by department/role', 'Pin & schedule expiry'],
      route: '/announcements',
    },
    {
      icon: 'bi-bell-fill',         color: '#64748b', name: 'Notifications',     tag: 'Comms',
      desc: 'In-app notification centre for leave, approvals and system alerts.',
      features: ['Filter by type', 'Bulk mark as read', 'Real-time unread badge'],
      route: '/notifications',
    },
    {
      icon: 'bi-building-gear',     color: '#475569', name: 'Company Settings',  tag: 'Platform',
      desc: 'Brand your ORION workspace with your logo and colours.',
      features: ['Upload logo', 'Set brand colour', 'Live preview'],
      route: '/settings/company',
    },
  ];
}
