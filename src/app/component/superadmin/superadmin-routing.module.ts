// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuperadminDashboardComponent } from './dashboard/superadmin-dashboard.component';
import { SuperadminCompaniesComponent } from './companies/superadmin-companies.component';
import { SuperadminUsersComponent } from './users/superadmin-users.component';
import { SuperadminLogsComponent } from './logs/superadmin-logs.component';
import { SuperadminHealthComponent } from './health/superadmin-health.component';
import { SuperadminReportsComponent } from './reports/superadmin-reports.component';
import { SuperadminAnalyticsComponent } from './analytics/superadmin-analytics.component';
import { SuperadminAnnouncementsComponent } from './announcements/superadmin-announcements.component';
import { SuperadminGuard } from '../../guard/superadmin.guard';

const routes: Routes = [
  {
    path: '',
    canActivateChild: [SuperadminGuard],
    children: [
      { path: '',           redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',  component: SuperadminDashboardComponent },
      { path: 'companies',  component: SuperadminCompaniesComponent },
      { path: 'users',      component: SuperadminUsersComponent },
      { path: 'reports',    component: SuperadminReportsComponent },
      { path: 'analytics',  component: SuperadminAnalyticsComponent },
      { path: 'logs',          component: SuperadminLogsComponent },
      { path: 'health',        component: SuperadminHealthComponent },
      { path: 'announcements', component: SuperadminAnnouncementsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperadminRoutingModule {}
