// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlSegment } from '@angular/router';
import { EmployeesComponent } from './employees/employees.component';
import { NewemployeeComponent } from './newemployee/newemployee.component';
import { EmployeeDetailComponent } from './employee-detail/employee-detail.component';
import {AuthenticationGuard} from "../../guard/authentication.guard";

/**
 * Numeric ID matcher
 * Allows ONLY numbers for /employee/:id
 */
export function numericIdMatcher(segments: UrlSegment[]) {
  if (segments.length === 1 && /^[0-9]+$/.test(segments[0].path)) {
    return {
      consumed: segments,
      posParams: {
        id: segments[0]
      }
    };
  }
  return null;
}

const routes: Routes = [
  {
    path: '',                     // /employee
    component: EmployeesComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Employees' }
  },
  {
    path: 'new',                  // /employee/new
    component: NewemployeeComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Add Employee' }
  },
  {
    matcher: numericIdMatcher,    // /employee/:id (NUMBERS ONLY)
    component: EmployeeDetailComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Employee Details' }
  },
  {
    path: 'my-details',
    component: EmployeeDetailComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'My Employment Details' }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeeRoutingModule {}
