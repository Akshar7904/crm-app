// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AnnouncementListComponent } from './announcement-list/announcement-list.component';
import { AnnouncementAdminComponent } from './announcement-admin/announcement-admin.component';
const routes: Routes = [
  { path: '', component: AnnouncementListComponent },
  { path: 'admin', component: AnnouncementAdminComponent }
];

@NgModule({
  declarations: [
    AnnouncementListComponent,
    AnnouncementAdminComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    AnnouncementListComponent,
    AnnouncementAdminComponent
  ],
  providers: []
})
export class AnnouncementModule { }
