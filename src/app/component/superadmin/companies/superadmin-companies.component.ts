// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SuperadminService } from '../superadmin.service';
import { NotificationService } from '../../../service/notification.service';
import { Key } from '../../../enum/key.enum';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-superadmin-companies',
  templateUrl: './superadmin-companies.component.html',
  styleUrls: ['./superadmin-companies.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminCompaniesComponent implements OnInit {
  companies: any[] = [];
  totalAll = 0;
  totalActive = 0;
  loading = true;
  saving = false;

  // Company create/edit modal
  showCreateModal = false;
  editCompany: any = null;

  // Logo upload
  showLogoModal = false;
  logoTarget: any = null;
  selectedLogoFile: File | null = null;
  logoPreview: string | null = null;
  uploadingLogo = false;

  // Create Admin modal
  showAdminModal = false;
  adminTargetCompany: any = null;
  savingAdmin = false;
  createdAdminCredentials: { email: string; tempPassword: string } | null = null;

  // Module management panel
  showModulesPanel = false;
  modulesTarget: any = null;
  companyModules: { name: string; label: string; enabled: boolean; starter: boolean }[] = [];
  loadingModules = false;

  private readonly MODULE_LABELS: Record<string, string> = {
    EMPLOYEE_MANAGEMENT: 'Employee Management',
    LEAVE_MANAGEMENT: 'Leave Management',
    PAYROLL_PAYSLIPS: 'Payroll & Payslips',
    EXPENSE_CLAIMS: 'Expense Claims',
    BUSINESS_EXPENSES: 'Business Expenses & Accounting',
    ASSET_MANAGEMENT: 'Asset Management',
    ATTENDANCE_TRACKING: 'Attendance Tracking',
    INVOICE_CUSTOMER: 'Invoicing & Customers',
    BUDGET_MANAGEMENT: 'Budget Management',
    INTERN_ATTENDANCE: 'Intern Attendance',
  };

  constructor(
    private superadminService: SuperadminService,
    private notification: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadCompanies(); }

  loadCompanies(): void {
    this.loading = true;
    this.superadminService.getCompanies(0, 100).subscribe({
      next: res => {
        this.companies = res.data?.companies?.content ?? [];
        this.totalAll = res.data?.totalAll ?? 0;
        this.totalActive = res.data?.totalActive ?? 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => { this.notification.onError(err); this.loading = false; this.cdr.markForCheck(); }
    });
  }

  // ── Company CRUD ──────────────────────────────────────────────
  openCreate(): void { this.editCompany = null; this.showCreateModal = true; }
  openEdit(company: any): void { this.editCompany = { ...company }; this.showCreateModal = true; }
  closeModal(): void { this.showCreateModal = false; this.editCompany = null; }

  save(form: NgForm): void {
    if (form.invalid) return;
    this.saving = true;
    const req$ = this.editCompany?.id
      ? this.superadminService.updateCompany(this.editCompany.id, form.value)
      : this.superadminService.createCompany(form.value);

    req$.subscribe({
      next: () => {
        this.notification.onDefault(this.editCompany?.id ? 'Company updated' : 'Company created');
        this.closeModal();
        this.loadCompanies();
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: err => { this.notification.onError(err); this.saving = false; this.cdr.markForCheck(); }
    });
  }

  toggle(company: any): void {
    this.superadminService.toggleCompany(company.id).subscribe({
      next: () => { this.notification.onDefault('Status updated'); this.loadCompanies(); },
      error: err => this.notification.onError(err)
    });
  }

  impersonate(company: any): void {
    const currentToken = localStorage.getItem(Key.TOKEN);
    if (currentToken) localStorage.setItem(Key.SUPERADMIN_TOKEN, currentToken);

    this.superadminService.impersonate(company.id).subscribe({
      next: res => {
        localStorage.setItem(Key.TOKEN, res.data.access_token);
        localStorage.setItem(Key.COMPANY_ID, String(company.id));
        this.notification.onDefault(`Now viewing as: ${company.name}`);
        this.router.navigate(['/']);
      },
      error: err => this.notification.onError(err)
    });
  }

  // ── Logo Upload ───────────────────────────────────────────────
  openLogoModal(company: any): void {
    this.logoTarget = company;
    this.selectedLogoFile = null;
    this.logoPreview = null;
    this.showLogoModal = true;
  }

  closeLogoModal(): void {
    this.showLogoModal = false;
    this.logoTarget = null;
    this.selectedLogoFile = null;
    this.logoPreview = null;
  }

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.notification.onError('Please select an image file (PNG, JPG, SVG)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.notification.onError('Logo must be smaller than 2 MB');
      return;
    }
    this.selectedLogoFile = file;
    const reader = new FileReader();
    reader.onload = e => { this.logoPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  uploadLogo(): void {
    if (!this.selectedLogoFile || !this.logoTarget) return;
    this.uploadingLogo = true;
    this.superadminService.uploadCompanyLogo(this.logoTarget.id, this.selectedLogoFile).subscribe({
      next: () => {
        this.uploadingLogo = false;
        this.notification.onDefault('Logo uploaded successfully');
        this.closeLogoModal();
        this.cdr.markForCheck();
        this.loadCompanies();
      },
      error: err => { this.uploadingLogo = false; this.notification.onError(err); this.cdr.markForCheck(); }
    });
  }

  getLogoUrl(company: any): string {
    return this.superadminService.getCompanyLogoUrl(company.id);
  }

  onLogoThumbError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  // ── Create Admin ──────────────────────────────────────────────
  openCreateAdmin(company: any): void {
    this.adminTargetCompany = company;
    this.createdAdminCredentials = null;
    this.showAdminModal = true;
  }

  closeAdminModal(): void {
    this.showAdminModal = false;
    this.adminTargetCompany = null;
    this.createdAdminCredentials = null;
  }

  createAdmin(form: NgForm): void {
    if (form.invalid) return;
    this.savingAdmin = true;
    this.superadminService.createCompanyAdmin(this.adminTargetCompany.id, form.value).subscribe({
      next: res => {
        this.savingAdmin = false;
        this.createdAdminCredentials = {
          email: res.data.email,
          tempPassword: res.data.tempPassword
        };
        this.cdr.markForCheck();
        this.notification.onDefault('Company admin created successfully');
      },
      error: err => { this.savingAdmin = false; this.notification.onError(err); this.cdr.markForCheck(); }
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() =>
      this.notification.onDefault('Copied to clipboard'));
  }

  // ── Modules Panel ─────────────────────────────────────────────
  openModulesPanel(company: any): void {
    this.modulesTarget = company;
    this.companyModules = [];
    this.loadingModules = true;
    this.showModulesPanel = true;
    this.superadminService.getCompanyModules(company.id).subscribe({
      next: res => {
        const raw: { name: string; enabled: boolean; starter: boolean }[] = res.data?.modules ?? [];
        this.companyModules = raw.map(m => ({
          name: m.name,
          label: this.MODULE_LABELS[m.name] ?? m.name,
          enabled: m.enabled,
          starter: m.starter
        }));
        this.loadingModules = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.notification.onError(err);
        this.loadingModules = false;
        this.showModulesPanel = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeModulesPanel(): void {
    this.showModulesPanel = false;
    this.modulesTarget = null;
    this.companyModules = [];
  }

  toggleModule(mod: { name: string; label: string; enabled: boolean; starter: boolean }): void {
    const newState = !mod.enabled;
    // Optimistic update
    mod.enabled = newState;
    this.cdr.markForCheck();

    this.superadminService.setCompanyModule(this.modulesTarget.id, mod.name, newState).subscribe({
      next: () => {
        this.notification.onDefault(`${mod.label} ${newState ? 'enabled' : 'disabled'}`);
      },
      error: err => {
        // Revert on failure
        mod.enabled = !newState;
        this.notification.onError(err);
        this.cdr.markForCheck();
      }
    });
  }

  trackByName = (index: number, item: any) => item.name;
  trackById = (index: number, item: any) => item.id;
}
