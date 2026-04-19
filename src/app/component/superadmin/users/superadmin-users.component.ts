// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SuperadminService } from '../superadmin.service';
import { NotificationService } from '../../../service/notification.service';

@Component({
  standalone: false,
  selector: 'app-superadmin-users',
  templateUrl: './superadmin-users.component.html',
  styleUrls: ['./superadmin-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminUsersComponent implements OnInit {
  users: any[] = [];
  companies: any[] = [];
  loading = true;

  // Filters
  searchTerm = '';
  filterRole = '';
  filterCompany = '';
  filterStatus = '';

  // ── Create Admin modal ───────────────────────────────────────
  showAdminModal = false;
  savingAdmin = false;
  createdAdminCredentials: { email: string; tempPassword: string; companyName: string } | null = null;

  // ── Reset Password modal ─────────────────────────────────────
  showResetModal = false;
  resettingPassword = false;
  resetTarget: any = null;
  resetCredentials: { email: string; tempPassword: string } | null = null;

  // ── Change Role modal ────────────────────────────────────────
  showRoleModal = false;
  savingRole = false;
  roleTarget: any = null;
  selectedRole = '';

  // ── Delete Confirm modal ─────────────────────────────────────
  showDeleteModal = false;
  deletingUser = false;
  deleteTarget: any = null;

  // ── Toggle in-progress tracker ───────────────────────────────
  togglingUserId: number | null = null;

  constructor(
    private superadminService: SuperadminService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.superadminService.getUsers().subscribe({
      next: res => { this.users = res.data?.users ?? []; this.loading = false; this.cdr.markForCheck(); },
      error: err => { this.notification.onError(err); this.loading = false; this.cdr.markForCheck(); }
    });
    this.superadminService.getCompanies(0, 200).subscribe({
      next: res => { this.companies = res.data?.companies?.content ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  get filtered(): any[] {
    return this.users.filter(u => {
      const term = this.searchTerm.toLowerCase();
      const matchTerm = !term ||
        (u.first_name + ' ' + u.last_name).toLowerCase().includes(term) ||
        (u.email ?? '').toLowerCase().includes(term) ||
        (u.company_name ?? '').toLowerCase().includes(term);
      const matchRole   = !this.filterRole    || u.role_name === this.filterRole;
      const matchCo     = !this.filterCompany || String(u.company_id) === this.filterCompany;
      const matchStatus = !this.filterStatus  ||
        (this.filterStatus === 'active'   &&  u.enabled) ||
        (this.filterStatus === 'inactive' && !u.enabled);
      return matchTerm && matchRole && matchCo && matchStatus;
    });
  }

  get totalSysadmins(): number { return this.users.filter(u => u.role_name === 'ROLE_SYSADMIN').length; }
  get totalAdmins(): number    { return this.users.filter(u => u.role_name === 'ROLE_ADMIN').length; }
  get totalActive(): number    { return this.users.filter(u => u.enabled).length; }

  // ── Create Admin ──────────────────────────────────────────────
  openCreateAdmin(): void {
    this.createdAdminCredentials = null;
    this.showAdminModal = true;
  }

  closeAdminModal(): void {
    this.showAdminModal = false;
    this.createdAdminCredentials = null;
  }

  createAdmin(form: NgForm): void {
    if (form.invalid) return;
    const { companyId, ...adminData } = form.value;
    this.savingAdmin = true;
    this.superadminService.createCompanyAdmin(companyId, adminData).subscribe({
      next: res => {
        this.savingAdmin = false;
        this.createdAdminCredentials = {
          email: res.data.email,
          tempPassword: res.data.tempPassword,
          companyName: res.data.companyName
        };
        this.cdr.markForCheck();
        this.notification.onDefault('Company admin created successfully');
        this.loadData();
      },
      error: err => { this.savingAdmin = false; this.notification.onError(err); this.cdr.markForCheck(); }
    });
  }

  // ── Toggle (Lock / Unlock) ────────────────────────────────────
  toggleUser(user: any): void {
    this.togglingUserId = user.id;
    this.superadminService.toggleUser(user.id).subscribe({
      next: res => {
        user.enabled = res.data.enabled;
        this.togglingUserId = null;
        this.cdr.markForCheck();
        this.notification.onDefault(res.message);
      },
      error: err => { this.togglingUserId = null; this.notification.onError(err); this.cdr.markForCheck(); }
    });
  }

  // ── Reset Password ────────────────────────────────────────────
  openResetPassword(user: any): void {
    this.resetTarget = user;
    this.resetCredentials = null;
    this.showResetModal = true;
  }

  closeResetModal(): void {
    this.showResetModal = false;
    this.resetTarget = null;
    this.resetCredentials = null;
  }

  confirmResetPassword(): void {
    if (!this.resetTarget) return;
    this.resettingPassword = true;
    this.superadminService.resetUserPassword(this.resetTarget.id).subscribe({
      next: res => {
        this.resettingPassword = false;
        this.resetCredentials = { email: res.data.email, tempPassword: res.data.tempPassword };
        this.cdr.markForCheck();
        this.notification.onDefault('Password reset successfully');
      },
      error: err => { this.resettingPassword = false; this.notification.onError(err); this.cdr.markForCheck(); }
    });
  }

  // ── Change Role ───────────────────────────────────────────────
  openChangeRole(user: any): void {
    this.roleTarget = user;
    this.selectedRole = user.role_name;
    this.showRoleModal = true;
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.roleTarget = null;
    this.selectedRole = '';
  }

  confirmChangeRole(): void {
    if (!this.roleTarget || !this.selectedRole) return;
    this.savingRole = true;
    this.superadminService.changeUserRole(this.roleTarget.id, this.selectedRole).subscribe({
      next: res => {
        this.savingRole = false;
        this.roleTarget.role_name = this.selectedRole;
        this.cdr.markForCheck();
        this.notification.onDefault('Role updated successfully');
        this.closeRoleModal();
      },
      error: err => { this.savingRole = false; this.notification.onError(err); this.cdr.markForCheck(); }
    });
  }

  // ── Delete User ───────────────────────────────────────────────
  openDeleteConfirm(user: any): void {
    this.deleteTarget = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.deletingUser = true;
    this.superadminService.deleteUser(this.deleteTarget.id).subscribe({
      next: () => {
        this.deletingUser = false;
        this.users = this.users.filter(u => u.id !== this.deleteTarget.id);
        this.cdr.markForCheck();
        this.notification.onDefault('User deleted successfully');
        this.closeDeleteModal();
      },
      error: err => { this.deletingUser = false; this.notification.onError(err); this.cdr.markForCheck(); }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() =>
      this.notification.onDefault('Copied to clipboard'));
  }

  roleLabel(roleName: string): string {
    const map: Record<string, string> = {
      'ROLE_SYSADMIN': 'System Admin',
      'ROLE_ADMIN':    'Admin',
      'ROLE_MANAGER':  'Manager',
      'ROLE_USER':     'Employee',
    };
    return map[roleName] ?? roleName?.replace('ROLE_', '') ?? '—';
  }

  trackById = (index: number, item: any) => item.id;
}
