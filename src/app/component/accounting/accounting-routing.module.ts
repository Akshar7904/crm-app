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
import { BankingComponent } from './banking/banking.component';
import { InventoryComponent } from './inventory/inventory.component';
import { ModuleAccessGuard } from '../../guard/module-access.guard';

const BUSINESS = 'BUSINESS_EXPENSES';
const INVOICE  = 'INVOICE_CUSTOMER';

const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview',     component: AccountingOverviewComponent, canActivate: [ModuleAccessGuard], data: { moduleKey: BUSINESS } },
  { path: 'products',     component: ProductListComponent,        canActivate: [ModuleAccessGuard], data: { moduleKey: BUSINESS } },
  { path: 'bills',        component: BillListComponent,           canActivate: [ModuleAccessGuard], data: { moduleKey: BUSINESS } },
  { path: 'quotes',       component: QuoteListComponent,          canActivate: [ModuleAccessGuard], data: { moduleKey: INVOICE  } },
  { path: 'quotes/:id',   component: QuoteDetailComponent,        canActivate: [ModuleAccessGuard], data: { moduleKey: INVOICE  } },
  { path: 'credit-notes', component: CreditNoteListComponent,     canActivate: [ModuleAccessGuard], data: { moduleKey: INVOICE  } },
  { path: 'vat-returns',  component: VatReturnsComponent,         canActivate: [ModuleAccessGuard], data: { moduleKey: BUSINESS } },
  { path: 'banking',      component: BankingComponent,            canActivate: [ModuleAccessGuard], data: { moduleKey: BUSINESS } },
  { path: 'inventory',    component: InventoryComponent,         canActivate: [ModuleAccessGuard], data: { moduleKey: BUSINESS } },
  { path: 'reports',     component: AccountingReportsComponent,  canActivate: [ModuleAccessGuard], data: { moduleKey: BUSINESS } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountingRoutingModule {}
