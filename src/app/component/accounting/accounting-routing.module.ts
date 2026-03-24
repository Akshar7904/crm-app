// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './products/product-list.component';
import { BillListComponent } from './bills/bill-list.component';
import { QuoteListComponent } from './quotes/quote-list.component';
import { QuoteDetailComponent } from './quotes/quote-detail/quote-detail.component';
import { CreditNoteListComponent } from './credit-notes/credit-note-list.component';
import { VatReturnsComponent } from './vat-returns/vat-returns.component';
import { AccountingOverviewComponent } from './overview/accounting-overview.component';
import { AccountingReportsComponent } from './reports/accounting-reports.component';

const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview', component: AccountingOverviewComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'bills', component: BillListComponent },
  { path: 'quotes', component: QuoteListComponent },
  { path: 'quotes/:id', component: QuoteDetailComponent },
  { path: 'credit-notes', component: CreditNoteListComponent },
  { path: 'vat-returns', component: VatReturnsComponent },
  { path: 'reports', component: AccountingReportsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountingRoutingModule {}
