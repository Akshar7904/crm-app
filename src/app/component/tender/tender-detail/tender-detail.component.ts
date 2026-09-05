// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TenderService } from '../services/tender.service';
import { EmployeeService } from '../../../service/employee.service';
import { NotificationService } from '../../../service/notification.service';
import { Tender } from '../models/tender.model';

export type TenderDetailTab = 'overview' | 'tasks' | 'requirements' | 'pricing' | 'documents' | 'submission' | 'postbid';

@Component({
  standalone: false,
  selector: 'app-tender-detail',
  templateUrl: './tender-detail.component.html',
  styleUrls: ['./tender-detail.component.scss']
})
export class TenderDetailComponent implements OnInit {
  tender: Tender | null = null;
  loading = true;
  activeTab: TenderDetailTab = 'overview';

  employees: any[] = [];

  // Overview edit state
  editingOverview = false;
  overviewForm = this.emptyOverviewForm();
  savingOverview = false;
  uploadingAttachment = false;

  // Go/No-Go panel state
  goNoGoOwnerId: number | null = null;
  goNoGoOwnerName = '';
  goNoGoReason = '';
  savingGoNoGo = false;

  constructor(
    private route: ActivatedRoute,
    protected tenderService: TenderService,
    private employeeService: EmployeeService,
    protected notification: NotificationService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
    this.employeeService.searchEmployees$().subscribe({
      next: (response: any) => { this.employees = response.data?.employees || []; },
      error: () => { /* pickers just stay empty — not fatal to the page */ }
    });
  }

  load(id: number): void {
    this.loading = true;
    this.tenderService.getById(id).subscribe({
      next: t => {
        this.tender = t;
        this.goNoGoOwnerId = t.goNoGoOwnerId ?? null;
        this.goNoGoOwnerName = t.goNoGoOwnerName ?? '';
        this.goNoGoReason = t.goNoGoReason ?? '';
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  reload(): void {
    if (this.tender) this.load(this.tender.id);
  }

  setTab(tab: TenderDetailTab): void {
    this.activeTab = tab;
  }

  // ── Overview edit ──────────────────────────────────────────────────────
  private emptyOverviewForm() {
    return { title: '', issuingOrganisation: '', tenderReference: '', estimatedValue: null as number | null, closingDate: '', bidLeadId: null as number | null, bidLeadName: '' };
  }

  startEditOverview(): void {
    if (!this.tender) return;
    this.overviewForm = {
      title: this.tender.title,
      issuingOrganisation: this.tender.issuingOrganisation || '',
      tenderReference: this.tender.tenderReference || '',
      estimatedValue: this.tender.estimatedValue ?? null,
      closingDate: this.tender.closingDate || '',
      bidLeadId: this.tender.bidLeadId ?? null,
      bidLeadName: this.tender.bidLeadName || ''
    };
    this.editingOverview = true;
  }

  cancelEditOverview(): void {
    this.editingOverview = false;
  }

  onOverviewBidLeadChange(employeeId: string): void {
    const emp = this.employees.find(e => String(e.id) === employeeId);
    this.overviewForm.bidLeadId = emp ? emp.id : null;
    this.overviewForm.bidLeadName = emp ? `${emp.firstName} ${emp.lastName}` : '';
  }

  saveOverview(): void {
    if (!this.tender) return;
    this.savingOverview = true;
    this.tenderService.update(this.tender.id, {
      title: this.overviewForm.title,
      issuingOrganisation: this.overviewForm.issuingOrganisation || undefined,
      tenderReference: this.overviewForm.tenderReference || undefined,
      estimatedValue: this.overviewForm.estimatedValue ?? undefined,
      closingDate: this.overviewForm.closingDate || undefined,
      bidLeadId: this.overviewForm.bidLeadId ?? undefined,
      bidLeadName: this.overviewForm.bidLeadName || undefined
    }).subscribe({
      next: t => {
        this.tender = { ...this.tender, ...t };
        this.savingOverview = false;
        this.editingOverview = false;
        this.notification.onDefault('Tender updated.');
      },
      error: () => {
        this.savingOverview = false;
        this.notification.onError('Failed to update tender.');
      }
    });
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!this.tender || !input.files?.length) return;
    const file = input.files[0];
    this.uploadingAttachment = true;
    this.tenderService.uploadAttachment(this.tender.id, file).subscribe({
      next: t => {
        this.tender = { ...this.tender, ...t };
        this.uploadingAttachment = false;
        this.notification.onDefault('Attachment uploaded.');
      },
      error: () => {
        this.uploadingAttachment = false;
        this.notification.onError('Failed to upload attachment.');
      }
    });
  }

  downloadAttachment(): void {
    if (!this.tender) return;
    this.tenderService.downloadAttachment(this.tender.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.tender!.attachmentFileName || 'tender-document';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: () => this.notification.onError('Failed to download attachment.')
    });
  }

  // ── Go/No-Go ────────────────────────────────────────────────────────────
  onGoNoGoOwnerChange(employeeId: string): void {
    const emp = this.employees.find(e => String(e.id) === employeeId);
    this.goNoGoOwnerId = emp ? emp.id : null;
    this.goNoGoOwnerName = emp ? `${emp.firstName} ${emp.lastName}` : '';
  }

  submitGoNoGo(decision: 'GO' | 'NO_GO'): void {
    if (!this.tender) return;
    this.savingGoNoGo = true;
    this.tenderService.updateGoNoGo(this.tender.id, {
      goNoGoOwnerId: this.goNoGoOwnerId ?? undefined,
      goNoGoOwnerName: this.goNoGoOwnerName || undefined,
      goNoGoReason: this.goNoGoReason || undefined,
      goNoGoDecision: decision
    }).subscribe({
      next: t => {
        this.tender = { ...this.tender, ...t };
        this.savingGoNoGo = false;
        this.notification.onDefault('Go/No-Go decision saved.');
      },
      error: () => {
        this.savingGoNoGo = false;
        this.notification.onError('Failed to save decision.');
      }
    });
  }
}
