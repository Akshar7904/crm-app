// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { TopnavComponent } from './topnav.component';
import { NavBarModule } from '../navbar/navbar.module';

@NgModule({
  declarations: [
    TopnavComponent
  ],
  imports: [
    SharedModule,
    NavBarModule // for app-notification-dropdown
  ],
  exports: [
    TopnavComponent
  ]
})
export class TopnavModule {}
