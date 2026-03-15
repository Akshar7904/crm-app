// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PayrollRoutingModule } from './payroll-routing.module';

// Components
import { PayrollListComponent } from './payroll-list/payroll-list.component';
import { PayrollDetailComponent } from './payroll-detail/payroll-detail.component';
import { CreatePayrollComponent } from './create-payroll/create-payroll.component';
import { ProcessPayrollComponent } from './process-payroll/process-payroll.component';
import { EmployeeSalaryComponent } from './employee-salary/employee-salary.component';
import { PayslipsComponent } from './payslips/payslips.component';
import { MyPayslipsComponent } from './my-payslips/my-payslips.component';
import { PayrollStatsComponent } from './payroll-stats/payroll-stats.component';

@NgModule({
  declarations: [
    PayrollListComponent,
    PayrollDetailComponent,
    CreatePayrollComponent,
    ProcessPayrollComponent,
    EmployeeSalaryComponent,
    PayslipsComponent,
    MyPayslipsComponent,
    PayrollStatsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PayrollRoutingModule,
  ]
})
export class PayrollModule { }
