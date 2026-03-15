// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyInternAttendanceComponent } from './my-attendance/my-attendance.component';
import { AdminInternAttendanceComponent } from './admin-attendance/admin-attendance.component';

const routes: Routes = [
  { path: '', redirectTo: 'my', pathMatch: 'full' },
  { path: 'my', component: MyInternAttendanceComponent },
  { path: 'admin', component: AdminInternAttendanceComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InternAttendanceRoutingModule {}
