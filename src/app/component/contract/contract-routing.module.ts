// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from '../../guard/authentication.guard';
import { ContractListComponent } from './contract-list/contract-list.component';
import { ContractDetailComponent } from './contract-detail/contract-detail.component';
import { NewContractComponent } from './new-contract/new-contract.component';
import { ContractApprovalComponent } from './contract-approval/contract-approval.component';
import { ContractAlertsComponent } from './contract-alerts/contract-alerts.component';
import { ContractTemplatesComponent } from './contract-templates/contract-templates.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthenticationGuard],
    children: [
      { path: '', component: ContractListComponent },
      { path: 'new', component: NewContractComponent },
      { path: 'approvals', component: ContractApprovalComponent },
      { path: 'alerts', component: ContractAlertsComponent },
      { path: 'templates', component: ContractTemplatesComponent },
      { path: ':id', component: ContractDetailComponent },
      { path: ':id/edit', component: NewContractComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContractRoutingModule {}
