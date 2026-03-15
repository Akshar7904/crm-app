// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DesignationRoutingModule } from './designation-routing.module';
import { DesignationsComponent } from './designation.component';
import { DesignationService } from '../../service/designation.service';

@NgModule({
  declarations: [
    DesignationsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbModule,
    DesignationRoutingModule,
  ],
  providers: [
    DesignationService
  ]
})
export class DesignationModule { }
