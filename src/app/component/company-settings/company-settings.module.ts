// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavBarModule } from '../navbar/navbar.module';
import { CompanySettingsComponent } from './company-settings.component';

const routes: Routes = [
  { path: '', component: CompanySettingsComponent }
];

@NgModule({
  declarations: [CompanySettingsComponent],
  imports: [SharedModule, NavBarModule, RouterModule.forChild(routes)]
})
export class CompanySettingsModule {}
