// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { NotificationService } from 'src/app/service/notification.service';
import { UserService } from 'src/app/service/user.service';

// Self-service registration wizard. Applicants pick an account type
// (Company vs Individual), fill one combined "essential details" step,
// then confirm terms/POPIA and submit. Everything beyond the essentials
// (address, industry, company type, VAT, ID number, etc.) is collected
// later from the profile/settings screens once the account exists, not
// at signup — an earlier 5-step version collected all of it up front and
// also required an explicit plan pick with no enforcement, which let
// users submit with an empty planKey and get a 400 from the backend's
// @NotBlank check. The plan is now fixed to FREE at signup; upgrading is
// a post-onboarding action, not a registration-time one.
@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  accountType: 'COMPANY' | 'INDIVIDUAL' | null = null;
  currentStep = 1; // 1: essential details, 2: confirm
  submitting = false;
  submitted = false;
  errorMessage: string | null = null;

  form: any = {
    accountType: '', companyName: '',
    firstName: '', lastName: '', email: '', mobile: '',
    password: '', confirmPassword: '',
    planKey: 'FREE',
    termsAccepted: false, popiaAccepted: false, marketingOptIn: false
  };

  constructor(
    private userService: UserService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  chooseAccountType(type: 'COMPANY' | 'INDIVIDUAL'): void {
    this.errorMessage = null;
    this.accountType = type;
    this.form.accountType = type;
    this.currentStep = 1;
  }

  private isBlank(value: any): boolean {
    return value === null || value === undefined || String(value).trim() === '';
  }

  canProceed(): boolean {
    if (!this.accountType) return false;
    const f = this.form;
    if (this.accountType === 'COMPANY' && this.isBlank(f.companyName)) return false;
    return !this.isBlank(f.firstName) && !this.isBlank(f.lastName) && !this.isBlank(f.email)
      && !this.isBlank(f.mobile) && !this.isBlank(f.password) && !this.isBlank(f.confirmPassword)
      && f.password === f.confirmPassword;
  }

  nextStep(): void {
    this.errorMessage = null;
    if (this.currentStep < 2) this.currentStep++;
  }

  // On step 1, "Back" returns to the account-type chooser (there is no
  // earlier wizard step to go back to).
  prevStep(): void {
    this.errorMessage = null;
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.accountType = null;
    }
  }

  submitRegistration(): void {
    if (this.form.password !== this.form.confirmPassword) {
      this.notification.onError('Passwords do not match');
      return;
    }
    this.submitting = true;
    this.userService.registerAccount$(this.form).subscribe({
      next: () => { this.submitting = false; this.submitted = true; this.cdr.markForCheck(); },
      error: (err) => { this.submitting = false; this.errorMessage = err; this.cdr.markForCheck(); }
    });
  }
}
