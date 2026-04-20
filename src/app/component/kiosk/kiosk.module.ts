import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KioskRoutingModule } from './kiosk-routing.module';
import { KioskComponent } from './kiosk.component';

@NgModule({
  declarations: [KioskComponent],
  imports: [CommonModule, KioskRoutingModule]
})
export class KioskModule {}
