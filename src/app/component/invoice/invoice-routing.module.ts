// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from 'src/app/guard/authentication.guard';
import { InvoicesComponent } from './invoices/invoices.component';
import { NewinvoiceComponent } from './newinvoice/newinvoice.component';
import { InvoiceDetailComponent } from './invoice-detail/invoice-detail.component';

const invoiceRoutes: Routes = [
    { path: '', component: InvoicesComponent, canActivate: [AuthenticationGuard] },
    { path: 'new', component: NewinvoiceComponent, canActivate: [AuthenticationGuard] },
    { path: ':id/:invoiceNumber', component: InvoiceDetailComponent, canActivate: [AuthenticationGuard] }
];

@NgModule({
    imports: [RouterModule.forChild(invoiceRoutes)],
    exports: [RouterModule]
})
export class InvoiceRoutingModule { }