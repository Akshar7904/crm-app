// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ContractService } from '../services/contract.service';
import { ContractEnumItem, ContractTemplate } from '../models/contract.model';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';

@Component({
  standalone: false,
  selector: 'app-new-contract',
  templateUrl: './new-contract.component.html',
  styleUrls: ['./new-contract.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewContractComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('rteEditor') rteEditorRef?: ElementRef<HTMLDivElement>;
  @ViewChild('tmplRteEditor') tmplRteEditorRef?: ElementRef<HTMLDivElement>;

  private rteSub?: Subscription;

  form: FormGroup;
  tmplForm: FormGroup;
  types: ContractEnumItem[] = [];
  templates: ContractTemplate[] = [];
  loading = false;
  submitting = false;
  isEditMode = false;
  editingId: number | null = null;
  isAdmin = false;
  selectedTemplateId: number | null = null;
  showAllTemplates = false;
  showTemplateEditor = false;
  editingTemplate: ContractTemplate | null = null;
  savingTemplate = false;

  counterpartyTypes = [
    { value: 'VENDOR', label: 'Vendor / Supplier' },
    { value: 'CUSTOMER', label: 'Customer / Client' },
    { value: 'OTHER', label: 'Other Party' }
  ];

  departments = [
    'Legal', 'Supply Chain Management', 'Finance', 'IT', 'HR', 'Operations',
    'Procurement', 'Executive', 'Engineering', 'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private contractSvc: ContractService,
    private notification: NotificationService,
    private userSvc: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.tmplForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      contractType: ['', Validators.required],
      description: [''],
      content: ['']
    });
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      contractType: ['', Validators.required],
      department: [''],
      counterpartyName: [''],
      counterpartyType: ['OTHER'],
      value: [0, [Validators.min(0)]],
      currency: ['ZAR'],
      startDate: [''],
      endDate: [''],
      renewalDate: [''],
      noticePeriodDays: [30, [Validators.min(1)]],
      autoRenew: [false],
      description: [''],
      notes: [''],
      content: [''],
      ownerName: [''],
      templateId: [null]
    });
  }

  ngAfterViewInit(): void {
    const initial = this.form.get('content')?.value || '';
    if (this.rteEditorRef?.nativeElement) {
      this.rteEditorRef.nativeElement.innerHTML = initial;
    }
  }

  ngOnDestroy(): void {
    this.rteSub?.unsubscribe();
  }

  ngOnInit(): void {
    const user = this.userSvc.getUserFromLocalCache();
    this.isAdmin = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN', 'ROLE_MANAGER'].includes(user?.roleName || '');
    this.contractSvc.getTypes().subscribe(t => { this.types = t; this.cdr.markForCheck(); });
    this.loadTemplates();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.editingId = Number(id);
      this.loadForEdit(this.editingId);
    }

    // When type changes, reload templates for that type
    this.form.get('contractType')?.valueChanges.subscribe(type => {
      if (type) this.loadTemplates(type);
    });
  }

  loadTemplates(type?: string): void {
    this.contractSvc.getTemplates(type).subscribe({
      next: t => { this.templates = t; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  applyTemplate(templateId: string | null): void {
    if (!templateId) return;
    const template = this.templates.find(t => t.id === Number(templateId));
    if (template) this.useTemplate(template);
  }

  useTemplate(t: ContractTemplate): void {
    this.selectedTemplateId = t.id!;
    const html = t.content || '';
    this.form.patchValue({
      templateId: t.id,
      description: t.description || this.form.value.description,
      content: html
    });
    if (this.rteEditorRef?.nativeElement) {
      this.rteEditorRef.nativeElement.innerHTML = html;
    }
    this.notification.onSuccess(`Template "${t.name}" applied`);
    this.cdr.markForCheck();
  }

  openEditTemplate(t: ContractTemplate): void {
    this.editingTemplate = t;
    this.tmplForm.patchValue({
      name: t.name,
      contractType: t.contractType,
      description: t.description || '',
      content: t.content || ''
    });
    this.showTemplateEditor = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      if (this.tmplRteEditorRef?.nativeElement) {
        this.tmplRteEditorRef.nativeElement.innerHTML = t.content || '';
      }
    }, 0);
  }

  saveTemplateEdit(): void {
    if (!this.editingTemplate?.id || this.tmplForm.invalid) return;
    this.savingTemplate = true;
    this.contractSvc.updateTemplate(this.editingTemplate.id, this.tmplForm.value).subscribe({
      next: updated => {
        this.savingTemplate = false;
        this.showTemplateEditor = false;
        this.templates = this.templates.map(t => t.id === updated.id ? updated : t);
        if (this.selectedTemplateId === updated.id) {
          this.form.patchValue({ description: updated.description || this.form.value.description, content: updated.content || '' });
        }
        this.notification.onSuccess('Template updated');
        this.cdr.markForCheck();
      },
      error: e => {
        this.savingTemplate = false;
        this.notification.onError(e?.error?.message || 'Failed to update template');
        this.cdr.markForCheck();
      }
    });
  }

  loadForEdit(id: number): void {
    this.loading = true;
    this.contractSvc.getById(id).subscribe({
      next: c => {
        this.form.patchValue({
          title: c.title,
          contractType: c.contractType,
          department: c.department,
          counterpartyName: c.counterpartyName,
          counterpartyType: c.counterpartyType || 'OTHER',
          value: c.value,
          currency: c.currency || 'ZAR',
          startDate: c.startDate,
          endDate: c.endDate,
          renewalDate: c.renewalDate,
          noticePeriodDays: c.noticePeriodDays || 30,
          autoRenew: c.autoRenew,
          description: c.description,
          notes: c.notes,
          content: c.content,
          ownerName: c.ownerName,
          templateId: c.templateId
        });
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          if (this.rteEditorRef?.nativeElement) {
            this.rteEditorRef.nativeElement.innerHTML = c.content || '';
          }
        }, 0);
      },
      error: () => {
        this.loading = false;
        this.notification.onError('Failed to load contract');
        this.cdr.markForCheck();
      }
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    const payload = this.form.value;

    const obs = this.isEditMode && this.editingId
      ? this.contractSvc.update(this.editingId, payload, 'Manual update via edit form')
      : this.contractSvc.create(payload);

    obs.subscribe({
      next: c => {
        this.submitting = false;
        this.notification.onSuccess(this.isEditMode ? 'Contract updated' : 'Contract created');
        this.router.navigate(['/contracts', c.id]);
      },
      error: e => {
        this.submitting = false;
        this.notification.onError(e?.error?.message || 'Failed to save contract');
        this.cdr.markForCheck();
      }
    });
  }

  // ── Rich Text Editor (contract body) ─────────────────────────────────────
  execCmd(cmd: string, value?: string): void {
    document.execCommand(cmd, false, value ?? undefined);
    this.onRteInput();
  }

  onRteInput(): void {
    if (!this.rteEditorRef?.nativeElement) return;
    const html = this.rteEditorRef.nativeElement.innerHTML;
    this.form.get('content')?.setValue(html, { emitEvent: false });
  }

  onRteBlur(): void {
    this.onRteInput();
    this.form.get('content')?.markAsTouched();
  }

  // ── Rich Text Editor (template modal) ────────────────────────────────────
  execTmplCmd(cmd: string, value?: string): void {
    document.execCommand(cmd, false, value ?? undefined);
    this.onTmplRteInput();
  }

  onTmplRteInput(): void {
    if (!this.tmplRteEditorRef?.nativeElement) return;
    const html = this.tmplRteEditorRef.nativeElement.innerHTML;
    this.tmplForm.get('content')?.setValue(html, { emitEvent: false });
  }

  onTmplRteBlur(): void {
    this.onTmplRteInput();
    this.tmplForm.get('content')?.markAsTouched();
  }

  cancel(): void { this.router.navigate(['/contracts']); }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
}
