// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of, switchMap } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse, EmployeeState } from 'src/app/interface/appstates';
import { State } from 'src/app/interface/state';
import { EmployeeService } from '../../../service/employee.service';
import { NotificationService } from 'src/app/service/notification.service';
import { NgForm } from '@angular/forms';
import { EmployeeForm } from '../employee.model';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { UserService } from 'src/app/service/user.service';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

interface EmployeeDocument {
  id?: number;
  employeeId: number;
  documentType: string;
  documentName: string;
  documentUrl?: string;
  fileSize?: number;
  fileExtension?: string;
  description?: string;
  isVerified?: boolean;
  createdAt?: string;
}

@Component({
  standalone: false,
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDetailComponent implements OnInit {
  employeeState$: Observable<State<CustomHttpResponse<EmployeeState>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<EmployeeState>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  readonly DataState = DataState;
  private readonly EMPLOYEE_ID: string = 'id';

  // Flags for different modes
  isMyDetailsPage: boolean = false;
  isAdminView: boolean = false;
  currentUserId: number | null = null; // Store current user's ID for permission checks

  // Tab state
  activeTab: 'overview' | 'edit' | 'documents' | 'security' = 'overview';

  // Role management (admin only)
  availableRoles = [
    { value: 'ROLE_USER', label: 'User' },
    { value: 'ROLE_MANAGER', label: 'Manager' },
    { value: 'ROLE_ADMIN', label: 'Admin' },
    { value: 'ROLE_SYSADMIN', label: 'System Admin' }
  ];
  selectedRole: string = '';
  isChangingRole: boolean = false;

  // Password reset (admin)
  resetPasswordData = { newPassword: '', confirmPassword: '' };
  isResettingPassword: boolean = false;
  resetPasswordError: string = '';

  setTab(tab: 'overview' | 'edit' | 'documents' | 'security'): void {
    this.activeTab = tab;
  }

  // Server URL
  private readonly SERVER_URL = environment.apiUrl + '/api/v1';
  private readonly DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  // Document management
  documents: EmployeeDocument[] = [];
  selectedFile: File | null = null;
  selectedDocumentType: string = '';
  documentDescription: string = '';
  isUploadingDocument: boolean = false;
  uploadProgress: number = 0;

  // Document viewer
  viewingDoc: { doc: EmployeeDocument; safeSrc: SafeResourceUrl | SafeUrl | null; type: 'pdf' | 'image' | 'other' } | null = null;
  isVerifyingDocument: boolean = false;
  private viewerBlobUrl: string | null = null;

  documentTypes = [
    { value: 'CV', label: 'Curriculum Vitae (CV)' },
    { value: 'ID', label: 'Identity Document' },
    { value: 'WORK_PERMIT', label: 'Work Permit' },
    { value: 'QUALIFICATION', label: 'Qualification Certificates' },
    { value: 'OTHER', label: 'Other Documents' }
  ];

  // Departments and Designations for dropdowns
  departments: any[] = [];
  designations: any[] = [];

  // Employment types
  employmentTypes = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERN', label: 'Intern' }
  ];

  // Status options
  statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Terminated', label: 'Terminated' }
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private employeeService: EmployeeService,
    private userService: UserService,
    private notification: NotificationService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    // Check if this is the "My Details" page (route is /employee/my-details)
    const currentRoute = this.router.url;
    this.isMyDetailsPage = currentRoute.includes('/employee/my-details');

    // Load current user's ID for permission checks
    this.loadCurrentUserId();

    // Load departments and designations for dropdowns
    this.loadDepartments();
    this.loadDesignations();

    if (this.isMyDetailsPage) {
      // For "My Details" page, load employee based on logged-in user
      this.loadEmployeeFromCurrentUser();
    } else {
      // For regular employee detail page, get employee ID from route
      this.loadEmployeeFromRoute();
    }
  }

  /**
   * Load current user's ID for permission checks
   */
  private loadCurrentUserId(): void {
    this.userService.profile$().subscribe({
      next: (response: any) => {
        this.currentUserId = response?.data?.user?.id || null;
        const roleName: string = response?.data?.user?.roleName || '';
        // Set isAdminView based on the CURRENT USER's role, not the viewed employee's role
        if (!this.isMyDetailsPage) {
          this.isAdminView = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_MANAGER'].includes(roleName);
        }
        console.log('👤 Current user ID loaded:', this.currentUserId, '| Admin view:', this.isAdminView);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading current user:', error);
      }
    });
  }

  /**
   * Load departments for dropdown
   */
  loadDepartments(): void {
    this.http.get<any>(`${this.SERVER_URL}/departments/all`).subscribe({
      next: (response) => {
        this.departments = response.data?.departments || [];
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  /**
   * Load designations for dropdown
   */
  loadDesignations(): void {
    this.http.get<any>(`${this.SERVER_URL}/designations/list`).subscribe({
      next: (response) => {
        this.designations = response.data?.designations || [];
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading designations:', error);
      }
    });
  }

  /**
   * Load employee details for "My Details" page (based on logged-in user)
   * Uses /api/v1/employee/me endpoint - self-service, no special permissions needed
   */
  private loadEmployeeFromCurrentUser(): void {
    console.log('🔍 Loading employee details for current user via /me endpoint');

    // Use the self-service /me endpoint directly - no permission issues
    this.employeeState$ = this.employeeService.getMyProfile$().pipe(
      map(response => {
        console.log('✅ My profile data loaded:', response);
        this.notification.onDefault(response.message);
        this.dataSubject.next(response);

        // Check if user has admin role to determine view mode
        // The /me endpoint returns UserDTO which has roleName
        const employee = response.data?.employee as any;
        if (employee) {
          const roleName = employee.roleName || '';
          this.isAdminView = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_MANAGER'].includes(roleName);

          // Load documents for this employee
          if (employee.id) {
            this.loadDocuments(employee.id);
          }
        }

        return { dataState: DataState.LOADED, appData: response };
      }),
      startWith({ dataState: DataState.LOADING }),
      catchError((error: string) => {
        console.error('❌ Error loading my profile:', error);
        this.notification.onError(error);
        return of({ dataState: DataState.ERROR, error });
      })
    );
  }

  /**
   * Load employee details from route parameter (regular employee detail page)
   */
  private loadEmployeeFromRoute(): void {
    console.log('🔍 Loading employee details from route');

    this.employeeState$ = this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const idParam = params.get(this.EMPLOYEE_ID);
        console.log('🔍 Route parameter received:', idParam);

        // Validate the ID parameter
        if (!idParam || idParam === 'null' || idParam === 'undefined' || idParam === 'NaN') {
          console.error('❌ Invalid or missing ID parameter:', idParam);
          this.notification.onError('Invalid employee ID. Redirecting to employees list.');
          this.router.navigate(['/employee']);
          return of({ dataState: DataState.ERROR, error: 'Invalid employee ID' });
        }

        const employeeId = Number(idParam);
        if (isNaN(employeeId) || employeeId <= 0) {
          console.error('❌ ID is not a valid number:', idParam, 'Converted to:', employeeId);
          this.notification.onError('Invalid employee ID. Redirecting to employees list.');
          this.router.navigate(['/employee']);
          return of({ dataState: DataState.ERROR, error: 'Invalid employee ID' });
        }

        console.log('✅ Valid employee ID:', employeeId);

        // Load documents for this employee
        this.loadDocuments(employeeId);

        // Load employee details
        return this.employeeService.employee$(employeeId)
          .pipe(
            map(response => {
              console.log('✅ Employee data loaded:', response);
              this.notification.onDefault(response.message);
              this.dataSubject.next(response);
              return { dataState: DataState.LOADED, appData: response };
            }),
            startWith({ dataState: DataState.LOADING }),
            catchError((error: string) => {
              console.error('❌ Error loading employee:', error);
              this.notification.onError(error);
              return of({ dataState: DataState.ERROR, error });
            })
          );
      })
    );
  }

  /**
   * Update employee details - UPDATED for different modes
   * Admin can update all fields including employeeId, department, designation, salary, status
   */
  updateEmployee(employeeForm: NgForm): void {
    this.isLoadingSubject.next(true);

    const currentEmployee = this.dataSubject.value.data.employee;

    // Build employee data - include all fields from form
    const employeeData: EmployeeForm = {
      id: currentEmployee.id,
      // Admin-editable fields
      employeeId: employeeForm.value.employeeId || currentEmployee.employeeId,
      firstName: employeeForm.value.firstName,
      lastName: employeeForm.value.lastName,
      email: employeeForm.value.email,
      phone: employeeForm.value.phone || null,
      dateOfBirth: employeeForm.value.dateOfBirth || null,
      gender: employeeForm.value.gender || null,
      // Employment info - admin can edit
      hireDate: employeeForm.value.hireDate || currentEmployee.hireDate,
      departmentId: employeeForm.value.departmentId || currentEmployee.departmentId || null,
      designationId: employeeForm.value.designationId || currentEmployee.designationId || null,
      designationTitle: currentEmployee.designationTitle || null,
      baseSalary: employeeForm.value.baseSalary || currentEmployee.baseSalary || 0,
      employmentType: employeeForm.value.employmentType || currentEmployee.employmentType || null,
      status: employeeForm.value.status || currentEmployee.status || 'Active',
      // Address info
      address: employeeForm.value.address || null,
      city: employeeForm.value.city || null,
      state: employeeForm.value.state || null,
      country: employeeForm.value.country || 'South Africa',
      postalCode: employeeForm.value.postalCode || null,
      // Emergency contact
      emergencyContactName: employeeForm.value.emergencyContactName || null,
      emergencyContactPhone: employeeForm.value.emergencyContactPhone || null,
      bio: employeeForm.value.bio || null,
      // Banking info
      bankName: employeeForm.value.bankName || currentEmployee.bankName || null,
      bankAccountNumber: employeeForm.value.bankAccountNumber || currentEmployee.bankAccountNumber || null,
      accountHolderName: employeeForm.value.accountHolderName || currentEmployee.accountHolderName || null,
      branchCode: employeeForm.value.branchCode || currentEmployee.branchCode || null,
      accountType: employeeForm.value.accountType || currentEmployee.accountType || null
    };

    console.log('📝 Updating employee with data:', employeeData);

    this.employeeState$ = this.employeeService.update$(employeeData)
      .pipe(
        map(response => {
          this.dataSubject.next(response);
          this.isLoadingSubject.next(false);
          this.notification.onSuccess(response.message || 'Employee updated successfully');
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({
          dataState: DataState.LOADED,
          appData: this.dataSubject.value
        }),
        catchError((error: string) => {
          this.isLoadingSubject.next(false);
          this.notification.onError(error);
          return of({
            dataState: DataState.LOADED,
            appData: this.dataSubject.value,
            error
          });
        })
      );
  }

  /**
   * Update current user's own details (for "My Details" page)
   * Requires id, firstName, lastName, email in the request body
   */
  updateMyDetails(employeeForm: NgForm): void {
    const currentEmployee = this.dataSubject.value?.data?.employee;

    if (!currentEmployee || !currentEmployee.id) {
      this.notification.onError('Employee data not loaded. Please refresh the page.');
      return;
    }

    this.isLoadingSubject.next(true);

    // Build form data with required fields from current employee if not in form
    const formData = {
      // Required fields - use form value or fallback to current employee data
      id: currentEmployee.id,
      firstName: employeeForm.value.firstName || currentEmployee.firstName,
      lastName: employeeForm.value.lastName || currentEmployee.lastName,
      email: employeeForm.value.email || currentEmployee.email,
      // Optional fields
      phone: employeeForm.value.phone || currentEmployee.phone || null,
      dateOfBirth: employeeForm.value.dateOfBirth || currentEmployee.dateOfBirth || null,
      gender: employeeForm.value.gender || currentEmployee.gender || null,
      address: employeeForm.value.address || currentEmployee.address || null,
      city: employeeForm.value.city || currentEmployee.city || null,
      state: employeeForm.value.state || currentEmployee.state || null,
      country: employeeForm.value.country || currentEmployee.country || 'South Africa',
      postalCode: employeeForm.value.postalCode || currentEmployee.postalCode || null,
      emergencyContactName: employeeForm.value.emergencyContactName || currentEmployee.emergencyContactName || null,
      emergencyContactPhone: employeeForm.value.emergencyContactPhone || currentEmployee.emergencyContactPhone || null,
      bio: employeeForm.value.bio || currentEmployee.bio || null
    };

    console.log('📝 Updating my details with data:', formData);

    // Use the API endpoint for updating current user's details
    this.http.put(`${this.SERVER_URL}/employee/me/update`, formData)
      .subscribe({
        next: (response: any) => {
          this.isLoadingSubject.next(false);
          this.notification.onSuccess(response.message || 'Your details have been updated');

          // Reload the employee data
          if (this.isMyDetailsPage) {
            this.loadEmployeeFromCurrentUser();
          } else {
            this.ngOnInit();
          }
        },
        error: (error) => {
          this.isLoadingSubject.next(false);
          const errorMsg = error.error?.message || error.error?.reason || 'Failed to update details';
          console.error('❌ Update error:', error);
          this.notification.onError(errorMsg);
        }
      });
  }

  updatePhoto(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.isLoadingSubject.next(true);
      this.employeeService.uploadPhoto$(this.dataSubject.value.data.employee.id, file)
        .subscribe({
          next: (response) => {
            this.notification.onDefault(response.message);
            this.ngOnInit();
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            this.notification.onError(error);
            this.isLoadingSubject.next(false);
          }
        });
    }
  }

  deleteEmployee(): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.isLoadingSubject.next(true);
      this.employeeService.deleteEmployee$(this.dataSubject.value.data.employee.id)
        .subscribe({
          next: (response) => {
            this.notification.onDefault(response.message);
            this.router.navigate(['/employee']);
            this.isLoadingSubject.next(false);
          },
          error: (error) => {
            this.notification.onError(error);
            this.isLoadingSubject.next(false);
          }
        });
    }
  }

  // ========== PASSWORD RESET ==========

  submitResetPassword(): void {
    this.resetPasswordError = '';

    if (!this.resetPasswordData.newPassword) {
      this.resetPasswordError = 'New password is required.';
      return;
    }
    if (this.resetPasswordData.newPassword.length < 8) {
      this.resetPasswordError = 'Password must be at least 8 characters.';
      return;
    }
    if (this.resetPasswordData.newPassword !== this.resetPasswordData.confirmPassword) {
      this.resetPasswordError = 'Passwords do not match.';
      return;
    }

    const employeeId = this.dataSubject.value?.data?.employee?.id;
    if (!employeeId) return;

    this.isResettingPassword = true;

    this.http.put(`${this.SERVER_URL}/employee/${employeeId}/reset-password`, {
      newPassword: this.resetPasswordData.newPassword,
      confirmPassword: this.resetPasswordData.confirmPassword
    }).subscribe({
      next: () => {
        this.isResettingPassword = false;
        this.resetPasswordData = { newPassword: '', confirmPassword: '' };
        this.notification.onSuccess('Password reset successfully');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isResettingPassword = false;
        this.resetPasswordError = err?.error?.message || 'Failed to reset password.';
        this.cdr.markForCheck();
      }
    });
  }

  // ========== DOCUMENT MANAGEMENT ==========

  loadDocuments(employeeId: number): void {
    if (!employeeId || isNaN(employeeId) || employeeId <= 0) {
      console.error('❌ Invalid employee ID for documents:', employeeId);
      return;
    }

    // Use self-service endpoint for "My Details" page
    const documentsUrl = this.isMyDetailsPage
      ? `${this.SERVER_URL}/employee/me/documents`
      : `${this.SERVER_URL}/employee/${employeeId}/documents`;

    console.log('📄 Loading documents for employee:', employeeId, 'URL:', documentsUrl);

    this.http.get<any>(documentsUrl)
      .pipe(
        catchError((error) => {
          console.error('❌ Error loading documents:', error);
          return of({ data: { documents: [] } });
        })
      )
      .subscribe(response => {
        console.log('✅ Documents loaded:', response);
        this.documents = response.data?.documents || [];
        this.cdr.markForCheck();
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.notification.onError('File size must be less than 10MB');
        event.target.value = '';
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];

      if (!allowedTypes.includes(file.type)) {
        this.notification.onError('Only PDF, Word, and Image files are allowed');
        event.target.value = '';
        return;
      }

      this.selectedFile = file;
      console.log('📎 File selected:', file.name);
      this.cdr.markForCheck();
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      this.notification.onError('Please select a file to upload');
      return;
    }

    if (!this.selectedDocumentType) {
      this.notification.onError('Please select a document type');
      return;
    }

    const employeeId = this.dataSubject.value?.data?.employee?.id;

    if (!employeeId || isNaN(employeeId) || employeeId <= 0) {
      console.error('❌ Invalid employee ID for document upload:', employeeId);
      this.notification.onError('Invalid employee ID');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('documentType', this.selectedDocumentType);
    if (this.documentDescription) {
      formData.append('description', this.documentDescription);
    }

    this.isUploadingDocument = true;
    this.uploadProgress = 0;

    // Use self-service endpoint if viewing own profile (either via My Details page or own employee detail)
    const isOwnProfile = this.isMyDetailsPage || (this.currentUserId && this.currentUserId === employeeId);
    const uploadUrl = isOwnProfile
      ? `${this.SERVER_URL}/employee/me/documents/upload`
      : `${this.SERVER_URL}/employee/${employeeId}/documents/upload`;

    console.log('📤 Uploading document for employee:', employeeId, 'Own profile:', isOwnProfile, 'URL:', uploadUrl);

    this.http.post(uploadUrl, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          console.log(`Upload progress: ${this.uploadProgress}%`);
        } else if (event.type === HttpEventType.Response) {
          console.log('✅ Upload complete:', event.body);
          this.isUploadingDocument = false;
          this.selectedFile = null;
          this.selectedDocumentType = '';
          this.documentDescription = '';
          this.uploadProgress = 0;
          this.notification.onDefault('Document uploaded successfully');
          this.loadDocuments(employeeId);
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Upload error:', error);
        this.isUploadingDocument = false;
        this.uploadProgress = 0;

        let errorMessage = 'Failed to upload document';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        this.notification.onError(errorMessage);
        this.cdr.markForCheck();
      }
    });
  }

  deleteDocument(documentId: number): void {
    if (confirm('Are you sure you want to delete this document?')) {
      const employeeId = this.dataSubject.value?.data?.employee?.id;
      // Use self-service endpoint if viewing own profile
      const isOwnProfile = this.isMyDetailsPage || (this.currentUserId && this.currentUserId === employeeId);
      const deleteUrl = isOwnProfile
        ? `${this.SERVER_URL}/employee/me/documents/${documentId}`
        : `${this.SERVER_URL}/employee/documents/${documentId}`;

      console.log('🗑️ Deleting document:', documentId, 'Own profile:', isOwnProfile, 'URL:', deleteUrl);

      this.http.delete(deleteUrl).subscribe({
        next: (response: any) => {
          console.log('✅ Document deleted:', response);
          this.notification.onDefault('Document deleted successfully');
          const employeeId = this.dataSubject.value?.data?.employee?.id;
          if (employeeId) {
            this.loadDocuments(employeeId);
          }
        },
        error: (error) => {
          console.error('❌ Delete error:', error);

          let errorMessage = 'Failed to delete document';
          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          this.notification.onError(errorMessage);
        }
      });
    }
  }

  downloadDocument(documentId: number, documentName?: string): void {
    if (!documentId) {
      this.notification.onError('Document ID not available');
      return;
    }
    this.employeeService.downloadDocumentById$(documentId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documentName || `document-${documentId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notification.onError('Failed to download document. Please try again.')
    });
  }

  viewDocument(doc: EmployeeDocument): void {
    this.employeeService.downloadDocumentById$(doc.id!).subscribe({
      next: (blob: Blob) => {
        if (this.viewerBlobUrl) {
          window.URL.revokeObjectURL(this.viewerBlobUrl);
        }
        this.viewerBlobUrl = window.URL.createObjectURL(blob);
        const ext = (doc.fileExtension || '').toLowerCase();
        let type: 'pdf' | 'image' | 'other' = 'other';
        let safeSrc: SafeResourceUrl | SafeUrl | null = null;

        if (ext === '.pdf') {
          type = 'pdf';
          safeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(this.viewerBlobUrl);
        } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
          type = 'image';
          safeSrc = this.sanitizer.bypassSecurityTrustUrl(this.viewerBlobUrl);
        }

        this.viewingDoc = { doc, safeSrc, type };
        this.cdr.markForCheck();
      },
      error: () => this.notification.onError('Failed to load document for viewing')
    });
  }

  closeDocumentViewer(): void {
    if (this.viewerBlobUrl) {
      window.URL.revokeObjectURL(this.viewerBlobUrl);
      this.viewerBlobUrl = null;
    }
    this.viewingDoc = null;
    this.cdr.markForCheck();
  }

  verifyDocument(documentId: number): void {
    this.isVerifyingDocument = true;
    this.http.put(`${this.SERVER_URL}/employee/documents/${documentId}/verify`, {}).subscribe({
      next: (response: any) => {
        this.notification.onSuccess(response.message || 'Document verified successfully');
        this.isVerifyingDocument = false;
        if (this.viewingDoc) {
          this.viewingDoc.doc.isVerified = true;
        }
        const employeeId = this.dataSubject.value?.data?.employee?.id;
        if (employeeId) this.loadDocuments(employeeId);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isVerifyingDocument = false;
        this.notification.onError(err?.error?.message || err?.error?.reason || 'Failed to verify document');
        this.cdr.markForCheck();
      }
    });
  }

  getDocumentIcon(fileExtension: string): string {
    if (!fileExtension) return 'bi-file-earmark';
    const ext = fileExtension.toLowerCase();
    if (ext === '.pdf') return 'bi-file-pdf';
    if (['.doc', '.docx'].includes(ext)) return 'bi-file-word';
    if (['.jpg', '.jpeg', '.png'].includes(ext)) return 'bi-file-image';
    return 'bi-file-earmark';
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  /**
   * Navigate back based on context
   */
  goBack(): void {
    this.router.navigate(['/employee']);
  }

  /**
   * Change user role (admin only) — calls PATCH /api/v1/user/admin/update-role
   */
  changeUserRole(userId: number): void {
    if (!this.selectedRole) {
      this.notification.onError('Please select a role');
      return;
    }
    this.isChangingRole = true;
    this.userService.updateUserRoleAsAdmin$(userId, this.selectedRole).subscribe({
      next: (response: any) => {
        this.isChangingRole = false;
        this.notification.onSuccess(response.message || 'Role updated successfully');
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.isChangingRole = false;
        this.notification.onError(error?.error?.reason || error?.error?.message || 'Failed to update role');
        this.cdr.markForCheck();
      }
    });
  }

  onDesignationChange(event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const employee = this.dataSubject.value?.data?.employee;
    if (employee) {
      employee.designationTitle = selectedOption?.text?.trim() || '';
    }
  }

  /**
   * Check if field should be read-only for regular employees
   */
  isReadOnly(field: string): boolean {
    // For "My Details" page, employees can only edit personal info, not employment info
    if (this.isMyDetailsPage && !this.isAdminView) {
      const readOnlyFields = [
        'departmentId', 'designationId', 'designationTitle',
        'baseSalary', 'employmentType', 'status', 'hireDate'
      ];
      return readOnlyFields.includes(field);
    }
    return false;
  }

  /**
   * Get profile image URL - from database endpoint or default avatar
   */
  getProfileImageUrl(employeeId: number): string {
    if (!employeeId) {
      return this.DEFAULT_AVATAR;
    }
    return `${this.SERVER_URL}/user/image/${employeeId}`;
  }

  /**
   * Handle profile image error - fall back to default avatar
   */
  onProfileImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.DEFAULT_AVATAR) {
      img.src = this.DEFAULT_AVATAR;
    }
  }
}
