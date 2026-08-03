// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CompanyService } from 'src/app/service/company.service';
import { BrandingService, ThemeTokens, suggestTextColor } from 'src/app/service/branding.service';
import { NotificationService } from 'src/app/service/notification.service';
import { environment } from '@env/environment';

@Component({
  standalone: false,
  selector: 'app-company-settings',
  templateUrl: './company-settings.component.html',
  styleUrls: ['./company-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanySettingsComponent implements OnInit {

  company: any = null;
  loading = true;
  saving = false;

  // Logo
  logoPreview: string | null = null;
  selectedLogoFile: File | null = null;
  uploadingLogo = false;

  // Theme
  theme: ThemeTokens = {};
  advanced: { [K in keyof ThemeTokens]?: boolean } = {};
  savingTheme = false;

  constructor(
    private companyService: CompanyService,
    public branding: BrandingService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.companyService.getMyCompany$().subscribe({
      next: res => {
        this.company = res?.data?.company ?? null;
        this.theme = this.parseThemeJson(this.company?.themeJson);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => { this.notification.onError(err); this.loading = false; this.cdr.markForCheck(); }
    });
  }

  save(form: NgForm): void {
    if (form.invalid) return;
    this.saving = true;
    const { name, tagline, primaryColor, email, phone, address } = form.value;
    this.companyService.updateMyBranding$({ name, tagline, primaryColor, email, phone, address }).subscribe({
      next: res => {
        this.company = res?.data?.company ?? this.company;
        this.branding.clear(); // force reload so sidebar/theme updates
        this.branding.load().subscribe();
        this.saving = false;
        this.notification.onDefault('Company settings saved');
        this.cdr.markForCheck();
      },
      error: err => { this.notification.onError(err); this.saving = false; this.cdr.markForCheck(); }
    });
  }

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) { this.notification.onError('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { this.notification.onError('Logo must be under 2 MB'); return; }
    this.selectedLogoFile = file;
    const reader = new FileReader();
    reader.onload = e => { this.logoPreview = e.target?.result as string; this.cdr.markForCheck(); };
    reader.readAsDataURL(file);
  }

  uploadLogo(): void {
    if (!this.selectedLogoFile) return;
    this.uploadingLogo = true;
    this.companyService.uploadMyLogo$(this.selectedLogoFile).subscribe({
      next: () => {
        this.uploadingLogo = false;
        this.selectedLogoFile = null;
        this.notification.onDefault('Logo uploaded successfully');
        this.branding.clear();
        this.branding.load().subscribe();
        this.cdr.markForCheck();
      },
      error: err => { this.notification.onError(err); this.uploadingLogo = false; this.cdr.markForCheck(); }
    });
  }

  get logoUrl(): string | null {
    return this.company?.id ? `${environment.apiUrl}/api/v1/companies/${this.company.id}/logo` : null;
  }

  private parseThemeJson(raw: string | null | undefined): ThemeTokens {
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }

  onBgChange(bgKey: keyof ThemeTokens, textKey: keyof ThemeTokens, value: string): void {
    this.theme = { ...this.theme, [bgKey]: value };
    if (!this.advanced[textKey]) {
      this.theme = { ...this.theme, [textKey]: suggestTextColor(value) };
    }
    this.cdr.markForCheck();
  }

  onTextChange(textKey: keyof ThemeTokens, value: string): void {
    this.theme = { ...this.theme, [textKey]: value };
    this.cdr.markForCheck();
  }

  toggleAdvanced(textKey: keyof ThemeTokens): void {
    this.advanced[textKey] = !this.advanced[textKey];
    this.cdr.markForCheck();
  }

  saveTheme(): void {
    this.savingTheme = true;
    this.companyService.updateMyBranding$({ theme: JSON.stringify(this.theme) }).subscribe({
      next: () => {
        this.savingTheme = false;
        this.notification.onDefault('Theme saved');
        this.branding.clear();
        this.branding.load().subscribe();
        this.cdr.markForCheck();
      },
      error: err => { this.notification.onError(err); this.savingTheme = false; this.cdr.markForCheck(); }
    });
  }

  resetTheme(): void {
    this.theme = {};
    this.saveTheme();
  }
}
