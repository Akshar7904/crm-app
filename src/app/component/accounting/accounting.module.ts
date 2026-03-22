// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AccountingRoutingModule } from './accounting-routing.module';
import { ProductListComponent } from './products/product-list.component';
import { ProductCatalogService } from './services/product-catalog.service';
import { BillListComponent } from './bills/bill-list.component';
import { BillService } from './services/bill.service';
import { QuoteListComponent } from './quotes/quote-list.component';
import { QuoteService } from './services/quote.service';
import { CustomerService } from '../../service/customer.service';

@NgModule({
  declarations: [
    ProductListComponent,
    BillListComponent,
    QuoteListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AccountingRoutingModule
  ],
  providers: [
    ProductCatalogService,
    BillService,
    QuoteService,
    CustomerService
  ]
})
export class AccountingModule {}
