// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractService } from '../services/contract.service';
import { ContractEnumItem, ContractTemplate } from '../models/contract.model';
import { NotificationService } from '../../../service/notification.service';

@Component({
  standalone: false,
  selector: 'app-new-contract',
  templateUrl: './new-contract.component.html',
  styleUrls: ['./new-contract.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewContractComponent implements OnInit {

  form: FormGroup;
  types: ContractEnumItem[] = [];
  templates: ContractTemplate[] = [];
  loading = false;
  submitting = false;
  isEditMode = false;
  editingId: number | null = null;

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
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
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

  ngOnInit(): void {
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
    const id = Number(templateId);
    const template = this.templates.find(t => t.id === id);
    if (!template) return;

    this.form.patchValue({
      templateId: id,
      description: template.description || this.form.value.description,
      content: template.content || ''
    });
    this.notification.onSuccess(`Template "${template.name}" applied`);
    this.cdr.markForCheck();
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

  cancel(): void { this.router.navigate(['/contracts']); }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }
}
