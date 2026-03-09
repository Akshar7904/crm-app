import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InternAttendanceRoutingModule } from './intern-attendance-routing.module';
import { MyInternAttendanceComponent } from './my-attendance/my-attendance.component';
import { AdminInternAttendanceComponent } from './admin-attendance/admin-attendance.component';

@NgModule({
  declarations: [
    MyInternAttendanceComponent,
    AdminInternAttendanceComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    InternAttendanceRoutingModule
  ]
})
export class InternAttendanceModule {}
