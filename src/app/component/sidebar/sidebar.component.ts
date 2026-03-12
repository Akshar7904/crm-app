import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { environment } from '@env/environment';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UserModel } from 'src/app/component/profile/user.model';
import { UserService } from 'src/app/service/user.service';
import { NotificationService } from 'src/app/service/notification.service';

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
      route: '/'
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
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
          excludeRoles: ['ROLE_USER']
        }
      ]
    },
    {
      label: 'Attendance',
      icon: 'bi-clock-history',
      expanded: false,
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
      label: 'Our Clients',
      icon: 'bi-briefcase',
      expanded: false,
      requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
      excludeRoles: ['ROLE_USER'],
      children: [
        {
          label: 'All Clients',
          icon: 'bi-people',
          route: '/customers',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        },
        {
          label: 'Add New Client',
          icon: 'bi-person-plus-fill',
          route: '/customers/new',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        }
      ]
    },
    {
      label: 'Accounts',
      icon: 'bi-receipt-cutoff',
      expanded: false,
      requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
      excludeRoles: ['ROLE_USER'],
      children: [
        {
          label: 'All Invoices',
          icon: 'bi-file-earmark-text',
          route: '/invoices',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        },
        {
          label: 'Create Invoice',
          icon: 'bi-plus-square',
          route: '/invoices/new',
          requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN']
        }
      ]
    },
    {
      label: 'Claims',
      icon: 'bi-wallet2',
      expanded: false,
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
      label: 'Expenses',
      icon: 'bi-receipt',
      expanded: false,
      requiredRoles: ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN'],
      excludeRoles: ['ROLE_USER'],
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
      label: 'Assets',
      icon: 'bi-laptop',
      expanded: false,
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
    }
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    console.log('Sidebar initialized');
    if (this.user) {
      this.filterMenuItems();
    }

    // Listen for route changes to update active state and close mobile sidebar
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.closeMobileSidebar.emit(); // Close mobile sidebar on navigation
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      console.log('Sidebar - User received:', this.user);
      console.log('User role:', this.user.roleName);
      this.filterMenuItems();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private filterMenuItems(): void {
    console.log('Filtering menu items...');

    if (!this.user) {
      console.warn('No user found');
      this.filteredMenuItems = [];
      this.cdr.markForCheck();
      return;
    }

    const userRole = this.user.roleName;
    console.log('User:', this.user.firstName, this.user.lastName);
    console.log('User role:', userRole);

    this.filteredMenuItems = this.fullMenuStructure
      .filter(item => this.canShowMenuItem(item, userRole))
      .map(item => {
        if (item.children) {
          const filteredChildren = item.children.filter(child => this.canShowMenuItem(child, userRole));

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

    console.log('Filtered to', this.filteredMenuItems.length, 'menu items');
    console.log('Visible menu items:', this.filteredMenuItems.map(i => ({
      label: i.label,
      childCount: i.children?.length || 0,
      children: i.children?.map(c => c.label) || []
    })));

    this.cdr.markForCheck();
  }

  private canShowMenuItem(item: MenuItem, userRole: string): boolean {
    // PRIORITY 1: Check if role is explicitly excluded
    if (item.excludeRoles && item.excludeRoles.includes(userRole)) {
      console.log(`"${item.label}" - EXCLUDED for role ${userRole}`);
      return false;
    }

    // PRIORITY 2: Check if specific roles are required
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      const hasRole = item.requiredRoles.includes(userRole);
      if (!hasRole) {
        console.log(`"${item.label}" - requires one of [${item.requiredRoles.join(', ')}], user has ${userRole}`);
        return false;
      }
      console.log(`"${item.label}" - role ${userRole} matches required roles`);
      return true;
    }

    // PRIORITY 3: Check if specific role is required
    if (item.requiredRole) {
      const hasRole = userRole === item.requiredRole;
      if (!hasRole) {
        console.log(`"${item.label}" - requires ${item.requiredRole}, user has ${userRole}`);
        return false;
      }
      console.log(`"${item.label}" - role ${userRole} matches required role`);
      return true;
    }

    // No restrictions - show to everyone
    console.log(`"${item.label}" - visible to all (no requirements)`);
    return true;
  }

  toggleMenu(item: MenuItem): void {
    console.log('Toggle menu:', item.label);

    if (item.children) {
      item.expanded = !item.expanded;
      this.cdr.markForCheck();
    } else if (item.route) {
      console.log('Navigating to:', item.route);
      this.router.navigate([item.route]);
    }
  }

  onChildClick(event: Event, child: MenuItem): void {
    event.stopPropagation();
    console.log('Child clicked:', child.label, '->', child.route);

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
    if (route === '/' && currentUrl === '') return true;

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
      'ROLE_SYSADMIN': 'System Admin'
    };

    return roleMap[this.user.roleName] || this.user.roleName;
  }

  getAvatarUrl(): string {
    if (!this.user?.id) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    return `${environment.apiUrl}/api/v1/user/${this.user.id}/profile-image`;
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  }

  onLogout(): void {
    this.userService.logOut();
    this.notification.onDefault('You\'ve been successfully logged out');
    this.router.navigate(['/login']);
  }
}
