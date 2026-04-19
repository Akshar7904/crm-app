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
import { CreditNoteListComponent } from './credit-notes/credit-note-list.component';
import { CreditNoteService } from './services/credit-note.service';
import { VatReturnsComponent } from './vat-returns/vat-returns.component';
import { VatReturnService } from './services/vat-return.service';
import { AccountingOverviewComponent } from './overview/accounting-overview.component';
import { AccountingReportsComponent } from './reports/accounting-reports.component';
import { BankingComponent } from './banking/banking.component';
import { BankingService } from './services/banking.service';
import { InventoryComponent } from './inventory/inventory.component';
import { InventoryService } from './services/inventory.service';

@NgModule({
  declarations: [
    ProductListComponent,
    BillListComponent,
    QuoteListComponent,
    QuoteDetailComponent,
    CreditNoteListComponent,
    VatReturnsComponent,
    AccountingOverviewComponent,
    AccountingReportsComponent,
    BankingComponent,
    InventoryComponent
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
    CreditNoteService,
    BankingService,
    VatReturnService,
    InventoryService
  ]
})
export class AccountingModule {}
