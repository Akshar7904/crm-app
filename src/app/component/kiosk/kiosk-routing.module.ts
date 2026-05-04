import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KioskComponent } from './kiosk.component';

const routes: Routes = [
  { path: ':companyId', component: KioskComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KioskRoutingModule {}
