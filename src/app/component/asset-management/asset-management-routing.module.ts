// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlSegment } from '@angular/router';
import { AuthenticationGuard } from '../../guard/authentication.guard';

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

/**
 * Numeric ID matcher
 */
export function numericIdMatcher(segments: UrlSegment[]) {
  if (segments.length === 1 && /^[0-9]+$/.test(segments[0].path)) {
    return {
      consumed: segments,
      posParams: {
        id: segments[0]
      }
    };
  }
  return null;
}

const routes: Routes = [
  // Admin routes
  {
    path: '',
    component: AssetListComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Assets' }
  },
  {
    path: 'new',
    component: AssetFormComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Add Asset' }
  },
  {
    path: 'edit/:id',
    component: AssetFormComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Edit Asset' }
  },
  {
    path: 'requests',
    component: AssetRequestsComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Asset Requests' }
  },
  {
    path: 'assignments',
    component: AssetAssignmentsComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Asset Assignments' }
  },
  {
    path: 'assign/:assetId',
    component: AssignAssetComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Assign Asset' }
  },
  // Employee routes
  {
    path: 'my-assets',
    component: MyAssetsComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'My Assets' }
  },
  {
    path: 'request',
    component: RequestAssetComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Request Asset' }
  },
  {
    path: 'my-requests',
    component: MyRequestsComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'My Requests' }
  },
  // Detail route (must be last due to matcher)
  {
    matcher: numericIdMatcher,
    component: AssetDetailComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Asset Details' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssetManagementRoutingModule {}
