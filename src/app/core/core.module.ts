// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CacheInterceptor } from '../interceptor/cache.interceptor';
import { TokenInterceptor } from '../interceptor/token.interceptor';
import { UserService } from '../service/user.service';
import { CustomerService } from '../service/customer.service';
import { HttpCacheService } from '../service/http.cache.service';
import { NotificationService } from '../service/notification.service';
import { ModuleAccessService } from '../service/module-access.service';
import { VendorService } from '../component/expenses/services/vendor.service';
import { ChartOfAccountService } from '../component/expenses/services/chart-of-account.service';
import { ExpensesService } from '../component/expenses/services/expenses.service';
import { AttendanceService } from '../service/attendance.service';
import { LeaveService } from '../service/leave.service';
import { BrandingService } from '../service/branding.service';
import { ThemeService } from '../service/theme.service';
import { CompanyService } from '../service/company.service';
import { NotificationApiService } from '../service/notification-api.service';
import { ExpenseClaimService } from '../service/expense-claim.service';
import { HolidayService } from '../service/holiday.service';
import { AnnouncementService } from '../service/announcement.service';
import { InternAttendanceService } from '../service/intern-attendance.service';
import { EmployeeService } from '../service/employee.service';
import { DepartmentService } from '../service/department.service';

@NgModule({
    imports: [ HttpClientModule ],
    providers: [
        UserService, CustomerService, HttpCacheService, NotificationService, ModuleAccessService,
        VendorService, ChartOfAccountService, ExpensesService, ExpenseClaimService, HolidayService,
        AnnouncementService, InternAttendanceService, EmployeeService, DepartmentService,
        AttendanceService, LeaveService, BrandingService, ThemeService,
        CompanyService, NotificationApiService,
        { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true }
    ]
})
export class CoreModule {}
