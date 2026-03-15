import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../../service/user.service';

@Component({
  standalone: false,
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss']
})
export class DocumentationComponent implements OnInit, OnDestroy {
  activeTab: 'admin' | 'user' = 'user';
  today = new Date();
  isAdmin = false;
  activeSection = '';

  private destroy$ = new Subject<void>();

  // Table of contents sections for admin guide
  adminSections = [
    { id: 'a-getting-started', label: 'Getting Started & Login' },
    { id: 'a-roles',           label: 'User Roles & Permissions' },
    { id: 'a-dashboard',       label: 'Dashboard' },
    { id: 'a-org',             label: 'Departments & Designations' },
    { id: 'a-employees',       label: 'Employee Management' },
    { id: 'a-leave',           label: 'Leave Management' },
    { id: 'a-leave-balance',   label: 'Leave Balance Explained' },
    { id: 'a-attendance',      label: 'Attendance' },
    { id: 'a-holidays',        label: 'Holiday Management' },
    { id: 'a-payroll',         label: 'Payroll Processing' },
    { id: 'a-expenses',        label: 'Expenses Module' },
    { id: 'a-claims',          label: 'Expense Claims' },
    { id: 'a-assets',          label: 'Asset Management' },
    { id: 'a-intern',          label: 'Intern / School Attendance' },
    { id: 'a-invoices',        label: 'Invoices & Clients' },
    { id: 'a-announcements',   label: 'Announcements' },
    { id: 'a-sysadmin',        label: 'System Administration' },
    { id: 'a-faq',             label: 'FAQ' }
  ];

  // Table of contents sections for user/employee guide
  userSections = [
    { id: 'u-getting-started', label: 'Getting Started & Login' },
    { id: 'u-dashboard',       label: 'Dashboard' },
    { id: 'u-profile',         label: 'My Profile & Details' },
    { id: 'u-leave',           label: 'Applying for Leave' },
    { id: 'u-leave-balance',   label: 'Understanding Leave Balance' },
    { id: 'u-attendance',      label: 'Clocking In & Out' },
    { id: 'u-payslips',        label: 'My Payslips' },
    { id: 'u-claims',          label: 'Expense Claims' },
    { id: 'u-assets',          label: 'My Assets' },
    { id: 'u-intern',          label: 'Intern School Attendance' },
    { id: 'u-announcements',   label: 'Announcements' },
    { id: 'u-faq',             label: 'FAQ' }
  ];

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.profile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const role = res?.data?.user?.roleName;
          this.isAdmin = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_MANAGER'].includes(role);
          this.activeTab = this.isAdmin ? 'admin' : 'user';
        },
        error: () => {
          this.activeTab = 'user';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: 'admin' | 'user'): void {
    if (tab === 'admin' && !this.isAdmin) return;
    this.activeTab = tab;
    // Scroll to top when switching tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Smooth-scroll to a documentation section by its element ID.
   * Accounts for the sticky navbar offset.
   */
  scrollToSection(sectionId: string): void {
    this.activeSection = sectionId;
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 80; // height of sticky navbar
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  /**
   * Navigate to an app route using Angular Router (no page reload).
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  downloadPdf(): void {
    window.print();
  }
}
