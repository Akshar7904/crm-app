// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ExpensesRoutingModule } from './expenses-routing.module';
import { BusinessExpenseService } from './services/business-expense.service';
import { BudgetService } from './services/budget.service';
import { OpeningBalanceService } from './services/opening-balance.service';
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

@NgModule({
  declarations: [
    ExpensesOverviewComponent,
    BusinessExpenseEntryComponent,
    BusinessExpenseListComponent,
    ExpensesClaimsComponent,
    ExpensesReportsComponent,
    ChartOfAccountsComponent,
    VendorsComponent,
    OpeningBalanceComponent,
    AnnualBudgetComponent,
    BudgetVsActualComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ExpensesRoutingModule,
  ],
  providers: [
    BusinessExpenseService,
    BudgetService,
    OpeningBalanceService,
  ]
})
export class ExpensesModule {}
