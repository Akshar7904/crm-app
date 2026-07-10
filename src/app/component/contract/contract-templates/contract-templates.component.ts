// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ContractService } from '../services/contract.service';
import { ContractTemplate, ContractEnumItem } from '../models/contract.model';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';

@Component({
  standalone: false,
  selector: 'app-contract-templates',
  templateUrl: './contract-templates.component.html',
  styleUrls: ['./contract-templates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractTemplatesComponent implements OnInit {

  @ViewChild('tmplRteEditor') tmplRteEditorRef?: ElementRef<HTMLDivElement>;

  templates: ContractTemplate[] = [];
  types: ContractEnumItem[] = [];
  loading = true;
  isAdmin = false;
  filterType = '';

  showModal = false;
  editingId: number | null = null;
  submitting = false;

  showPreviewModal = false;
  previewTemplate: ContractTemplate | null = null;

  form: FormGroup;

  constructor(
    private contractSvc: ContractService,
    private notification: NotificationService,
    private userSvc: UserService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      contractType: ['', Validators.required],
      description: [''],
      content: [''],
      lockedClauses: [''],
      global: [false],
      active: [true]
    });
  }

  ngOnInit(): void {
    const user = this.userSvc.getUserFromLocalCache();
    this.isAdmin = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN', 'ROLE_MANAGER']
      .includes(user?.roleName || '');
    this.contractSvc.getTypes().subscribe(t => { this.types = t; this.cdr.markForCheck(); });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.contractSvc.getTemplates(this.filterType || undefined).subscribe({
      next: t => { this.templates = t; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ global: false, active: true });
    this.showModal = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      if (this.tmplRteEditorRef?.nativeElement) this.tmplRteEditorRef.nativeElement.innerHTML = '';
    }, 0);
  }

  openEdit(t: ContractTemplate): void {
    this.editingId = t.id!;
    this.form.patchValue({
      name: t.name,
      contractType: t.contractType,
      description: t.description,
      content: t.content,
      lockedClauses: t.lockedClauses,
      global: t.global,
      active: t.active
    });
    this.showModal = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      if (this.tmplRteEditorRef?.nativeElement) {
        this.tmplRteEditorRef.nativeElement.innerHTML = t.content || '';
      }
    }, 0);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    const payload = this.form.value;

    const obs = this.editingId
      ? this.contractSvc.updateTemplate(this.editingId, payload)
      : this.contractSvc.createTemplate(payload);

    obs.subscribe({
      next: t => {
        this.submitting = false;
        this.showModal = false;
        if (this.editingId) {
          const forked = t.id !== this.editingId;
          if (forked) {
            // Backend created a company-specific copy — keep original global, add the fork
            this.templates = [t, ...this.templates];
            this.notification.onSuccess('A company copy was saved — the shared template was not changed');
          } else {
            this.templates = this.templates.map(x => x.id === t.id ? t : x);
            this.notification.onSuccess('Template updated');
          }
        } else {
          this.templates = [t, ...this.templates];
          this.notification.onSuccess('Template created');
        }
        this.cdr.markForCheck();
      },
      error: e => {
        this.submitting = false;
        this.notification.onError(e?.error?.message || 'Failed to save template');
        this.cdr.markForCheck();
      }
    });
  }

  openPreview(t: ContractTemplate): void {
    this.previewTemplate = t;
    this.showPreviewModal = true;
    this.cdr.markForCheck();
  }

  get safePreviewContent(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.previewTemplate?.content || '');
  }

  deleteTemplate(t: ContractTemplate): void {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    this.contractSvc.deleteTemplate(t.id!).subscribe({
      next: () => {
        this.templates = this.templates.filter(x => x.id !== t.id);
        this.notification.onSuccess('Template deleted');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Delete failed')
    });
  }

  execCmd(cmd: string, value?: string): void {
    document.execCommand(cmd, false, value ?? undefined);
    this.onRteInput();
  }

  onRteInput(): void {
    if (!this.tmplRteEditorRef?.nativeElement) return;
    this.form.get('content')?.setValue(
      this.tmplRteEditorRef.nativeElement.innerHTML, { emitEvent: false }
    );
  }

  onRteBlur(): void {
    this.onRteInput();
    this.form.get('content')?.markAsTouched();
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  expandedGroups = new Set<string>();

  get groupedTemplates(): Array<{ type: string; label: string; templates: ContractTemplate[]; expanded: boolean }> {
    const source = this.filterType
      ? this.templates.filter(t => t.contractType === this.filterType)
      : this.templates;
    const map = new Map<string, ContractTemplate[]>();
    for (const t of source) {
      if (!map.has(t.contractType)) map.set(t.contractType, []);
      map.get(t.contractType)!.push(t);
    }
    return Array.from(map.entries()).map(([type, tmpls]) => ({
      type,
      label: this.types.find(x => x.value === type)?.label || type,
      templates: tmpls,
      expanded: this.expandedGroups.has(type)
    }));
  }

  toggleGroup(type: string): void {
    if (this.expandedGroups.has(type)) this.expandedGroups.delete(type);
    else this.expandedGroups.add(type);
    this.cdr.markForCheck();
  }

  get filtered(): ContractTemplate[] {
    if (!this.filterType) return this.templates;
    return this.templates.filter(t => t.contractType === this.filterType);
  }

  typeLabelFor(type: string): string {
    return this.types.find(x => x.value === type)?.label || type;
  }

  get globalCount(): number { return this.templates.filter(t => t.global).length; }
  get activeCount(): number { return this.templates.filter(t => t.active).length; }
}
