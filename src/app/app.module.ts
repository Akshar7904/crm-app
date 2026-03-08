import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// Core & Shared
import { CoreModule } from './core/core.module';
import { NotificationModule } from './notification.module';

// Auth Module (always loaded)
import { AuthModule } from './component/auth/auth.module';

// Feature Modules (some lazy-loaded, some not)
import { HomeModule } from './component/home/home.module';
import { NavBarModule } from './component/navbar/navbar.module';
import { CustomerModule } from './component/customer/customer.module';
import { InvoiceModule } from './component/invoice/invoice.module';
// REMOVE EmployeeModule from here - it's lazy loaded

// Components declared here (not in lazy-loaded modules)
import { AppComponent } from './app.component';
import { AttendanceListComponent } from './component/attendance/attendance-list/attendance-list.component';
import { EditAttendanceModalComponent } from './component/attendance/edit-attendance-modal/edit-attendance-modal.component';
import { MyAttendanceComponent } from './component/attendance/my-attendance/my-attendance.component';
import { EmployeeLeaveComponent } from "./component/leave/employee-leave/employee-leave.component";
import { AdminLeaveComponent } from "./component/leave/admin-leave/admin-leave.component";

// Services
import { DashboardService } from "./service/dashboard.service";

// IMPORTANT: AppRoutingModule must be imported LAST
// to ensure proper route precedence
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    AttendanceListComponent,
    EditAttendanceModalComponent,
    MyAttendanceComponent,
    EmployeeLeaveComponent,
    AdminLeaveComponent,
  ],
  imports: [
    // Angular Core
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,

    // App Core
    CoreModule,
    NotificationModule,

    // Auth (always loaded)
    AuthModule,

    // Feature Modules
    NavBarModule,
    HomeModule,
    CustomerModule,
    InvoiceModule,

    // MUST BE LAST - App Routing
    AppRoutingModule
  ],
  providers: [
    DashboardService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
