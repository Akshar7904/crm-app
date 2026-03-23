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
import { QuoteDetailComponent } from './quotes/quote-detail/quote-detail.component';
import { QuoteService } from './services/quote.service';
import { CustomerService } from '../../service/customer.service';
import { CreditNoteListComponent } from './credit-notes/credit-note-list.component';
import { VatReturnsComponent } from './vat-returns/vat-returns.component';
import { AccountingOverviewComponent } from './overview/accounting-overview.component';
import { AccountingReportsComponent } from './reports/accounting-reports.component';

@NgModule({
  declarations: [
    ProductListComponent,
    BillListComponent,
    QuoteListComponent,
    QuoteDetailComponent,
    CreditNoteListComponent,
    VatReturnsComponent,
    AccountingOverviewComponent,
    AccountingReportsComponent
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
