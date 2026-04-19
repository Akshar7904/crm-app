// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SuperadminService } from '../superadmin.service';
import { NotificationService } from '../../../service/notification.service';

@Component({
  standalone: false,
  selector: 'app-superadmin-announcements',
  templateUrl: './superadmin-announcements.component.html',
  styleUrls: ['./superadmin-announcements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminAnnouncementsComponent implements OnInit {

  announcements: any[] = [];
  companies: any[]     = [];
  departments: any[]   = [];
  loadingDepts         = false;
  loading  = true;
  saving   = false;

  // Create form
  showForm = false;

  // Edit
  showEditModal    = false;
  editingAnnouncement: any = null;

  // View
  viewingAnnouncement: any = null;

  deletingId: number | null = null;
  togglingId: number | null = null;
  pinningId:  number | null = null;

  readonly CATEGORIES = ['GENERAL', 'POLICY', 'HR', 'IT', 'FINANCE', 'EVENT', 'URGENT'];
  readonly PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

  constructor(
    private superadminService: SuperadminService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.superadminService.getPlatformAnnouncements().subscribe({
      next: res => { this.announcements = res.data?.announcements ?? []; this.loading = false; this.cdr.markForCheck(); },
      error: (err: any) => { this.notification.onError(err?.error?.message || 'Failed to load announcements'); this.loading = false; this.cdr.markForCheck(); }
    });
    this.superadminService.getCompanies(0, 200).subscribe({
      next: res => { this.companies = res.data?.companies?.content ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  // ── Create ──────────────────────────────────────────────────────
  openForm():  void { this.showForm = true; }
  closeForm(): void { this.showForm = false; }

  createAnnouncement(form: NgForm): void {
    if (form.invalid) return;
    this.saving = true;
    const rawExpiry = form.value.expiresAt;
    const expiresAt = rawExpiry ? (rawExpiry.length === 16 ? rawExpiry + ':00' : rawExpiry) : null;
    const payload: any = {
      title:              form.value.title,
      content:            form.value.content,
      summary:            form.value.summary || null,
      category:           form.value.category || 'GENERAL',
      priority:           form.value.priority || 'NORMAL',
      targetAudience:     form.value.departmentId ? 'DEPARTMENT' : 'ALL',
      targetDepartmentId: form.value.departmentId ? Number(form.value.departmentId) : null,
      companyId:          form.value.companyId ? Number(form.value.companyId) : null,
      isPinned:           !!form.value.isPinned,
      expiresAt
    };
    this.superadminService.createPlatformAnnouncement(payload).subscribe({
      next: () => {
        this.saving = false;
        this.notification.onDefault('Announcement published');
        form.resetForm();
        this.showForm = false;
        this.cdr.markForCheck();
        this.loadData();
      },
      error: (err: any) => {
        this.saving = false;
        this.notification.onError(err?.error?.message || err?.message || 'Failed to publish announcement');
        this.cdr.markForCheck();
      }
    });
  }

  // ── View ────────────────────────────────────────────────────────
  openView(a: any):  void { this.viewingAnnouncement = a; this.cdr.markForCheck(); }
  closeView():       void { this.viewingAnnouncement = null; }

  // ── Edit ────────────────────────────────────────────────────────
  openEdit(a: any): void {
    this.editingAnnouncement = { ...a };
    this.departments = [];
    if (a.company_id) {
      this.onCompanyChange(a.company_id);
    }
    this.showEditModal = true;
    this.cdr.markForCheck();
  }
  closeEdit(): void { this.showEditModal = false; this.editingAnnouncement = null; }

  saveEdit(form: NgForm): void {
    if (form.invalid || !this.editingAnnouncement) return;
    this.saving = true;
    const rawExpiry = form.value.expiresAt;
    const expiresAt = rawExpiry ? (rawExpiry.length === 16 ? rawExpiry + ':00' : rawExpiry) : null;
    const payload: any = {
      title:              form.value.title,
      content:            form.value.content,
      summary:            form.value.summary || null,
      category:           form.value.category || this.editingAnnouncement.category,
      priority:           form.value.priority || this.editingAnnouncement.priority,
      targetAudience:     form.value.departmentId ? 'DEPARTMENT' : 'ALL',
      targetDepartmentId: form.value.departmentId ? Number(form.value.departmentId) : null,
      companyId:          form.value.companyId ? Number(form.value.companyId) : null,
      isPinned:           !!form.value.isPinned,
      isActive:           this.editingAnnouncement.is_active ?? true,
      expiresAt
    };
    this.superadminService.updatePlatformAnnouncement(this.editingAnnouncement.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.notification.onDefault('Announcement updated');
        this.closeEdit();
        this.cdr.markForCheck();
        this.loadData();
      },
      error: (err: any) => {
        this.saving = false;
        this.notification.onError(err?.error?.message || err?.message || 'Failed to update announcement');
        this.cdr.markForCheck();
      }
    });
  }

  // ── Toggle active ───────────────────────────────────────────────
  toggle(a: any): void {
    this.togglingId = a.id;
    this.superadminService.togglePlatformAnnouncement(a.id, !a.is_active).subscribe({
      next: res => {
        a.is_active = res.data?.active ?? !a.is_active;
        this.togglingId = null;
        this.notification.onDefault('Status updated');
        this.cdr.markForCheck();
      },
      error: (err: any) => { this.togglingId = null; this.notification.onError(err?.error?.message || 'Failed to update status'); this.cdr.markForCheck(); }
    });
  }

  // ── Toggle pin ──────────────────────────────────────────────────
  togglePin(a: any): void {
    this.pinningId = a.id;
    this.superadminService.pinPlatformAnnouncement(a.id, !a.is_pinned).subscribe({
      next: res => {
        a.is_pinned = res.data?.pinned ?? !a.is_pinned;
        this.pinningId = null;
        this.notification.onDefault(a.is_pinned ? 'Announcement pinned' : 'Announcement unpinned');
        this.cdr.markForCheck();
      },
      error: (err: any) => { this.pinningId = null; this.notification.onError(err?.error?.message || 'Failed to update pin'); this.cdr.markForCheck(); }
    });
  }

  // ── Delete ──────────────────────────────────────────────────────
  confirmDelete(a: any): void {
    if (!confirm(`Delete announcement "${a.title}"?`)) return;
    this.deletingId = a.id;
    this.superadminService.deletePlatformAnnouncement(a.id).subscribe({
      next: () => {
        this.announcements = this.announcements.filter(x => x.id !== a.id);
        this.deletingId = null;
        this.notification.onDefault('Announcement deleted');
        this.cdr.markForCheck();
      },
      error: (err: any) => { this.deletingId = null; this.notification.onError(err?.error?.message || 'Failed to delete'); this.cdr.markForCheck(); }
    });
  }

  // ── Department loading ──────────────────────────────────────
  onCompanyChange(companyId: any): void {
    this.departments = [];
    if (!companyId) return;
    this.loadingDepts = true;
    this.superadminService.getCompanyDepartments(Number(companyId)).subscribe({
      next: res => {
        this.departments = res.data?.departments ?? [];
        this.loadingDepts = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingDepts = false; this.cdr.markForCheck(); }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────
  scopeLabel(a: any): string {
    if (!a.company_id) return 'All Companies';
    const c = this.companies.find(x => x.id === a.company_id);
    return c ? c.name : `Company #${a.company_id}`;
  }

  priorityClass(p: string): string {
    const map: Record<string, string> = { URGENT: 'badge-soft-danger', HIGH: 'badge-soft-warning', NORMAL: 'badge-soft-primary', LOW: 'badge-soft-secondary' };
    return map[p] ?? 'badge-soft-secondary';
  }

  categoryClass(c: string): string {
    const map: Record<string, string> = { URGENT: 'badge-soft-danger', POLICY: 'badge-soft-warning', HR: 'badge-soft-success', IT: 'badge-soft-info', FINANCE: 'badge-soft-primary', EVENT: 'badge-soft-purple', GENERAL: 'badge-soft-secondary' };
    return map[c] ?? 'badge-soft-secondary';
  }

  trackById  = (index: number, item: any) => item.id;
  trackByValue = (index: number, value: any) => value;
}
