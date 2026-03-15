// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { StatsComponent } from './stats.component';

@NgModule({
  declarations: [ StatsComponent ],
  imports: [ SharedModule ],
  exports: [ StatsComponent ]
})
export class StatsModule {}
