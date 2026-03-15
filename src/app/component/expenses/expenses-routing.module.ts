// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpensesOverviewComponent } from './overview/expenses-overview.component';
import { BusinessExpenseEntryComponent } from './entry/business-expense-entry.component';
import { BusinessExpenseListComponent } from './entry/business-expense-list.component';
import { ExpensesClaimsComponent } from './claims/expenses-claims.component';
import { ExpensesReportsComponent } from './reports/expenses-reports.component';
import { ChartOfAccountsComponent } from './accounts/chart-of-accounts.component';
import { VendorsComponent } from './vendors/vendors.component';
import { OpeningBalanceComponent } from './financial-setup/opening-balance.component';
import { AnnualBudgetComponent } from './financial-setup/annual-budget.component';
import { BudgetVsActualComponent } from './financial-setup/budget-vs-actual.component';

const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview',         component: ExpensesOverviewComponent },
  { path: 'entry',            component: BusinessExpenseEntryComponent },
  { path: 'entry/list',       component: BusinessExpenseListComponent },
  { path: 'claims',           component: ExpensesClaimsComponent },
  { path: 'reports',          component: ExpensesReportsComponent },
  { path: 'accounts',         component: ChartOfAccountsComponent },
  { path: 'vendors',          component: VendorsComponent },
  { path: 'opening-balance',  component: OpeningBalanceComponent },
  { path: 'budget',           component: AnnualBudgetComponent },
  { path: 'budget-vs-actual', component: BudgetVsActualComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExpensesRoutingModule {}
