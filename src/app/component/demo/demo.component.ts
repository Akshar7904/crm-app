// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-landing',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent {
  activeWhyTab = 0;

  setWhyTab(index: number): void {
    this.activeWhyTab = index;
  }

  readonly whyTabs = [
    {
      label: '🇿🇦 Built for South Africa',
      icon: 'bi-shield-check',
      title: 'Built for South Africa',
      desc: 'ORION is designed from the ground up for the South African context — no configuration needed to get started with local compliance.',
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
      desc: 'ORION is deployed on enterprise-grade cloud infrastructure — accessible from any device, always up to date, with no installation required.',
      features: [
        'Hosted on Vercel (frontend) + Render (API)',
        'PostgreSQL database on Supabase',
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
}
