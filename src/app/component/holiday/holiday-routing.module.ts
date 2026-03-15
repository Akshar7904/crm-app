// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HolidaysComponent } from './holidays/holidays.component';
import { NewHolidayComponent } from './new-holiday/new-holiday.component';
import { HolidayDetailComponent } from './holiday-detail/holiday-detail.component';

const routes: Routes = [
  { path: '', component: HolidaysComponent },
  { path: 'new', component: NewHolidayComponent },
  { path: ':id', component: HolidayDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HolidayRoutingModule { }
