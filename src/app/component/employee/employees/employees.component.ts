import { environment } from '@env/environment';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse, Page } from 'src/app/interface/appstates';
import { Employee } from '../employee.model';
import { State } from 'src/app/interface/state';
import { UserModel } from 'src/app/component/profile/user.model';
import { EmployeeService } from '../../../service/employee.service';
import { NotificationService } from 'src/app/service/notification.service';

/**
 * Employees Component
 * Display and manage all employees (Admin/Manager view)
 *
 * NEW FEATURES:
 * - Update employee status (Admin only)
 * - Export to CSV
 * - Enhanced filtering
 *
 * Company: LKCentrix Solutions (PTY) LTD
 */
@Component({
  standalone: false,
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeesComponent implements OnInit {
  employeesState$: Observable<State<CustomHttpResponse<Page<Employee> & UserModel>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<Page<Employee> & UserModel>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();
  private showLogsSubject = new BehaviorSubject<boolean>(false);
  showLogs$ = this.showLogsSubject.asObservable();
  readonly DataState = DataState;

  // User role check
  isAdmin = false;
  isManager = false;
  brokenImages: { [id: number]: boolean } = {};

  constructor(
    private router: Router,
    private employeeService: EmployeeService,
    private notification: NotificationService
  ) {
    // Check user role from local storage or auth service
    const currentUser = this.getCurrentUser();
    this.isAdmin = currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ROLE_SYSADMIN';
    this.isManager = currentUser?.role === 'ROLE_MANAGER';
  }

  ngOnInit(): void {
    console.log('✅ EmployeesComponent initialized');
    this.employeesState$ = this.employeeService.searchEmployees$()
      .pipe(
        map(response => {
          console.log('✅ Employees loaded - Full Response:', response);
          console.log('Response Data:', response.data);
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          console.error('❌ Error loading employees:', error);
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  /**
   * Search employees by name, email, or employee ID
   */
  searchEmployees(searchForm: NgForm): void {
    this.currentPageSubject.next(0);
    this.employeesState$ = this.employeeService.searchEmployees$(searchForm.value.name)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          console.log(response);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  /**
   * Go to specific page
   */
  goToPage(pageNumber?: number, name?: string): void {
    this.employeesState$ = this.employeeService.searchEmployees$(name, pageNumber)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          console.log(response);
          this.dataSubject.next(response);
          this.currentPageSubject.next(pageNumber);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.LOADED, error, appData: this.dataSubject.value });
        })
      );
  }

  /**
   * Navigate to next or previous page
   */
  goToNextOrPreviousPage(direction?: string, name?: string): void {
    this.goToPage(
      direction === 'forward' ? this.currentPageSubject.value + 1 : this.currentPageSubject.value - 1,
      name
    );
  }

  /**
   * Navigate to employee detail page
   */
  selectEmployee(employee: Employee): void {
    if (!employee || !employee.id) {
      console.error('❌ Invalid employee object:', employee);
      this.notification.onError('Invalid employee selected');
      return;
    }

    console.log('🔀 Navigating to employee:', employee.id, employee.firstName, employee.lastName);
    this.router.navigate(['/employee', employee.id]);
  }

  /**
   * UPDATE EMPLOYEE STATUS (NEW - Admin only)
   * Uses new PATCH /api/v1/employee/status/{id}?status={status} endpoint
   */
  updateEmployeeStatus(employee: Employee, newStatus: string): void {
    if (!this.isAdmin) {
      this.notification.onError('Only administrators can update employee status');
      return;
    }

    if (!confirm(`Change ${employee.firstName} ${employee.lastName}'s status to "${newStatus}"?`)) {
      return;
    }

    console.log(`📝 Updating employee ${employee.id} status to: ${newStatus}`);

    this.isLoadingSubject.next(true);

    this.employeeService.updateEmployeeStatus$(employee.id, newStatus)
      .subscribe({
        next: (response) => {
          console.log('✅ Status updated successfully:', response);
          this.notification.onSuccess(`Employee status updated to: ${newStatus}`);
          this.isLoadingSubject.next(false);

          // Reload employee list
          this.ngOnInit();
        },
        error: (error) => {
          console.error('❌ Error updating status:', error);
          this.notification.onError(error);
          this.isLoadingSubject.next(false);
        }
      });
  }

  /**
   * EXPORT TO CSV (NEW)
   */
  exportToCSV(): void {
    const employees = this.getEmployees(this.dataSubject.value);

    if (employees.length === 0) {
      this.notification.onError('No employees to export');
      return;
    }

    const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Designation', 'Status', 'Hire Date'];
    const csvData = employees.map(emp => [
      emp.employeeId || 'N/A',
      `${emp.firstName} ${emp.lastName}`,
      emp.email,
      emp.departmentName || 'N/A',
      emp.designationTitle || 'N/A',
      emp.status,
      this.formatDate(emp.hireDate)
    ]);

    let csv = headers.join(',') + '\n';
    csvData.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.notification.onSuccess('Employee list exported successfully');
  }

  /**
   * Get employees from state
   * Handles both response structures:
   * 1. Backend search endpoint returns: { data: { employees: [...], count: N } }
   * 2. Legacy page endpoint returns: { data: { page: { content: [...] } } }
   *
   * The state parameter can be either:
   * - Full state object: { dataState, appData: { data: { employees: [] } } }
   * - App data object: { data: { employees: [] } }
   */
  getEmployees(state: any): Employee[] {
    // Handle full state object (from template: state = { dataState, appData })
    const data = state?.appData?.data || state?.data;

    if (!data) {
      return [];
    }

    // Check for employees array (from /search endpoint)
    if (data.employees && Array.isArray(data.employees)) {
      return data.employees;
    }

    // Check for page object (legacy Spring Page response)
    if (data.page) {
      const page = data.page;

      // Check if page has content property (Spring Page object)
      if (page.content && Array.isArray(page.content)) {
        return page.content;
      }

      // Fallback if page is directly an array
      if (Array.isArray(page)) {
        return page;
      }
    }

    return [];
  }

  /**
   * Navigate to new employee form
   */
  addNewEmployee(): void {
    console.log('🔀 Navigating to new employee form');
    this.router.navigate(['/employee/new']);
  }

  /**
   * Get employee initials for avatar
   */
  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  /**
   * Get profile image URL from the backend image endpoint
   */
  getProfileImageUrl(employeeId: number): string {
    return `/api/v1/user/image/${employeeId}`;
  }

  /**
   * Handle profile image load error — fall back to initials
   */
  onProfileImageError(employeeId: number): void {
    this.brokenImages[employeeId] = true;
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'Active': 'badge bg-success',
      'Pending': 'badge bg-warning',
      'Inactive': 'badge bg-secondary',
      'On Leave': 'badge bg-info',
      'Terminated': 'badge bg-danger'
    };
    return statusClasses[status] || 'badge bg-secondary';
  }

  /**
   * Get total pages for pagination
   * Handles both response structures
   */
  getTotalPages(state: any): number {
    // Check legacy page structure
    if (state?.appData?.data?.page?.totalPages) {
      return state.appData.data.page.totalPages;
    }

    // For /search endpoint, calculate based on count (assuming 10 per page)
    if (state?.appData?.data?.count) {
      return Math.ceil(state.appData.data.count / 10);
    }

    return 0;
  }

  /**
   * Check if there are employees
   */
  hasEmployees(state: any): boolean {
    return this.getEmployees(state).length > 0;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get current user from local storage
   * Checks for 'user' key which contains the UserModel
   */
  private getCurrentUser(): any {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  }
}
