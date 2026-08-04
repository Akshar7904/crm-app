// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { environment } from '@env/environment';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { EventType } from 'src/app/enum/event-type.enum';
import { CustomHttpResponse, Profile } from 'src/app/interface/appstates';
import { State } from 'src/app/interface/state';
import { UserService } from 'src/app/service/user.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { NotificationService } from 'src/app/service/notification.service';
import { KioskService } from '../../kiosk/kiosk.service';
import { NgForm } from '@angular/forms';
import { UserModel } from '../user.model';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { ThemeTokens, suggestTextColor, BrandingService, DEFAULT_THEME } from 'src/app/service/branding.service';

/**
 * User Component - Self-Service Profile Management
 *
 * UPDATED: Now uses BOTH userService and employeeService
 * - userService.profile$() for initial profile load (includes user + employee data)
 * - employeeService.updateMyProfile$() for profile updates via /api/v1/employee/me/update
 * - employeeService document endpoints for document management
 *
 * Features:
 * - View/edit own profile
 * - Profile completion tracking
 * - Photo upload
 * - Document management
 * - Status auto-change (Pending → Active when complete)
 *
 * Company: Silver Spectrum Solutions (PTY) LTD
 */
@Component({
  standalone: false,
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserComponent implements OnInit {
  profileState$: Observable<State<CustomHttpResponse<Profile>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<Profile>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private fileStatusSubject = new BehaviorSubject<{ status: string, percent: number }>({ status: '', percent: 0 });
  fileStatus$ = this.fileStatusSubject.asObservable();
  readonly DataState = DataState;
  readonly EventType = EventType;

  // Profile completion tracking
  isProfileComplete = false;
  profileCompletionPercentage = 0;
  missingFields: string[] = [];

  // Departments and designations for admin dropdowns
  departments: any[] = [];
  designations: any[] = [];

  // Document management
  private documentsSubject = new BehaviorSubject<any[]>([]);
  documents$ = this.documentsSubject.asObservable();
  private documentCountSubject = new BehaviorSubject<number>(0);
  documentCount$ = this.documentCountSubject.asObservable();

  // Activity logs toggle
  private showLogsSubject = new BehaviorSubject<boolean>(false);
  showLogs$ = this.showLogsSubject.asObservable();

  // Theme personalization
  personalTheme: ThemeTokens = {};
  savingTheme = false;

  // MFA setup state
  mfaSetupMode = false;
  mfaDisableMode = false;
  savingKioskPin = false;
  mfaSetupData: { secret: string; qrCodeDataUri: string; issuer: string; email: string } | null = null;
  mfaCode = '';

  // Profile image URL (from database or default)
  private readonly DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  private readonly SERVER_URL = environment.apiUrl + '/api/v1/user';

  // Cache for profile image URLs to prevent repeated requests
  private imageUrlCache: Map<number, string> = new Map();

  // Document types for dropdown
  documentTypes = [
    { value: 'ID_DOCUMENT', label: 'ID Document / Passport' },
    { value: 'PROOF_OF_ADDRESS', label: 'Proof of Address' },
    { value: 'BANK_CONFIRMATION', label: 'Bank Confirmation Letter' },
    { value: 'TAX_CERTIFICATE', label: 'Tax Certificate' },
    { value: 'QUALIFICATION', label: 'Qualification / Certificate' },
    { value: 'CONTRACT', label: 'Employment Contract' },
    { value: 'OTHER', label: 'Other Document' }
  ];

  // South African bank universal branch codes
  bankBranchCodes: { [key: string]: string } = {
    'ABSA': '632005',
    'Standard Bank': '051001',
    'FNB': '250655',
    'Nedbank': '198765',
    'Capitec': '470010',
    'TymeBank': '678910',
    'Discovery Bank': '679000',
    'African Bank': '430000'
  };

  // Track selected branch code for auto-fill
  selectedBranchCode: string = '';

  constructor(
    private router: Router,
    private userService: UserService,
    private employeeService: EmployeeService,
    private notification: NotificationService,
    private kioskService: KioskService,
    private branding: BrandingService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('✅ UserComponent initialized - Loading profile');
    this.loadProfile();
    this.loadDropdownData();
    this.loadMyDocuments();
    this.personalTheme = { ...this.branding.personalTheme };
  }

  /**
   * Load user profile using userService.profile$()
   * This returns user data including employee fields
   */
  loadProfile(): void {
    this.profileState$ = this.userService.profile$()
      .pipe(
        map(response => {
          console.log('✅ Profile loaded:', response);
          console.log('🏦 Banking data:', {
            bankName: response?.data?.user?.bankName,
            bankAccountNumber: response?.data?.user?.bankAccountNumber,
            accountHolderName: response?.data?.user?.accountHolderName,
            branchCode: response?.data?.user?.branchCode,
            accountType: response?.data?.user?.accountType
          });
          this.dataSubject.next(response);
          this.checkProfileCompletion(response.data.user);
          this.notification.onDefault(response.message);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          console.error('❌ Error loading profile:', error);
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  /**
   * Load departments and designations for admin dropdowns
   */
  loadDropdownData(): void {
    this.employeeService.departments$().subscribe({
      next: (response) => {
        this.departments = response?.data?.departments || [];
        this.cdr.markForCheck();
      },
      error: () => { /* Non-critical - dropdowns just won't populate */ }
    });
    this.employeeService.designations$().subscribe({
      next: (response) => {
        this.designations = response?.data?.designations || [];
        this.cdr.markForCheck();
      },
      error: () => { /* Non-critical */ }
    });
  }

  /**
   * Check if profile is complete
   * Required fields: dateOfBirth, gender, departmentId, designationId, baseSalary
   */
  checkProfileCompletion(user: UserModel): void {
    if (!user) {
      this.isProfileComplete = false;
      this.profileCompletionPercentage = 0;
      return;
    }

    const requiredFields = [
      { field: user.dateOfBirth, label: 'Date of Birth' },
      { field: user.gender, label: 'Gender' },
      { field: user.departmentId, label: 'Department' },
      { field: user.designationId, label: 'Designation' },
      { field: user.baseSalary, label: 'Base Salary' }
    ];

    const missing: string[] = [];
    let completed = 0;

    requiredFields.forEach(({ field, label }) => {
      if (field) {
        completed++;
      } else {
        missing.push(label);
      }
    });

    this.isProfileComplete = missing.length === 0;
    this.profileCompletionPercentage = Math.round((completed / requiredFields.length) * 100);
    this.missingFields = missing;

    console.log(`📊 Profile Completion: ${this.profileCompletionPercentage}% - Missing:`, missing);
  }

  /**
   * Update profile using NEW employeeService.updateMyProfile$()
   * This uses the /api/v1/employee/me/update endpoint
   *
   * IMPORTANT: Backend requires id, firstName, lastName, email
   * We merge form values with current user data to ensure all required fields are present
   */
  updateProfileInfo(profileForm: NgForm): void {
    const currentUser = this.dataSubject.value?.data?.user;

    if (!currentUser || !currentUser.id) {
      this.notification.onError('User data not loaded. Please refresh the page.');
      return;
    }

    // Clean phone number - remove + and country code, keep only digits
    let cleanPhone = profileForm.value.phone || currentUser.phone || '';
    if (cleanPhone) {
      // Remove all non-digit characters
      cleanPhone = cleanPhone.replace(/\D/g, '');
      // If starts with country code (27 for SA), remove it
      if (cleanPhone.startsWith('27') && cleanPhone.length > 10) {
        cleanPhone = cleanPhone.substring(2);
      }
      // Ensure it's exactly 10 digits (or empty)
      if (cleanPhone.length !== 10 && cleanPhone.length > 0) {
        cleanPhone = cleanPhone.slice(-10); // Take last 10 digits
      }
    }

    // Merge form values with current user data to ensure required fields are present
    // IMPORTANT: Spread currentUser FIRST to preserve admin-set fields (departmentId,
    // designationId, baseSalary, status, employeeId, hireDate) that are disabled/read-only
    // in the form and therefore NOT included in profileForm.value
    const updateData = {
      ...currentUser,
      ...profileForm.value,
      id: currentUser.id,
      firstName: profileForm.value.firstName || currentUser.firstName,
      lastName: profileForm.value.lastName || currentUser.lastName,
      email: profileForm.value.email || currentUser.email,
      phone: cleanPhone || null
    };

    console.log('💾 Updating profile via /api/v1/employee/me/update:', updateData);

    this.isLoadingSubject.next(true);

    this.employeeService.updateMyProfile$(updateData).subscribe({
      next: (response) => {
        console.log('✅ Profile updated successfully via /me/update endpoint:', response);
        this.isLoadingSubject.next(false);

        // Update the data subject with new employee data
        const updatedProfileData: Profile = {
          user: {
            ...this.dataSubject.value.data.user,
            ...response.data.employee
          } as UserModel,
          // Preserve events and roles
          events: this.dataSubject.value?.data?.events,
          roles: this.dataSubject.value?.data?.roles
        };

        const updatedResponse: CustomHttpResponse<Profile> = {
          ...this.dataSubject.value,
          data: updatedProfileData,
          message: response.message
        };

        this.dataSubject.next(updatedResponse);

        // Update the observable state
        this.profileState$ = of({ dataState: DataState.LOADED, appData: updatedResponse });

        this.checkProfileCompletion(updatedProfileData.user);

        // Check if status changed to Active
        if (response.data.employee?.status === 'Active' && this.isProfileComplete) {
          this.notification.onSuccess('Profile completed! Your status is now Active.');
        } else {
          this.notification.onSuccess(response.message || 'Profile updated successfully');
        }

        // Force change detection
        this.cdr.markForCheck();
      },
      error: (error: string) => {
        console.error('❌ Error updating profile:', error);
        this.isLoadingSubject.next(false);
        this.notification.onError(error || 'Failed to update profile');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Update user settings (uses existing userService)
   */
  updateUserSettings(settingsForm: NgForm): void {
    console.log('⚙️ Updating user settings:', settingsForm.value);

    this.isLoadingSubject.next(true);

    this.userService.update$(settingsForm.value).subscribe({
      next: (response) => {
        console.log('✅ Settings updated successfully:', response);
        this.dataSubject.next(response);
        this.isLoadingSubject.next(false);
        this.profileState$ = of({ dataState: DataState.LOADED, appData: response });
        this.notification.onSuccess(response.message || 'Settings updated successfully');
        this.cdr.markForCheck();
      },
      error: (error: string) => {
        console.error('❌ Error updating settings:', error);
        this.isLoadingSubject.next(false);
        this.notification.onError(error || 'Failed to update settings');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Update password (uses existing userService)
   */
  updatePassword(passwordForm: NgForm): void {
    if (passwordForm.value.newPassword !== passwordForm.value.confirmNewPassword) {
      passwordForm.reset();
      this.notification.onError('Passwords do not match. Please try again.');
      return;
    }

    console.log('🔒 Updating password');

    this.isLoadingSubject.next(true);

    this.userService.updatePassword$(passwordForm.value).subscribe({
      next: (response) => {
        console.log('✅ Password updated successfully');
        this.dataSubject.next(response);
        this.isLoadingSubject.next(false);
        passwordForm.reset();
        this.profileState$ = of({ dataState: DataState.LOADED, appData: response });
        this.notification.onSuccess(response.message || 'Password updated successfully');
        this.cdr.markForCheck();
      },
      error: (error: string) => {
        console.error('❌ Error updating password:', error);
        passwordForm.reset();
        this.isLoadingSubject.next(false);
        this.notification.onError(error || 'Failed to update password');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Update role (Admin only - uses existing userService)
   */
  updateRole(roleForm: NgForm): void {
    console.log('👤 Updating user role:', roleForm.value);

    this.isLoadingSubject.next(true);

    this.userService.updateRoles$(roleForm.value.roleName).subscribe({
      next: (response) => {
        console.log('✅ Role updated successfully:', response);
        this.dataSubject.next(response);
        this.isLoadingSubject.next(false);
        this.profileState$ = of({ dataState: DataState.LOADED, appData: response });
        this.notification.onSuccess(response.message || 'Role updated successfully');
        this.cdr.markForCheck();
      },
      error: (error: string) => {
        console.error('❌ Error updating role:', error);
        this.isLoadingSubject.next(false);
        this.notification.onError(error || 'Failed to update role');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Update account settings (MFA, locked status - uses existing userService)
   */
  updateAccountSettings(settingsForm: NgForm): void {
    console.log('🔐 Updating account settings:', settingsForm.value);

    this.isLoadingSubject.next(true);

    this.userService.updateAccountSettings$(settingsForm.value).subscribe({
      next: (response) => {
        console.log('✅ Account settings updated successfully:', response);
        this.dataSubject.next(response);
        this.isLoadingSubject.next(false);
        this.profileState$ = of({ dataState: DataState.LOADED, appData: response });
        this.notification.onSuccess(response.message || 'Account settings updated successfully');
        this.cdr.markForCheck();
      },
      error: (error: string) => {
        console.error('❌ Error updating account settings:', error);
        this.isLoadingSubject.next(false);
        this.notification.onError(error || 'Failed to update account settings');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Update profile photo (uses existing userService)
   * Image is stored in database and served via /api/v1/user/image/{userId}
   */
  updatePicture(image: File): void {
    if (!image) {
      return;
    }

    console.log('📸 Uploading profile photo:', image.name);

    this.isLoadingSubject.next(true);

    this.userService.updateImage$(this.getFormData(image)).subscribe({
      next: (response) => {
        console.log('✅ Photo uploaded successfully (stored in database):', response);
        // Clear image cache to force refresh with new image
        const userId = this.dataSubject.value?.data?.user?.id;
        if (userId) {
          this.clearImageCache(userId);
        }
        // Update the data subject - the image will be fetched fresh from database
        this.dataSubject.next(response);
        this.isLoadingSubject.next(false);
        this.profileState$ = of({ dataState: DataState.LOADED, appData: response });
        this.notification.onSuccess(response.message || 'Profile picture updated successfully');
        this.cdr.markForCheck();
      },
      error: (error: string) => {
        console.error('❌ Error uploading photo:', error);
        this.isLoadingSubject.next(false);
        this.notification.onError(error || 'Failed to upload profile picture');
        this.cdr.markForCheck();
      }
    });
  }

  /** Start MFA setup — load QR code from backend */
  setupMfa(): void {
    this.isLoadingSubject.next(true);
    this.userService.setupMfa$().subscribe({
      next: (response) => {
        this.mfaSetupData = {
          qrCodeDataUri: (response.data as any)?.['qrCodeDataUri'] || '',
          secret: (response.data as any)?.['secret'] || '',
          issuer: (response.data as any)?.['issuer'] || '',
          email: ''
        };
        this.mfaSetupMode = true;
        this.mfaCode = '';
        this.isLoadingSubject.next(false);
        this.cdr.markForCheck();
      },
      error: (error: string) => {
        this.isLoadingSubject.next(false);
        this.notification.onError(error || 'Failed to load MFA setup');
        this.cdr.markForCheck();
      }
    });
  }

  /** Confirm MFA setup with the user-entered TOTP code */
  enableMfa(): void {
    if (!this.mfaCode || this.mfaCode.length !== 6) {
      this.notification.onError('Please enter the 6-digit code from your authenticator app');
      return;
    }
    this.isLoadingSubject.next(true);
    this.userService.enableMfa$(this.mfaCode).subscribe({
      next: (response) => {
        this.dataSubject.next(response);
        this.profileState$ = of({ dataState: DataState.LOADED, appData: response });
        this.mfaSetupMode = false;
        this.mfaSetupData = null;
        this.mfaCode = '';
        this.isLoadingSubject.next(false);
        this.notification.onSuccess(response.message || 'MFA enabled successfully');
        this.cdr.markForCheck();
      },
      error: (error: string) => {
        this.isLoadingSubject.next(false);
        this.notification.onError(error || 'Invalid code — please try again');
        this.cdr.markForCheck();
      }
    });
  }

  /** Disable MFA after verifying the current TOTP code */
  disableMfa(): void {
    if (!this.mfaCode || this.mfaCode.length !== 6) {
      this.notification.onError('Please enter the 6-digit code from your authenticator app');
      return;
    }
    this.isLoadingSubject.next(true);
    this.userService.disableMfa$(this.mfaCode).subscribe({
      next: (response) => {
        this.dataSubject.next(response);
        this.profileState$ = of({ dataState: DataState.LOADED, appData: response });
        this.mfaDisableMode = false;
        this.mfaCode = '';
        this.isLoadingSubject.next(false);
        this.notification.onSuccess(response.message || 'MFA disabled successfully');
        this.cdr.markForCheck();
      },
      error: (error: string) => {
        this.isLoadingSubject.next(false);
        this.notification.onError(error || 'Invalid code — please try again');
        this.cdr.markForCheck();
      }
    });
  }

  cancelMfaSetup(): void {
    this.mfaSetupMode = false;
    this.mfaDisableMode = false;
    this.mfaSetupData = null;
    this.mfaCode = '';
    this.cdr.markForCheck();
  }

  /**
   * Get form data for file upload
   */
  private getFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('image', file);
    return formData;
  }

  /**
   * Navigate to specific tab (called from template)
   */
  goToTab(tabName: string): void {
    console.log('🔀 Navigating to tab:', tabName);
    // Tab navigation is handled by template's tab system
  }

  /**
   * Alias for updateProfileInfo (used in template)
   */
  updateProfile(profileForm: NgForm): void {
    this.updateProfileInfo(profileForm);
  }

  /**
   * Update employee details (uses employeeService)
   */
  updateEmployeeDetails(employeeForm: NgForm): void {
    console.log('💼 Updating employee details:', employeeForm.value);
    this.updateProfileInfo(employeeForm);
  }

  /**
   * Update banking details (uses employeeService)
   */
  updateBankingDetails(bankingForm: NgForm): void {
    console.log('🏦 Updating banking details:', bankingForm.value);
    this.updateProfileInfo(bankingForm);
  }

  /**
   * Handle bank selection change - auto-fill branch code
   */
  onBankChange(bankName: string, form: NgForm): void {
    console.log('🏦 Bank selected:', bankName);

    const branchCode = this.bankBranchCodes[bankName];
    if (branchCode) {
      this.selectedBranchCode = branchCode;
      // Update the form control
      if (form && form.controls['branchCode']) {
        form.controls['branchCode'].setValue(branchCode);
      }
      console.log('✅ Branch code auto-filled:', branchCode);
    } else {
      this.selectedBranchCode = '';
      console.log('⚠️ No branch code found for bank:', bankName);
    }
  }

  /**
   * Get branch code for a bank
   */
  getBranchCode(bankName: string): string {
    return this.bankBranchCodes[bankName] || '';
  }

  /**
   * Toggle activity logs visibility
   */
  toggleLogs(): void {
    this.showLogsSubject.next(!this.showLogsSubject.value);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'Active':     'up-status-badge up-status-active',
      'Pending':    'up-status-badge up-status-pending',
      'Inactive':   'up-status-badge up-status-inactive',
      'On Leave':   'up-status-badge up-status-on-leave',
      'Terminated': 'up-status-badge up-status-terminated'
    };
    return statusClasses[status] || 'up-status-badge up-status-inactive';
  }

  // ==================== DOCUMENT MANAGEMENT ====================

  /**
   * Load user's documents
   */
  loadMyDocuments(): void {
    console.log('📄 Loading my documents');
    this.employeeService.getMyDocuments$().subscribe({
      next: (response) => {
        console.log('✅ Documents loaded:', response);
        this.documentsSubject.next(response.data.documents || []);
        this.documentCountSubject.next(response.data.count || 0);
      },
      error: (error) => {
        console.error('❌ Error loading documents:', error);
        this.notification.onError(error);
      }
    });
  }

  /**
   * Upload a document
   */
  uploadDocument(file: File, documentType: string, description?: string): void {
    if (!file || !documentType) {
      this.notification.onError('Please select a file and document type');
      return;
    }

    console.log('📤 Uploading document:', file.name, documentType);
    this.isLoadingSubject.next(true);

    this.employeeService.uploadMyDocument$(file, documentType, description).subscribe({
      next: (response) => {
        console.log('✅ Document uploaded:', response);
        this.notification.onSuccess('Document uploaded successfully');
        this.isLoadingSubject.next(false);
        this.loadMyDocuments(); // Refresh list
      },
      error: (error) => {
        console.error('❌ Error uploading document:', error);
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Delete a document
   */
  deleteDocument(documentId: number): void {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    console.log('🗑️ Deleting document:', documentId);
    this.isLoadingSubject.next(true);

    this.employeeService.deleteMyDocument$(documentId).subscribe({
      next: (response) => {
        console.log('✅ Document deleted:', response);
        this.notification.onSuccess('Document deleted successfully');
        this.isLoadingSubject.next(false);
        this.loadMyDocuments(); // Refresh list
      },
      error: (error) => {
        console.error('❌ Error deleting document:', error);
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Download a document by ID from database
   * Uses employeeService to include authentication headers
   */
  downloadDocument(documentId: number): void {
    if (!documentId) {
      this.notification.onError('Invalid document ID');
      return;
    }

    console.log('📥 Downloading document:', documentId);
    this.isLoadingSubject.next(true);

    // Get the document info first to get the original filename for the download
    this.employeeService.getDocument$(documentId).subscribe({
      next: (response) => {
        if (response?.data?.document) {
          const doc = response.data.document;
          const downloadFilename = doc.originalFileName || `document_${documentId}.pdf`;

          // Download using document ID endpoint
          this.employeeService.downloadDocumentById$(documentId).subscribe({
            next: (blob: Blob) => {
              // Create download link
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = downloadFilename;
              link.click();
              window.URL.revokeObjectURL(url);
              this.isLoadingSubject.next(false);
              this.notification.onSuccess('Document downloaded successfully');
            },
            error: (error) => {
              console.error('❌ Error downloading document:', error);
              this.isLoadingSubject.next(false);
              this.notification.onError('Failed to download document. Please try again.');
            }
          });
        } else {
          this.isLoadingSubject.next(false);
          this.notification.onError('Document not found');
        }
      },
      error: (error) => {
        console.error('❌ Error getting document info:', error);
        this.isLoadingSubject.next(false);
        this.notification.onError('Failed to get document information. Please try again.');
      }
    });
  }

  /**
   * Get document type label
   */
  getDocumentTypeLabel(type: string): string {
    const found = this.documentTypes.find(dt => dt.value === type);
    return found ? found.label : type;
  }

  /**
   * Get profile image URL - from database endpoint or default avatar
   * Uses caching to prevent repeated requests on change detection
   */
  getProfileImageUrl(userId: number): string {
    if (!userId) {
      return this.DEFAULT_AVATAR;
    }

    // Return cached URL if available
    if (this.imageUrlCache.has(userId)) {
      return this.imageUrlCache.get(userId);
    }

    // Create new URL with timestamp (only once) and cache it
    const url = `${this.SERVER_URL}/image/${userId}?t=${Date.now()}`;
    this.imageUrlCache.set(userId, url);
    return url;
  }

  /**
   * Clear image cache (call after updating profile picture)
   */
  clearImageCache(userId: number): void {
    this.imageUrlCache.delete(userId);
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

  saveKioskPin(form: NgForm): void {
    const { kioskPin, kioskPinConfirm } = form.value;
    if (kioskPin !== kioskPinConfirm) {
      this.notification.onError('PINs do not match');
      return;
    }
    this.savingKioskPin = true;
    this.kioskService.setPin(kioskPin).subscribe({
      next: () => {
        this.notification.onSuccess('Kiosk PIN set successfully');
        form.resetForm();
        this.savingKioskPin = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.notification.onError(err);
        this.savingKioskPin = false;
        this.cdr.markForCheck();
      }
    });
  }

  onBgChange(bgKey: keyof ThemeTokens, textKey: keyof ThemeTokens, value: string): void {
    this.personalTheme = { ...this.personalTheme, [bgKey]: value, [textKey]: suggestTextColor(value) };
    this.cdr.markForCheck();
  }

  onTextChange(textKey: keyof ThemeTokens, value: string): void {
    this.personalTheme = { ...this.personalTheme, [textKey]: value };
    this.cdr.markForCheck();
  }

  companyDefault(key: keyof ThemeTokens): string {
    return (this.branding.branding?.theme?.[key] as string) || DEFAULT_THEME[key];
  }

  clearPersonalField(key: keyof ThemeTokens): void {
    const updated = { ...this.personalTheme };
    delete updated[key];
    this.personalTheme = updated;
    this.cdr.markForCheck();
  }

  saveMyTheme(): void {
    this.savingTheme = true;
    this.branding.setPersonalTheme(this.personalTheme).subscribe({
      next: () => { this.savingTheme = false; this.notification.onDefault('Your theme has been saved'); this.cdr.markForCheck(); },
      error: err => { this.notification.onError(err); this.savingTheme = false; this.cdr.markForCheck(); }
    });
  }

  resetMyTheme(): void {
    this.savingTheme = true;
    this.branding.clearPersonalTheme().subscribe({
      next: () => { this.personalTheme = {}; this.savingTheme = false; this.notification.onDefault('Reset to company default'); this.cdr.markForCheck(); },
      error: err => { this.notification.onError(err); this.savingTheme = false; this.cdr.markForCheck(); }
    });
  }
}
