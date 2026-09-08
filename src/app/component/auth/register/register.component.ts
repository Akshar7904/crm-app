// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/service/notification.service';
import { UserService } from 'src/app/service/user.service';
import { Plan, PlanService } from 'src/app/service/plan.service';

// Multi-step self-service registration wizard. Replaces the old single-step
// admin-approval registration form: applicants now pick an account type
// (Company vs Individual), fill type-specific steps 1-3 (added by Tasks 10/11
// via the #companySteps/#individualSteps ng-templates below), choose a plan
// (step 4, shared — consumes PlanService from Task 8), and confirm (step 5,
// shared). Submission hits the new self-service /auth/register endpoint
// (Task 2) rather than the old /user/register admin-review endpoint.
@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit {
  accountType: 'COMPANY' | 'INDIVIDUAL' | null = null;
  currentStep = 1; // 1-5, only meaningful once accountType is chosen
  submitting = false;
  submitted = false;
  errorMessage: string | null = null;
  plans: Plan[] = [];

  form: any = {
    accountType: '', companyName: '', tradingName: '', companyRegistrationNumber: '',
    companyType: '', industry: '', numberOfEmployees: null, estimatedCustomers: null,
    vatRegistered: false, vatNumber: '', companyEmail: '', website: '',
    idNumberOrPassport: '', countryOfResidence: '', occupation: '', operatingAs: '',
    country: 'South Africa', city: '', province: '', address: '', postalCode: '',
    alternativeContactNumber: '',
    firstName: '', lastName: '', position: '', email: '', mobile: '',
    password: '', confirmPassword: '',
    planKey: '',
    termsAccepted: false, popiaAccepted: false, accuracyConfirmed: false, marketingOptIn: false
  };

  readonly COMPANY_TYPES = [
    'Private Company (Pty) Ltd', 'Public Company Ltd', 'Personal Liability Company Inc',
    'State-Owned Company SOC Ltd', 'Non-Profit Company NPC', 'Sole Proprietorship', 'Partnership'
  ];
  readonly INDUSTRIES = ['Consulting', 'Retail', 'Construction', 'IT', 'Finance', 'Healthcare', 'Manufacturing', 'Other'];
  readonly OPERATING_AS_OPTIONS = ['Individual', 'Freelancer', 'Independent Contractor', 'Sole Proprietor', 'Other'];
  readonly PROVINCES = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'];

  constructor(
    private userService: UserService,
    private planService: PlanService,
    private router: Router,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.planService.getAll$().subscribe(plans => { this.plans = plans; this.cdr.markForCheck(); });
  }

  chooseAccountType(type: 'COMPANY' | 'INDIVIDUAL'): void {
    this.accountType = type;
    this.form.accountType = type;
    this.currentStep = 1;
  }

  nextStep(): void { if (this.currentStep < 5) this.currentStep++; }
  prevStep(): void { if (this.currentStep > 1) this.currentStep--; }

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

  registerAnother(): void {
    this.accountType = null; this.currentStep = 1; this.submitted = false;
    this.form = { ...this.form }; // reset via the same defaults object shape as the constructor field above
  }
}
