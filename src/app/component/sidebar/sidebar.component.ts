// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { environment } from '@env/environment';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UserModel } from 'src/app/component/profile/user.model';
import { UserService } from 'src/app/service/user.service';
import { NotificationService } from 'src/app/service/notification.service';
import { ModuleAccessService } from 'src/app/service/module-access.service';
import { BrandingService } from 'src/app/service/branding.service';
import { Key } from 'src/app/enum/key.enum';

type BadgeType = 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
  requiredRole?: string;
  requiredRoles?: string[];
  excludeRoles?: string[];
  /** Show only if user has one of these employment types (OR with requiredRoles) */
  allowedEmploymentTypes?: string[];
  /** Module subscription key — hide this item if the module is disabled for the tenant */
  moduleKey?: string;
  badge?: {
    count: number;
    type: BadgeType;
  };
}

@Component({
  standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() user: UserModel;
  @Input() collapsed: boolean = false;
  @Input() mobileOpen: boolean = false;
  @Output() closeMobileSidebar = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  filteredMenuItems: MenuItem[] = [];

  private fullMenuStructure: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'bi-house-door',
      route: '/home'
    },
    {
      label: 'Organization',
      icon: 'bi-building',
      expanded: false,
      requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
      excludeRoles: ['ROLE_USER'],
      children: [
        {
          label: 'Departments',
          icon: 'bi-diagram-3',
          route: '/departments',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        },
        {
          label: 'Designations',
          icon: 'bi-briefcase',
          route: '/designations',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        }
      ]
    },
    {
      label: 'Employees',
      icon: 'bi-people-fill',
      expanded: false,
      moduleKey: 'EMPLOYEE_MANAGEMENT',
      children: [
        // ADMIN/MANAGER OPTIONS
        {
          label: 'All Employees',
          icon: 'bi-person-badge',
          route: '/employee',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER']
        },
        {
          label: 'Add Employee',
          icon: 'bi-person-plus-fill',
          route: '/employee/new',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER']
        },
        // EMPLOYEE OPTION - My Employee Details (redirects to profile)
        {
          label: 'My Employee Details',
          icon: 'bi-person-circle',
          route: '/profile',
          requiredRole: 'ROLE_USER',
          excludeRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        }
      ]
    },
    {
      label: 'Leave Management',
      icon: 'bi-calendar-x',
      expanded: false,
      moduleKey: 'LEAVE_MANAGEMENT',
      children: [
        {
          label: 'All Leave Applications',
          icon: 'bi-calendar-plus',
          route: '/admin/leave',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER'],
          badge: {
            count: 0,
            type: 'warning' as BadgeType
          }
        },
        {
          label: 'My Leave',
          icon: 'bi-calendar-check',
          route: '/employee/leave'
        }
      ]
    },
    {
      label: 'Intern',
      icon: 'bi-mortarboard-fill',
      expanded: false,
      // Visible to admins/managers OR employees whose employment type is INTERN
      requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
      allowedEmploymentTypes: ['INTERN'],
      moduleKey: 'INTERN_ATTENDANCE',
      children: [
        {
          label: 'My School Days',
          icon: 'bi-mortarboard',
          route: '/intern/attendance/my'
        },
        {
          label: 'All School Requests',
          icon: 'bi-list-check',
          route: '/admin/intern-attendance/admin',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        }
      ]
    },
    {
      label: 'Attendance',
      icon: 'bi-clock-history',
      expanded: false,
      moduleKey: 'ATTENDANCE_TRACKING',
      children: [
        {
          label: 'All Attendance',
          icon: 'bi-list-check',
          route: '/attendance',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER']
        },
        {
          label: 'My Attendance',
          icon: 'bi-person-check',
          route: '/attendance/my'
        },
        {
          label: 'WhatsApp Attendance',
          icon: 'bi-whatsapp',
          route: '/attendance/whatsapp',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER']
        },
        {
          label: 'Holidays',
          icon: 'bi-calendar-week',
          route: '/holidays'
        },
        {
          label: 'Reports',
          icon: 'bi-file-earmark-bar-graph',
          route: '/attendance',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER']
        }
      ]
    },
    {
      label: 'Payroll',
      icon: 'bi-cash-stack',
      expanded: false,
      moduleKey: 'PAYROLL_PAYSLIPS',
      children: [
        // ADMIN ONLY OPTIONS
        {
          label: 'All Payrolls',
          icon: 'bi-list-check',
          route: '/payroll/list',
          requiredRoles: ['ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER', 'ROLE_MANAGER']
        },
        {
          label: 'Employee Salary',
          icon: 'bi-currency-dollar',
          route: '/payroll/salaries',
          requiredRoles: ['ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER', 'ROLE_MANAGER']
        },
        {
          label: 'Payslips',
          icon: 'bi-file-earmark-text',
          route: '/payroll/payslips',
          requiredRoles: ['ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER', 'ROLE_MANAGER']
        },
        {
          label: 'Statistics',
          icon: 'bi-graph-up',
          route: '/payroll/stats',
          requiredRoles: ['ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER', 'ROLE_MANAGER']
        },
        // EVERYONE - My Payslips
        {
          label: 'My Payslips',
          icon: 'bi-receipt',
          route: '/payroll/my-payslips'
        }
      ]
    },
    {
      label: 'Claims',
      icon: 'bi-wallet2',
      expanded: false,
      moduleKey: 'EXPENSE_CLAIMS',
      children: [
        {
          label: 'All Claims',
          icon: 'bi-wallet',
          route: '/expense-claims',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER']
        },
        {
          label: 'My Claims',
          icon: 'bi-wallet2',
          route: '/expense-claims/my-claims'
        },
        {
          label: 'Submit Claim',
          icon: 'bi-plus-circle',
          route: '/expense-claims/new'
        }
      ]
    },
    {
      label: 'Accounting',
      icon: 'bi-journal-text',
      expanded: false,
      requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
      excludeRoles: ['ROLE_USER'],
      // Parent has no moduleKey — it shows if EITHER INVOICE_CUSTOMER or BUSINESS_EXPENSES is enabled
      // (the sidebar hides parents with zero visible children automatically)
      children: [
        {
          label: 'Overview',
          icon: 'bi-grid-1x2',
          route: '/accounting/overview',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'BUSINESS_EXPENSES'
        },
        {
          label: 'Invoices (AR)',
          icon: 'bi-file-earmark-text',
          route: '/invoices',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'INVOICE_CUSTOMER'
        },
        {
          label: 'Create Invoice',
          icon: 'bi-plus-square',
          route: '/invoices/new',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'INVOICE_CUSTOMER'
        },
        {
          label: 'Products & Services',
          icon: 'bi-box-seam',
          route: '/accounting/products',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'BUSINESS_EXPENSES'
        },
        {
          label: 'Bills & AP',
          icon: 'bi-receipt-cutoff',
          route: '/accounting/bills',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'BUSINESS_EXPENSES'
        },
        {
          label: 'Quotes & Estimates',
          icon: 'bi-file-text',
          route: '/accounting/quotes',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'INVOICE_CUSTOMER'
        },
        {
          label: 'Credit Notes',
          icon: 'bi-credit-card',
          route: '/accounting/credit-notes',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'INVOICE_CUSTOMER'
        },
        {
          label: 'VAT Returns',
          icon: 'bi-percent',
          route: '/accounting/vat-returns',
          requiredRoles: ['ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'BUSINESS_EXPENSES'
        },
        {
          label: 'Banking',
          icon: 'bi-bank',
          route: '/accounting/banking',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'BUSINESS_EXPENSES'
        },
        {
          label: 'Inventory',
          icon: 'bi-box-seam',
          route: '/accounting/inventory',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'BUSINESS_EXPENSES'
        },
        {
          label: 'Reports',
          icon: 'bi-file-earmark-bar-graph',
          route: '/accounting/reports',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'BUSINESS_EXPENSES'
        }
      ]
    },
    {
      label: 'Customer Management',
      icon: 'bi-people',
      expanded: false,
      requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
      excludeRoles: ['ROLE_USER'],
      moduleKey: 'INVOICE_CUSTOMER',
      children: [
        {
          label: 'All Clients',
          icon: 'bi-people-fill',
          route: '/customers',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'INVOICE_CUSTOMER'
        },
        {
          label: 'Add Client',
          icon: 'bi-person-plus-fill',
          route: '/customers/new',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          moduleKey: 'INVOICE_CUSTOMER'
        }
      ]
    },
    {
      label: 'Expenses',
      icon: 'bi-receipt',
      expanded: false,
      requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
      excludeRoles: ['ROLE_USER'],
      moduleKey: 'BUSINESS_EXPENSES',
      children: [
        {
          label: 'Overview',
          icon: 'bi-bar-chart-line',
          route: '/expenses/overview',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        },
        {
          label: 'Record Expense',
          icon: 'bi-plus-square',
          route: '/expenses/entry',
          requiredRoles: ['ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER', 'ROLE_MANAGER']
        },
        {
          label: 'All Expenses',
          icon: 'bi-list-ul',
          route: '/expenses/entry/list',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        },
        {
          label: 'Expense Claims',
          icon: 'bi-wallet',
          route: '/expenses/claims',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        },
        {
          label: 'Reports',
          icon: 'bi-file-earmark-bar-graph',
          route: '/expenses/reports',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        },
        {
          label: 'Chart of Accounts',
          icon: 'bi-diagram-3',
          route: '/expenses/accounts',
          requiredRoles: ['ROLE_SYSADMIN']
        },
        {
          label: 'Vendors',
          icon: 'bi-building',
          route: '/expenses/vendors',
          requiredRoles: ['ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER', 'ROLE_MANAGER']
        },
        {
          label: 'Opening Balance',
          icon: 'bi-bank',
          route: '/expenses/opening-balance',
          requiredRoles: ['ROLE_ADMIN', 'ROLE_SYSADMIN']
        },
        {
          label: 'Annual Budget',
          icon: 'bi-graph-up-arrow',
          route: '/expenses/budget',
          requiredRoles: ['ROLE_ADMIN', 'ROLE_SYSADMIN']
        },
        {
          label: 'Budget vs Actual',
          icon: 'bi-bar-chart-line',
          route: '/expenses/budget-vs-actual',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        }
      ]
    },
    {
      label: 'Contracts',
      icon: 'bi-file-earmark-text',
      expanded: false,
      moduleKey: 'CONTRACT_MANAGEMENT',
      children: [
        {
          label: 'All Contracts',
          icon: 'bi-file-earmark-text',
          route: '/contracts',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN']
        },
        {
          label: 'New Contract',
          icon: 'bi-plus-circle',
          route: '/contracts/new',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN']
        },
        {
          label: 'Pending Approvals',
          icon: 'bi-person-check',
          route: '/contracts/approvals',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN']
        },
        {
          label: 'Expiry Alerts',
          icon: 'bi-bell-fill',
          route: '/contracts/alerts',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN']
        },
        {
          label: 'Templates',
          icon: 'bi-layout-text-window-reverse',
          route: '/contracts/templates',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN']
        }
      ]
    },
    {
      label: 'Assets',
      icon: 'bi-laptop',
      expanded: false,
      moduleKey: 'ASSET_MANAGEMENT',
      children: [
        // ADMIN/MANAGER - Asset Management
        {
          label: 'All Assets',
          icon: 'bi-box-seam',
          route: '/assets',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER']
        },
        {
          label: 'Asset Requests',
          icon: 'bi-inbox',
          route: '/assets/requests',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER']
        },
        {
          label: 'Assignments',
          icon: 'bi-clipboard-check',
          route: '/assets/assignments',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER']
        },
        // EMPLOYEE - My Assets
        {
          label: 'My Assets',
          icon: 'bi-laptop',
          route: '/assets/my-assets'
        },
        {
          label: 'Request Asset',
          icon: 'bi-plus-circle',
          route: '/assets/request'
        },
        {
          label: 'My Requests',
          icon: 'bi-list-check',
          route: '/assets/my-requests'
        }
      ]
    },
    {
      label: 'Company Settings',
      icon: 'bi-building-gear',
      route: '/settings/company',
      requiredRoles: ['ROLE_SYSADMIN', 'ROLE_ADMIN'],
      excludeRoles: ['ROLE_USER', 'ROLE_MANAGER']
    },
    {
      label: 'Announcements',
      icon: 'bi-megaphone-fill',
      expanded: false,
      children: [
        // ADMIN/MANAGER - Can view and manage
        {
          label: 'View All',
          icon: 'bi-list-ul',
          route: '/announcements',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        },
        {
          label: 'Manage Announcements',
          icon: 'bi-gear',
          route: '/announcements/admin',
          requiredRoles: ['ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER', 'ROLE_MANAGER']
        },
        // EMPLOYEE - View only
        {
          label: 'Announcements',
          icon: 'bi-megaphone',
          route: '/announcements',
          requiredRole: 'ROLE_USER',
          excludeRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        }
      ]
    },
    {
      label: 'Messages',
      icon: 'bi-chat-left-text-fill',
      route: '/notifications',
      badge: {
        count: 0,
        type: 'info' as BadgeType
      }
    },
    {
      label: 'Super Admin',
      icon: 'bi-shield-lock-fill',
      expanded: false,
      requiredRoles: ['ROLE_SUPERADMIN'],
      children: [
        { label: 'Overview',        icon: 'bi-grid-1x2-fill',               route: '/superadmin/dashboard',  requiredRoles: ['ROLE_SUPERADMIN'] },
        { label: 'Companies',       icon: 'bi-building',                    route: '/superadmin/companies',  requiredRoles: ['ROLE_SUPERADMIN'] },
        { label: 'Platform Users',  icon: 'bi-people-fill',                 route: '/superadmin/users',      requiredRoles: ['ROLE_SUPERADMIN'] },
        { label: 'Company Reports', icon: 'bi-file-earmark-bar-graph-fill', route: '/superadmin/reports',    requiredRoles: ['ROLE_SUPERADMIN'] },
        { label: 'Analytics',       icon: 'bi-graph-up-arrow',              route: '/superadmin/analytics',  requiredRoles: ['ROLE_SUPERADMIN'] },
        { label: 'Audit Logs',      icon: 'bi-journal-text',                route: '/superadmin/logs',          requiredRoles: ['ROLE_SUPERADMIN'] },
        { label: 'System Health',   icon: 'bi-heart-pulse-fill',            route: '/superadmin/health',        requiredRoles: ['ROLE_SUPERADMIN'] },
        { label: 'Announcements',   icon: 'bi-megaphone-fill',              route: '/superadmin/announcements', requiredRoles: ['ROLE_SUPERADMIN'] }
      ]
    }
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private notification: NotificationService,
    private moduleAccess: ModuleAccessService,
    public branding: BrandingService
  ) {}

  ngOnInit(): void {
    if (this.user) {
      // Load module access first, then re-filter to apply module visibility
      this.moduleAccess.loadIfNeeded()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.filterMenuItems();
          this.cdr.markForCheck();
        });
      this.filterMenuItems();
      this.loadCompanyInfo();
    }

    // Listen for route changes to update active state and close mobile sidebar
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.closeMobileSidebar.emit();
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.filterMenuItems();
      // Only reload company info if the company actually changed
      const prev = changes['user'].previousValue;
      const companyChanged = !prev || prev.companyId !== this.user.companyId;
      if (companyChanged) {
        this.companyLogoFailed = false;
        this.staticFallbackLogo = null;
        this.companyName = null;
        this.loadCompanyInfo();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private filterMenuItems(): void {
    if (!this.user) {
      this.filteredMenuItems = [];
      this.cdr.markForCheck();
      return;
    }

    const userRole = this.user.roleName;
    const employmentType = (this.user.employmentType || '').toUpperCase();

    const isImpersonating = !!localStorage.getItem(Key.SUPERADMIN_TOKEN);

    // SUPERADMIN gets a dedicated flat menu — no regular tenant items —
    // but only when NOT impersonating a company (see below).
    if (userRole === 'ROLE_SUPERADMIN' && !isImpersonating) {
      this.filteredMenuItems = [
        { label: 'Overview',        icon: 'bi-speedometer2',                route: '/superadmin/dashboard'      },
        { label: 'Companies',       icon: 'bi-buildings-fill',              route: '/superadmin/companies'      },
        { label: 'Platform Users',  icon: 'bi-people-fill',                 route: '/superadmin/users'          },
        { label: 'Company Reports', icon: 'bi-bar-chart-line-fill',         route: '/superadmin/reports'        },
        { label: 'Analytics',       icon: 'bi-graph-up-arrow',              route: '/superadmin/analytics'      },
        { label: 'Audit Logs',      icon: 'bi-shield-check',                route: '/superadmin/logs'           },
        { label: 'System Health',   icon: 'bi-activity',                    route: '/superadmin/health'         },
        { label: 'Announcements',   icon: 'bi-megaphone-fill',              route: '/superadmin/announcements'  }
      ];
      this.cdr.markForCheck();
      return;
    }

    // Company menu items only declare requiredRoles like ROLE_ADMIN/
    // ROLE_SYSADMIN — never ROLE_SUPERADMIN — so while impersonating, treat
    // the superadmin as a sysadmin for menu-visibility purposes only.
    const effectiveRole = (userRole === 'ROLE_SUPERADMIN' && isImpersonating) ? 'ROLE_SYSADMIN' : userRole;

    this.filteredMenuItems = this.fullMenuStructure
      .filter(item => this.canShowMenuItem(item, effectiveRole, employmentType))
      .map(item => {
        if (item.children) {
          const filteredChildren = item.children.filter(child => this.canShowMenuItem(child, effectiveRole, employmentType));

          // Only show parent if it has visible children
          if (filteredChildren.length === 0 && item.children.length > 0) {
            console.log(`Hiding "${item.label}" - no visible children`);
            return null;
          }

          // Add badge count to parent if children have badges
          if (filteredChildren.some(child => child.badge?.count)) {
            const totalBadgeCount = filteredChildren
              .filter(child => child.badge?.count)
              .reduce((sum, child) => sum + (child.badge?.count || 0), 0);

            return {
              ...item,
              children: filteredChildren,
              badge: {
                count: totalBadgeCount,
                type: 'warning' as BadgeType
              }
            };
          }

          return {
            ...item,
            children: filteredChildren
          };
        }
        return item;
      })
      .filter(item => item !== null);

    this.cdr.markForCheck();
  }

  private canShowMenuItem(item: MenuItem, userRole: string, employmentType: string = ''): boolean {
    // Module subscription gate — hide if the tenant's module is disabled
    if (item.moduleKey && !this.moduleAccess.isEnabled(item.moduleKey)) return false;

    if (item.excludeRoles && item.excludeRoles.includes(userRole)) return false;

    if (item.requiredRoles && item.requiredRoles.length > 0) {
      const hasRole = item.requiredRoles.includes(userRole);
      const hasEmploymentType = item.allowedEmploymentTypes
        ? item.allowedEmploymentTypes.includes(employmentType)
        : false;
      return hasRole || hasEmploymentType;
    }

    if (item.requiredRole) return userRole === item.requiredRole;

    if (item.allowedEmploymentTypes && item.allowedEmploymentTypes.length > 0) {
      return item.allowedEmploymentTypes.includes(employmentType);
    }

    return true;
  }

  toggleMenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
      this.cdr.markForCheck();
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onChildClick(event: Event, child: MenuItem): void {
    event.stopPropagation();
    if (child.route) {
      this.router.navigate([child.route]);
    }
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    const currentUrl = this.router.url;

    // Exact match
    if (currentUrl === route) return true;

    // Match with trailing slash
    if (currentUrl === route + '/') return true;

    // Match child routes
    if (currentUrl.startsWith(route + '/')) return true;

    // Handle special cases
    if (route === '/home' && currentUrl === '') return true;

    return false;
  }

  // Helper method to check if user has specific role
  hasRole(role: string): boolean {
    return this.user && this.user.roleName === role;
  }

  // Get user role name for display
  getUserRoleName(): string {
    if (!this.user) return '';

    const roleMap: {[key: string]: string} = {
      'ROLE_USER': 'Employee',
      'ROLE_MANAGER': 'Manager',
      'ROLE_ADMIN': 'Administrator',
      'ROLE_SYSADMIN': 'System Admin',
      'ROLE_SUPERADMIN': 'Super Admin'
    };

    return roleMap[this.user.roleName] || this.user.roleName;
  }

  getAvatarUrl(): string {
    if (!this.user?.id) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    return `${environment.apiUrl}/api/v1/user/image/${this.user.id}`;
  }

  companyLogoFailed = false;
  companyName: string | null = null;
  staticFallbackLogo: string | null = null;

  /** Map of company name keywords to static logo assets */
  private readonly COMPANY_LOGO_MAP: { keywords: string[]; asset: string }[] = [];

  get companyLogoUrl(): string | null {
    const companyId = this.user?.companyId;
    if (!companyId) return null;
    if (this.staticFallbackLogo) return this.staticFallbackLogo;
    if (this.companyLogoFailed) return null;
    return `${environment.apiUrl}/api/v1/companies/${companyId}/logo`;
  }

  onLogoError(): void {
    this.companyLogoFailed = true;
    if (this.companyName) {
      this.staticFallbackLogo = this.resolveStaticLogo(this.companyName);
    }
    this.cdr.markForCheck();
  }

  private resolveStaticLogo(name: string): string | null {
    const lower = name.toLowerCase();
    for (const entry of this.COMPANY_LOGO_MAP) {
      if (entry.keywords.some(k => lower.includes(k))) {
        return entry.asset;
      }
    }
    return null;
  }

  private loadCompanyInfo(): void {
    const companyId = this.user?.companyId;
    if (!companyId) return;
    this.branding.load()
      .pipe(takeUntil(this.destroy$))
      .subscribe(b => {
        const name = b?.name ?? '';
        this.companyName = name || null;
        this.staticFallbackLogo = name ? this.resolveStaticLogo(name) : null;
        this.cdr.markForCheck();
      });
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  }

  onLogout(): void {
    this.moduleAccess.clear();
    this.branding.clear();
    this.userService.logOut();
    this.notification.onDefault('You\'ve been successfully logged out');
    this.router.navigate(['/login']);
  }

  trackById(index: number, item: any): number { return item?.id ?? index; }
  trackByIndex(index: number): number { return index; }
}
