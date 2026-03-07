import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EmployeesComponent } from './employees/employees.component';
import { NewemployeeComponent } from './newemployee/newemployee.component';
import { EmployeeDetailComponent } from './employee-detail/employee-detail.component';
import { EmployeeRoutingModule } from './employee-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavBarModule } from '../navbar/navbar.module';
import { EmployeeService } from '../../service/employee.service';

@NgModule({
  declarations: [
    EmployeesComponent,
    NewemployeeComponent,
    EmployeeDetailComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    NavBarModule,
    ReactiveFormsModule,
    SharedModule,
    EmployeeRoutingModule
  ],
  providers: [EmployeeService]
})
export class EmployeeModule { }
