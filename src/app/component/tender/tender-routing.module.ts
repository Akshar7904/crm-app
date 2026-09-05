// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../../guard/authentication.guard';
import { TenderDashboardComponent } from './tender-dashboard/tender-dashboard.component';
import { TenderDetailComponent } from './tender-detail/tender-detail.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthenticationGuard],
    children: [
      { path: '', component: TenderDashboardComponent },
      { path: ':id', component: TenderDetailComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TenderRoutingModule {}
