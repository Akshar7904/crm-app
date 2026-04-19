// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from 'src/app/guard/authentication.guard';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';
import { CustomersComponent } from './customers/customers.component';
import { NewcustomerComponent } from './newcustomer/newcustomer.component';

const customerRoutes: Routes = [
    { path: '', component: CustomersComponent, canActivate: [AuthenticationGuard] },
    { path: 'new', component: NewcustomerComponent, canActivate: [AuthenticationGuard] },
    { path: ':id', component: CustomerDetailComponent, canActivate: [AuthenticationGuard] }
  ];

@NgModule({
    imports: [RouterModule.forChild(customerRoutes)],
    exports: [RouterModule]
})
export class CustomerRoutingModule {}