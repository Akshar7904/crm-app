// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

// expense-claims.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeExpenseClaimsComponent } from './employee/employee-expense-claims.component';
import { AdminExpenseClaimsComponent } from './admin/admin-expense-claims.component';
const routes: Routes = [
  {
    path: 'my-claims',
    component: EmployeeExpenseClaimsComponent
  },
  {
    path: 'new',
    component: EmployeeExpenseClaimsComponent  // Same component, will open modal
  },
  {
    path: 'employee',
    component: EmployeeExpenseClaimsComponent
  },
  {
    path: 'admin',
    component: AdminExpenseClaimsComponent
  },
  {
    path: '',
    component: AdminExpenseClaimsComponent  // Default to admin for admins
  }
];

@NgModule({
  declarations: [
    EmployeeExpenseClaimsComponent,
    AdminExpenseClaimsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
  providers: []
})
export class ExpenseClaimsModule { }
