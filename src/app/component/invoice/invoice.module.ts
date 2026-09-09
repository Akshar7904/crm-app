// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { InvoicesComponent } from './invoices/invoices.component';
import { NewinvoiceComponent } from './newinvoice/newinvoice.component';
import { InvoiceDetailComponent } from './invoice-detail/invoice-detail.component';
import { InvoiceRoutingModule } from './invoice-routing.module';
import { NavBarModule } from '../navbar/navbar.module';
import { BankingService } from '../accounting/services/banking.service';

@NgModule({
  declarations: [
    InvoicesComponent,
    NewinvoiceComponent,
    InvoiceDetailComponent
  ],
  imports: [
    SharedModule,
    InvoiceRoutingModule,
    NavBarModule,
  ],
  // BankingService isn't providedIn: 'root' — it's registered in AccountingModule's own
  // providers, which a separate lazy-loaded module (this one) cannot reach. Without this,
  // InvoiceDetailComponent (which injects it for the Mark Paid bank-account picker) throws
  // NullInjectorError on construction and the whole invoice detail route silently bounces
  // to home — the actual root cause behind "invoice not appearing" once you click into one.
  providers: [BankingService]
})
export class InvoiceModule {}
