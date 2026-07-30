# Enterprize360 — Silver Spectrum Payroll System (Frontend)

Angular 15 SPA for the Enterprize360 HR & Payroll Management Platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 15 |
| UI Components | Bootstrap 5, ng-bootstrap |
| Charts | Chart.js |
| Styles | SCSS (centralized variables/mixins system) |
| Auth | JWT via `@auth0/angular-jwt` |
| HTTP | Angular `HttpClient` with Bearer interceptor |
| Change Detection | `OnPush` + manual `cdr.markForCheck()` |

---

## Design System (Falcon UI)

Global utility classes defined in `src/styles.scss`:

| Class | Purpose |
|---|---|
| `.page-banner` | Full-width top banner with gradient background |
| `.banner-title`, `.banner-subtitle`, `.banner-actions` | Banner content slots |
| `.btn-banner` | White outline button for banners |
| `.falcon-card` | Standard card with `var(--bg-card)` and border-radius 16px |
| `.table-card` | Full-width card wrapping responsive tables |
| `.badge-soft-*` | Soft-color status badges (success, warning, danger, info, secondary) |
| `.action-btn-group` | Flex row for icon action buttons |
| `.btn-action`, `.btn-action-view`, `.btn-action-edit`, `.btn-action-delete` | Icon-only action buttons |
| `.skeleton-box` | Loading skeleton animation |
| `.empty-state-cell` | Centered empty-state inside a `<td>` |

> **Note:** `.table-card-header` is **not** global — define it locally in each component's SCSS.

Theme tokens (`--bg-card`, `--border-color`, `--text-primary`, `--text-muted`, `--bg-hover`) support automatic light/dark switching.

Font: **Poppins** (primary), system sans-serif (fallback).

---

## Modules & Routes

### Core
| Route | Component | Description |
|---|---|---|
| `/` | `DemoComponent` | Public landing page |
| `/home` | `HomeComponent` | Dashboard (post-login) |
| `/profile` | `UserModule` | User profile & settings |

### Organization
| Route | Module/Component | Description |
|---|---|---|
| `/departments` | `DepartmentModule` | Department CRUD |
| `/designations` | `DesignationModule` | Designation CRUD |

### Employees
| Route | Module/Component | Description |
|---|---|---|
| `/employee` | `EmployeeModule` | All employees list |
| `/employee/my-details` | `EmployeeModule` | Self-service detail view |

### Leave Management
| Route | Component | Description |
|---|---|---|
| `/admin/leave` | `AdminLeaveComponent` | Admin leave management |
| `/employee/leave` | `EmployeeLeaveComponent` | Employee leave requests |

### Attendance
| Route | Component/Module | Description |
|---|---|---|
| `/attendance` | `AttendanceListComponent` | Admin attendance |
| `/attendance/my` | `MyAttendanceComponent` | My attendance |
| `/attendance/whatsapp` | `WhatsAppAttendanceComponent` | WhatsApp attendance |
| `/holidays` | `HolidayModule` | Holiday management |
| `/intern/attendance` | `InternAttendanceModule` | Intern attendance (self-service) |
| `/admin/intern-attendance` | `InternAttendanceModule` | Intern attendance (admin) |

### Payroll
| Route | Module | Description |
|---|---|---|
| `/payroll` | `PayrollModule` | Payroll management & payslips |

### Clients & Invoices
| Route | Module | Description |
|---|---|---|
| `/customers` | `CustomerModule` | Customer/client CRUD |
| `/invoices` | `InvoiceModule` | Invoice management |

### Expense Claims
| Route | Module | Description |
|---|---|---|
| `/expense-claims` | `ExpenseClaimsModule` | Staff expense claims |

### Accounting
| Route | Module | Description |
|---|---|---|
| `/accounting/overview` | `AccountingModule` | Accounting dashboard |
| `/accounting/bills` | `AccountingModule` | Supplier bills & AP |
| `/accounting/products` | `AccountingModule` | Product catalog |
| `/accounting/quotes` | `AccountingModule` | Quotes (with convert to invoice) |
| `/accounting/credit-notes` | `AccountingModule` | Credit notes |
| `/accounting/vat-returns` | `AccountingModule` | VAT201 returns |
| `/accounting/reports` | `AccountingModule` | P&L & AP aging reports |

### Business Expenses
| Route | Module | Description |
|---|---|---|
| `/expenses/overview` | `ExpensesModule` | Expenses dashboard |
| `/expenses/entry` | `ExpensesModule` | Expense entry |
| `/expenses/claims` | `ExpensesModule` | Claims view |
| `/expenses/reports` | `ExpensesModule` | Financial reports + Excel export |
| `/expenses/accounts` | `ExpensesModule` | Chart of accounts |
| `/expenses/vendors` | `ExpensesModule` | Vendor management |

### Asset Management
| Route | Module | Description |
|---|---|---|
| `/assets` | `AssetManagementModule` | All assets (admin) |
| `/assets/requests` | `AssetManagementModule` | Asset requests (admin) |
| `/assets/assignments` | `AssetManagementModule` | Asset assignments |
| `/assets/my-assets` | `AssetManagementModule` | My assets (employee) |
| `/assets/request` | `AssetManagementModule` | Request an asset (employee) |
| `/assets/my-requests` | `AssetManagementModule` | My asset requests (employee) |

### Contract Management ✅ NEW
| Route | Component | Description |
|---|---|---|
| `/contracts` | `ContractListComponent` | All contracts — stat cards, status/type/search filters, paginated table |
| `/contracts/new` | `NewContractComponent` | Create new contract |
| `/contracts/:id` | `ContractDetailComponent` | Contract detail — info, lifecycle timeline, approval steps, documents |
| `/contracts/:id/edit` | `NewContractComponent` | Edit existing contract |
| `/contracts/approvals` | `ContractApprovalComponent` | Pending approval queue (ADMIN/MANAGER) |
| `/contracts/alerts` | `ContractAlertsComponent` | Expiry alerts — 30/60/90-day buckets |

**Contract statuses:** `DRAFT` → `PENDING_APPROVAL` → `ACTIVE` → `EXPIRING_SOON` → `RENEWED` / `EXPIRED` / `TERMINATED`

**Contract types:** Service, Supplier, NDA, Employment, Lease, Maintenance, Other

### Notifications & Announcements
| Route | Module | Description |
|---|---|---|
| `/notifications` | `UserNotificationModule` | In-app notifications |
| `/announcements` | `AnnouncementModule` | Company announcements |

### Settings & Admin
| Route | Module/Component | Description |
|---|---|---|
| `/policy` | `CompanyPolicyComponent` | Company policy documents |
| `/documentation` | `DocumentationComponent` | System documentation |
| `/settings/company` | `CompanySettingsModule` | Company profile & module access |
| `/superadmin` | `SuperadminModule` | Platform-level admin (SUPERADMIN only) |
| `/kiosk` | `KioskModule` | PIN-based kiosk clock-in/out |

---

## SCSS Architecture

```
src/
├── styles.scss                  # Global Falcon utility classes + theme tokens
└── styles/
    ├── _variables.scss          # $primary, $spacing-*, font vars, breakpoints
    └── _mixins.scss             # Reusable mixins
```

Import path convention (relative to component depth):
```scss
/* Component 4 levels deep (e.g. src/app/component/X/Y/) */
@import '../../../../styles/variables';

/* Component 3 levels deep (e.g. src/app/component/X/) */
@import '../../../styles/variables';

/* Shared components (src/app/shared/) */
@import '../../styles/variables';
```

---

## Key Patterns

**Role check** (reading from localStorage):
```typescript
const user = this.userSvc.getUserFromLocalCache(); // returns parsed 'user' key
this.isAdmin = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN', 'ROLE_MANAGER']
  .includes(user?.role || '');
```

**Excel blob download**:
```typescript
this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'report.xlsx'; a.click();
  window.URL.revokeObjectURL(url);
});
```

**Badge helper** (consistent across modules):
```typescript
getStatusClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'badge-soft-success',
    PENDING: 'badge-soft-warning',
    EXPIRED: 'badge-soft-danger',
    DRAFT: 'badge-soft-secondary'
  };
  return map[status] || 'badge-soft-secondary';
}
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Development server (API proxy to :8080)
ng serve

# Production build
ng build --configuration production

# Run via Maven (full stack)
cd ../payroll && ./mvnw spring-boot:run
```

App runs at: `http://localhost:4200`

---

## Project Structure

```
src/app/
├── component/
│   ├── accounting/          # Bills, quotes, credit notes, VAT, reports
│   ├── announcement/        # Announcements
│   ├── asset-management/    # Assets, requests, assignments
│   ├── attendance/          # Clock-in/out, admin view, WhatsApp
│   ├── auth/                # Login, register, verify
│   ├── company-settings/    # Company profile + module access
│   ├── contract/            # ✅ Contract Management (new)
│   │   ├── contract-alerts/
│   │   ├── contract-approval/
│   │   ├── contract-detail/
│   │   ├── contract-list/
│   │   ├── models/          # contract.model.ts
│   │   ├── new-contract/
│   │   └── services/        # contract.service.ts
│   ├── customer/            # Client CRUD
│   ├── demo/                # Public landing page
│   ├── department/          # Department CRUD
│   ├── designation/         # Designation CRUD
│   ├── employee/            # Employee management
│   ├── expense-claims/      # Staff claims
│   ├── expenses/            # Business expenses (QuickBooks-style)
│   ├── holiday/             # Holiday calendar
│   ├── home/                # Dashboard
│   ├── intern-attendance/   # Intern clock-in
│   ├── invoice/             # Invoice management
│   ├── kiosk/               # PIN kiosk
│   ├── leave/               # Leave management
│   ├── legal/               # Legal pages
│   ├── navbar/              # Top navigation bar
│   ├── notification/        # In-app notifications
│   ├── payroll/             # Payroll & payslips
│   ├── policy/              # Company policy viewer
│   ├── profile/             # User profile
│   ├── sidebar/             # Side navigation
│   └── superadmin/          # Platform admin
├── guard/                   # Auth, module-access, superadmin guards
├── interceptor/             # JWT Bearer interceptor
├── service/                 # Shared services (user, notification, etc.)
└── interface/               # Shared TypeScript interfaces
```
