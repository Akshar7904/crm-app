// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './component/home/home/home.component';
import { DocumentationComponent } from './component/documentation/documentation.component';
import { AuthenticationGuard } from './guard/authentication.guard';
import { AttendanceListComponent } from "./component/attendance/attendance-list/attendance-list.component";
import { MyAttendanceComponent } from "./component/attendance/my-attendance/my-attendance.component";
import { WhatsAppAttendanceComponent } from "./component/attendance/whatsapp-attendance/whatsapp-attendance.component";
import { AdminLeaveComponent } from "./component/leave/admin-leave/admin-leave.component";
import { EmployeeLeaveComponent } from "./component/leave/employee-leave/employee-leave.component";

/**
 * Application Routes - UPDATED
 */

const routes: Routes = [
  // =============================================
  // HOME / DASHBOARD - MUST BE FIRST!
  // =============================================
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthenticationGuard],
    pathMatch: 'full',
    data: { title: 'Dashboard' }
  },

  // =============================================
  // EMPLOYEE SELF-SERVICE ROUTES
  // =============================================
  {
    path: 'employee/my-details',
    loadChildren: () => import('./component/employee/employee.module').then(module => module.EmployeeModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'My Details' }
  },

  // =============================================
  // PROFILE
  // =============================================
  {
    path: 'profile',
    loadChildren: () => import('./component/profile/user.module').then(module => module.UserModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'My Profile' }
  },

  // =============================================
  // ORGANIZATION
  // =============================================
  {
    path: 'departments',
    loadChildren: () => import('./component/department/department.module').then(m => m.DepartmentModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Departments' }
  },
  {
    path: 'designations',
    loadChildren: () => import('./component/designation/designation.module').then(m => m.DesignationModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Designations' }
  },

  // =============================================
  // INTERN ATTENDANCE
  // Must be before 'employee' lazy module to avoid prefix-match collision
  // =============================================
  {
    path: 'intern/attendance',
    loadChildren: () => import('./component/intern-attendance/intern-attendance.module').then(m => m.InternAttendanceModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'My School Attendance' }
  },
  {
    path: 'admin/intern-attendance',
    loadChildren: () => import('./component/intern-attendance/intern-attendance.module').then(m => m.InternAttendanceModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Intern Attendance Management' }
  },

  // =============================================
  // LEAVE MANAGEMENT
  // NOTE: Must be before the 'employee' lazy module — Angular prefix-matches
  // 'employee' first and would swallow 'employee/leave' if placed after it.
  // =============================================
  {
    path: 'employee/leave',
    component: EmployeeLeaveComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'My Leave Requests' }
  },
  {
    path: 'admin/leave',
    component: AdminLeaveComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Leave Management' }
  },

  // =============================================
  // EMPLOYEES
  // =============================================
  {
    path: 'employee',
    loadChildren: () => import('./component/employee/employee.module').then(module => module.EmployeeModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Employees' }
  },

  // =============================================
  // ATTENDANCE (includes Holidays)
  // =============================================
  {
    path: 'attendance',
    component: AttendanceListComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Attendance (Admin)' }
  },
  {
    path: 'attendance/my',
    component: MyAttendanceComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'My Attendance' }
  },
  {
    path: 'attendance/whatsapp',
    component: WhatsAppAttendanceComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'WhatsApp Attendance' }
  },
  {
    path: 'holidays',
    loadChildren: () => import('./component/holiday/holiday.module').then(m => m.HolidayModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Holidays' }
  },

  // =============================================
  // PAYROLL
  // =============================================
  {
    path: 'payroll',
    loadChildren: () => import('./component/payroll/payroll.module').then(m => m.PayrollModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Payroll' }
  },

  // =============================================
  // CLIENTS
  // =============================================
  {
    path: 'customers',
    loadChildren: () => import('./component/customer/customer.module').then(m => m.CustomerModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Clients' }
  },

  // =============================================
  // INVOICES
  // =============================================
  {
    path: 'invoices',
    loadChildren: () => import('./component/invoice/invoice.module').then(m => m.InvoiceModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Invoices' }
  },

  // =============================================
  // EXPENSE CLAIMS
  // =============================================
  {
    path: 'expense-claims',
    loadChildren: () => import('./component/expense-claims/expense-claims.module').then(m => m.ExpenseClaimsModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Expense Claims' }
  },

  // =============================================
  // EXPENSES MODULE (QuickBooks-style)
  // =============================================
  {
    path: 'expenses',
    loadChildren: () => import('./component/expenses/expenses.module').then(m => m.ExpensesModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Expenses' }
  },

  // =============================================
  // ACCOUNTING MODULE (Products, Bills, Quotes, Credit Notes, VAT)
  // =============================================
  {
    path: 'accounting',
    loadChildren: () => import('./component/accounting/accounting.module').then(m => m.AccountingModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Accounting' }
  },

  // =============================================
  // ASSET MANAGEMENT
  // =============================================
  {
    path: 'assets',
    loadChildren: () => import('./component/asset-management/asset-management.module').then(m => m.AssetManagementModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Asset Management' }
  },

  // =============================================
  // ANNOUNCEMENTS
  // =============================================
  {
    path: 'announcements',
    loadChildren: () => import('./component/announcement/announcement.module').then(m => m.AnnouncementModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Announcements' }
  },

  // =============================================
  // NOTIFICATIONS
  // =============================================
  {
    path: 'notifications',
    loadChildren: () => import('./component/notification/notification.module').then(m => m.UserNotificationModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Notifications' }
  },

  // =============================================
  // DOCUMENTATION
  // =============================================
  {
    path: 'documentation',
    component: DocumentationComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Documentation' }
  },

  // =============================================
  // FALLBACK - MUST BE LAST!
  // =============================================
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
