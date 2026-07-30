// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SuperadminRoutingModule } from './superadmin-routing.module';
import { SuperadminDashboardComponent } from './dashboard/superadmin-dashboard.component';
import { SuperadminCompaniesComponent } from './companies/superadmin-companies.component';
import { SuperadminUsersComponent } from './users/superadmin-users.component';
import { SuperadminLogsComponent } from './logs/superadmin-logs.component';
import { SuperadminHealthComponent } from './health/superadmin-health.component';
import { SuperadminReportsComponent } from './reports/superadmin-reports.component';
import { SuperadminAnalyticsComponent } from './analytics/superadmin-analytics.component';
import { SuperadminAnnouncementsComponent } from './announcements/superadmin-announcements.component';
import { SuperadminService } from './superadmin.service';
import { ModuleFilterPipe } from '../../pipes/module-filter.pipe';

@NgModule({
  declarations: [
    SuperadminDashboardComponent,
    SuperadminCompaniesComponent,
    SuperadminUsersComponent,
    SuperadminLogsComponent,
    SuperadminHealthComponent,
    SuperadminReportsComponent,
    SuperadminAnalyticsComponent,
    SuperadminAnnouncementsComponent,
    ModuleFilterPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SuperadminRoutingModule
  ],
  providers: [SuperadminService]
})
export class SuperadminModule {}
