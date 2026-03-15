// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { CustomersComponent } from './customers/customers.component';
import { NewcustomerComponent } from './newcustomer/newcustomer.component';
import { CustomerRoutingModule } from './customer-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';
import { NavBarModule } from '../navbar/navbar.module';

@NgModule({
  declarations: [
    CustomersComponent,
    NewcustomerComponent,
    CustomerDetailComponent
  ],
  imports: [
    SharedModule,
    CustomerRoutingModule,
    NavBarModule,
  ]
})
export class CustomerModule {}
