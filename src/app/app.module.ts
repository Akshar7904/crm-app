// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { LoadingOverlayComponent } from './component/shared/loading-overlay/loading-overlay.component';
import { BrandingService } from './service/branding.service';
import { UserService } from './service/user.service';

// Core & Shared
import { CoreModule } from './core/core.module';
import { NotificationModule } from './notification.module';

// Auth Module (always loaded)
import { AuthModule } from './component/auth/auth.module';

// Feature Modules (some lazy-loaded, some not)
import { HomeModule } from './component/home/home.module';
import { NavBarModule } from './component/navbar/navbar.module';
// REMOVE EmployeeModule from here - it's lazy loaded

// Components declared here (not in lazy-loaded modules)
import { AppComponent } from './app.component';
import { AttendanceListComponent } from './component/attendance/attendance-list/attendance-list.component';
import { EditAttendanceModalComponent } from './component/attendance/edit-attendance-modal/edit-attendance-modal.component';
import { MyAttendanceComponent } from './component/attendance/my-attendance/my-attendance.component';
import { WhatsAppAttendanceComponent } from './component/attendance/whatsapp-attendance/whatsapp-attendance.component';
import { EmployeeLeaveComponent } from "./component/leave/employee-leave/employee-leave.component";
import { AdminLeaveComponent } from "./component/leave/admin-leave/admin-leave.component";

// Documentation
import { CompanyPolicyComponent } from './component/policy/company-policy.component';
import { DocumentationComponent } from './component/documentation/documentation.component';

// Services
import { DashboardService } from "./service/dashboard.service";

// IMPORTANT: AppRoutingModule must be imported LAST
// to ensure proper route precedence
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    LoadingOverlayComponent,
    DocumentationComponent,
    CompanyPolicyComponent,
    AttendanceListComponent,
    EditAttendanceModalComponent,
    MyAttendanceComponent,
    WhatsAppAttendanceComponent,
    EmployeeLeaveComponent,
    AdminLeaveComponent,
  ],
  imports: [
    // Angular Core
    BrowserModule,
    CommonModule,
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

    // MUST BE LAST - App Routing
    AppRoutingModule
  ],
  providers: [
    DashboardService,
    {
      provide: APP_INITIALIZER,
      useFactory: (branding: BrandingService, userService: UserService) => () => {
        // Only load company branding if the user is already authenticated (token exists).
        // On first visit / after logout this is a no-op — branding loads after login via the sidebar.
        if (userService.isAuthenticated()) {
          return branding.load().toPromise();
        }
        return Promise.resolve();
      },
      deps: [BrandingService, UserService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
