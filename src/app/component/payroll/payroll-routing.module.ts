// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../../guard/authentication.guard';
import { EmployeeSalaryComponent } from './employee-salary/employee-salary.component';
import { PayslipsComponent } from './payslips/payslips.component';
import { MyPayslipsComponent } from './my-payslips/my-payslips.component';
import { PayrollListComponent } from './payroll-list/payroll-list.component';
import { PayrollDetailComponent } from './payroll-detail/payroll-detail.component';
import { CreatePayrollComponent } from './create-payroll/create-payroll.component';
import { ProcessPayrollComponent } from './process-payroll/process-payroll.component';
import { PayrollStatsComponent } from './payroll-stats/payroll-stats.component';

const routes: Routes = [
  {
    path: '', // Default route for /payroll
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    component: PayrollListComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'All Payrolls', requiredPermission: 'payroll:read' }
  },
  {
    path: 'salaries',
    component: EmployeeSalaryComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Employee Salary', requiredPermission: 'payroll:read' }
  },
  {
    path: 'payslips',
    component: PayslipsComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Payslips', requiredPermission: 'payroll:read' }
  },
  {
    path: 'my-payslips',
    component: MyPayslipsComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'My Payslips' }
  },
  {
    path: 'create',
    component: CreatePayrollComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Create Payroll', requiredPermission: 'payroll:create' }
  },
  {
    path: 'process',
    component: ProcessPayrollComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Process Payroll', requiredPermission: 'payroll:create' }
  },
  {
    path: 'stats',
    component: PayrollStatsComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Payroll Statistics', requiredPermission: 'payroll:read' }
  },
  {
    path: 'detail/:id',
    component: PayrollDetailComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Payroll Details', requiredPermission: 'payroll:read' }
  },
  {
    path: 'edit/:id',
    component: CreatePayrollComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Edit Payroll', requiredPermission: 'payroll:update' }
  },
  {
    path: 'employee/:employeeId',
    component: MyPayslipsComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Employee Payrolls' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PayrollRoutingModule { }
