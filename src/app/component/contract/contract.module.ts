// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContractRoutingModule } from './contract-routing.module';
import { ContractService } from './services/contract.service';
import { ContractListComponent } from './contract-list/contract-list.component';
import { ContractDetailComponent } from './contract-detail/contract-detail.component';
import { NewContractComponent } from './new-contract/new-contract.component';
import { ContractApprovalComponent } from './contract-approval/contract-approval.component';
import { ContractAlertsComponent } from './contract-alerts/contract-alerts.component';

@NgModule({
  declarations: [
    ContractListComponent,
    ContractDetailComponent,
    NewContractComponent,
    ContractApprovalComponent,
    ContractAlertsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ContractRoutingModule
  ],
  providers: [ContractService]
})
export class ContractModule {}
