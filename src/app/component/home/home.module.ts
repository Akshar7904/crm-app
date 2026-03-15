// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { HomeComponent } from './home/home.component';
import { NavBarModule } from '../navbar/navbar.module';
import { StatsModule } from '../stats/stats.module';
import { DashboardSharedModule } from "../../shared/dashboard-shared.module";

/**
 * Home Module
 *
 * NOTE: This module does NOT have its own routing.
 * The HomeComponent is routed directly from app-routing.module.ts
 * to avoid routing conflicts.
 */
@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    SharedModule,
    NavBarModule,
    StatsModule,
    DashboardSharedModule,
  ],
  exports: [
    HomeComponent  // Export so it can be used in app-routing
  ]
})
export class HomeModule {}
