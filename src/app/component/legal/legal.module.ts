// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LegalComponent } from './legal.component';

const routes: Routes = [
  { path: '',             component: LegalComponent, data: { section: 'terms'      } },
  { path: ':section',     component: LegalComponent                                   },
];

@NgModule({
  declarations: [LegalComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ]
})
export class LegalModule {}
