// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenderRoutingModule } from './tender-routing.module';
import { TenderService } from './services/tender.service';
import { TenderDashboardComponent } from './tender-dashboard/tender-dashboard.component';
import { TenderDetailComponent } from './tender-detail/tender-detail.component';

@NgModule({
  declarations: [
    TenderDashboardComponent,
    TenderDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TenderRoutingModule
  ],
  providers: [TenderService]
})
export class TenderModule {}
