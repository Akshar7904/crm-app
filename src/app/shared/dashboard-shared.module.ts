// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatsCardsComponent } from './stats-cards.component';
import { DashboardChartComponent } from './dashboard-chart.component';
import { DashboardCalendarComponent } from './dashboard-calendar.component';

/**
 * Shared Dashboard Module
 * Contains reusable dashboard components for both admin and employee views
 */
@NgModule({
  declarations: [
    StatsCardsComponent,
    DashboardChartComponent,
    DashboardCalendarComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    StatsCardsComponent,
    DashboardChartComponent,
    DashboardCalendarComponent
  ]
})
export class DashboardSharedModule { }
