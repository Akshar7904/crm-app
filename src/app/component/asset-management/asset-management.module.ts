// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { NavBarModule } from '../navbar/navbar.module';
import { AssetManagementRoutingModule } from './asset-management-routing.module';
import { AssetService } from '../../service/asset.service';

// Admin Components
import { AssetListComponent } from './asset-list/asset-list.component';
import { AssetFormComponent } from './asset-form/asset-form.component';
import { AssetDetailComponent } from './asset-detail/asset-detail.component';
import { AssetRequestsComponent } from './asset-requests/asset-requests.component';
import { AssignAssetComponent } from './assign-asset/assign-asset.component';
import { AssetAssignmentsComponent } from './asset-assignments/asset-assignments.component';

// Employee Components
import { MyAssetsComponent } from './my-assets/my-assets.component';
import { RequestAssetComponent } from './request-asset/request-asset.component';
import { MyRequestsComponent } from './my-requests/my-requests.component';

@NgModule({
  declarations: [
    // Admin
    AssetListComponent,
    AssetFormComponent,
    AssetDetailComponent,
    AssetRequestsComponent,
    AssignAssetComponent,
    AssetAssignmentsComponent,
    // Employee
    MyAssetsComponent,
    RequestAssetComponent,
    MyRequestsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NavBarModule,
    AssetManagementRoutingModule,
  ],
  providers: [AssetService]
})
export class AssetManagementModule {}
