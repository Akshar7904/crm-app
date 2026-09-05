// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './component/home/home/home.component';
import { DocumentationComponent } from './component/documentation/documentation.component';
import { CompanyPolicyComponent } from './component/policy/company-policy.component';
import { AuthenticationGuard } from './guard/authentication.guard';
import { ModuleAccessGuard } from './guard/module-access.guard';
import { SuperadminGuard } from './guard/superadmin.guard';
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
  // LANDING PAGE (public — no auth guard)
  // =============================================
  {
    path: '',
    loadChildren: () => import('./component/demo/demo.module').then(m => m.DemoModule),
    pathMatch: 'full',
    data: { title: 'Enterprise360 — Enterprise Management Platform' }
  },

  // =============================================
  // HOME / DASHBOARD
  // =============================================
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Dashboard' }
  },

  // =============================================
  // EMPLOYEE SELF-SERVICE ROUTES
  // =============================================
  {
    path: 'employee/my-details',
    loadChildren: () => import('./component/employee/employee.module').then(module => module.EmployeeModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'My Details', moduleKey: 'EMPLOYEE_MANAGEMENT' }
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
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'My School Attendance', moduleKey: 'INTERN_ATTENDANCE' }
  },
  {
    path: 'admin/intern-attendance',
    loadChildren: () => import('./component/intern-attendance/intern-attendance.module').then(m => m.InternAttendanceModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Intern Attendance Management', moduleKey: 'INTERN_ATTENDANCE' }
  },

  // =============================================
  // LEAVE MANAGEMENT
  // NOTE: Must be before the 'employee' lazy module — Angular prefix-matches
  // 'employee' first and would swallow 'employee/leave' if placed after it.
  // =============================================
  {
    path: 'employee/leave',
    component: EmployeeLeaveComponent,
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'My Leave Requests', moduleKey: 'LEAVE_MANAGEMENT' }
  },
  {
    path: 'admin/leave',
    component: AdminLeaveComponent,
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Leave Management', moduleKey: 'LEAVE_MANAGEMENT' }
  },

  // =============================================
  // EMPLOYEES
  // =============================================
  {
    path: 'employee',
    loadChildren: () => import('./component/employee/employee.module').then(module => module.EmployeeModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Employees', moduleKey: 'EMPLOYEE_MANAGEMENT' }
  },

  // =============================================
  // ATTENDANCE (includes Holidays)
  // =============================================
  {
    path: 'attendance',
    component: AttendanceListComponent,
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Attendance (Admin)', moduleKey: 'ATTENDANCE_TRACKING' }
  },
  {
    path: 'attendance/my',
    component: MyAttendanceComponent,
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'My Attendance', moduleKey: 'ATTENDANCE_TRACKING' }
  },
  {
    path: 'attendance/whatsapp',
    component: WhatsAppAttendanceComponent,
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'WhatsApp Attendance', moduleKey: 'ATTENDANCE_TRACKING' }
  },
  {
    path: 'holidays',
    loadChildren: () => import('./component/holiday/holiday.module').then(m => m.HolidayModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Holidays', moduleKey: 'ATTENDANCE_TRACKING' }
  },

  // =============================================
  // PAYROLL
  // =============================================
  {
    path: 'payroll',
    loadChildren: () => import('./component/payroll/payroll.module').then(m => m.PayrollModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Payroll', moduleKey: 'PAYROLL_PAYSLIPS' }
  },

  // =============================================
  // CLIENTS
  // =============================================
  {
    path: 'customers',
    loadChildren: () => import('./component/customer/customer.module').then(m => m.CustomerModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Clients', moduleKey: 'INVOICE_CUSTOMER' }
  },

  // =============================================
  // INVOICES
  // =============================================
  {
    path: 'invoices',
    loadChildren: () => import('./component/invoice/invoice.module').then(m => m.InvoiceModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Invoices', moduleKey: 'INVOICE_CUSTOMER' }
  },

  // =============================================
  // EXPENSE CLAIMS
  // =============================================
  {
    path: 'expense-claims',
    loadChildren: () => import('./component/expense-claims/expense-claims.module').then(m => m.ExpenseClaimsModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Expense Claims', moduleKey: 'EXPENSE_CLAIMS' }
  },

  // =============================================
  // EXPENSES MODULE (QuickBooks-style)
  // =============================================
  {
    path: 'expenses',
    loadChildren: () => import('./component/expenses/expenses.module').then(m => m.ExpensesModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Expenses', moduleKey: 'BUSINESS_EXPENSES' }
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
  // CONTRACT MANAGEMENT
  // =============================================
  {
    path: 'contracts',
    loadChildren: () => import('./component/contract/contract.module').then(m => m.ContractModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Contract Management', moduleKey: 'CONTRACT_MANAGEMENT' }
  },

  // =============================================
  // PROJECT MANAGEMENT
  // =============================================
  {
    path: 'projects',
    loadChildren: () => import('./component/project/project.module').then(m => m.ProjectModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Project Management', moduleKey: 'PROJECT_MANAGEMENT' }
  },

  // =============================================
  // TENDER MANAGEMENT
  // =============================================
  {
    path: 'tenders',
    loadChildren: () => import('./component/tender/tender.module').then(m => m.TenderModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Tender Management', moduleKey: 'TENDER_MANAGEMENT' }
  },

  // =============================================
  // ASSET MANAGEMENT
  // =============================================
  {
    path: 'assets',
    loadChildren: () => import('./component/asset-management/asset-management.module').then(m => m.AssetManagementModule),
    canActivate: [AuthenticationGuard, ModuleAccessGuard],
    data: { title: 'Asset Management', moduleKey: 'ASSET_MANAGEMENT' }
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
    path: 'policy',
    component: CompanyPolicyComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Company Documents' }
  },
  {
    path: 'documentation',
    component: DocumentationComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Documentation' }
  },

  // =============================================
  // COMPANY SETTINGS (SYSADMIN / ADMIN)
  // =============================================
  {
    path: 'settings/company',
    loadChildren: () => import('./component/company-settings/company-settings.module').then(m => m.CompanySettingsModule),
    canActivate: [AuthenticationGuard],
    data: { title: 'Company Settings' }
  },

  // =============================================
  // SUPER-ADMIN (platform owner — cross-company)
  // =============================================
  {
    path: 'superadmin',
    loadChildren: () => import('./component/superadmin/superadmin.module').then(m => m.SuperadminModule),
    canActivate: [AuthenticationGuard, SuperadminGuard],
    data: { title: 'Platform Admin' }
  },

  // =============================================
  // LEGAL (public — no auth guard)
  // =============================================
  {
    path: 'legal',
    loadChildren: () => import('./component/legal/legal.module').then(m => m.LegalModule),
    data: { title: 'Legal' }
  },

  // ─── Kiosk ────────────────────────────────────────────────────────
  {
    path: 'kiosk',
    loadChildren: () => import('./component/kiosk/kiosk.module').then(m => m.KioskModule),
    data: { title: 'Kiosk' }
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
