import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { HolidayRoutingModule } from './holiday-routing.module';
import { HolidaysComponent } from './holidays/holidays.component';
import { NewHolidayComponent } from './new-holiday/new-holiday.component';
import { HolidayDetailComponent } from './holiday-detail/holiday-detail.component';
import { HolidayService } from '../../service/holiday.service';

@NgModule({
  declarations: [
    HolidaysComponent,
    NewHolidayComponent,
    HolidayDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    HolidayRoutingModule
  ],
  providers: [HolidayService]
})
export class HolidayModule { }
