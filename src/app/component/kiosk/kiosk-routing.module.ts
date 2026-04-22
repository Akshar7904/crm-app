import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KioskComponent } from './kiosk.component';

const routes: Routes = [
  { path: ':companyId',              component: KioskComponent, data: { mode: 'clock'  } },
  { path: ':companyId/activebreaks', component: KioskComponent, data: { mode: 'breaks' } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KioskRoutingModule {}
