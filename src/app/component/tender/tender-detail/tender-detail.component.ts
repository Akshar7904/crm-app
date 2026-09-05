// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TenderService } from '../services/tender.service';
import { EmployeeService } from '../../../service/employee.service';
import { NotificationService } from '../../../service/notification.service';
import { Tender, TenderTaskItem, TenderRequirement, TenderPricingLine, TenderBidDocument } from '../models/tender.model';

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

  // ── Tasks ──────────────────────────────────────────────────────────────
  showTaskModal = false;
  editingTaskId: number | null = null;
  taskForm = this.emptyTaskForm();
  savingTask = false;

  private emptyTaskForm() {
    return { description: '', allocatedToId: null as number | null, allocatedToName: '', dueDate: '', status: 'NOT_STARTED' as TenderTaskItem['status'] };
  }

  openAddTaskModal(): void {
    this.taskForm = this.emptyTaskForm();
    this.editingTaskId = null;
    this.showTaskModal = true;
  }

  openEditTaskModal(task: TenderTaskItem): void {
    this.taskForm = { description: task.description, allocatedToId: task.allocatedToId ?? null, allocatedToName: task.allocatedToName || '', dueDate: task.dueDate || '', status: task.status };
    this.editingTaskId = task.id;
    this.showTaskModal = true;
  }

  closeTaskModal(): void { this.showTaskModal = false; }

  onTaskAllocatedToChange(employeeId: string): void {
    const emp = this.employees.find(e => String(e.id) === employeeId);
    this.taskForm.allocatedToId = emp ? emp.id : null;
    this.taskForm.allocatedToName = emp ? `${emp.firstName} ${emp.lastName}` : '';
  }

  submitTask(): void {
    if (!this.tender || !this.taskForm.description.trim()) return;
    this.savingTask = true;
    const body = {
      description: this.taskForm.description,
      allocatedToId: this.taskForm.allocatedToId ?? undefined,
      allocatedToName: this.taskForm.allocatedToName || undefined,
      dueDate: this.taskForm.dueDate || undefined,
      status: this.taskForm.status
    };
    const req = this.editingTaskId
      ? this.tenderService.updateTask(this.tender.id, this.editingTaskId, body)
      : this.tenderService.createTask(this.tender.id, body);
    req.subscribe({
      next: () => { this.savingTask = false; this.showTaskModal = false; this.reload(); this.notification.onDefault('Task saved.'); },
      error: () => { this.savingTask = false; this.notification.onError('Failed to save task.'); }
    });
  }

  deleteTask(task: TenderTaskItem): void {
    if (!this.tender) return;
    this.tenderService.deleteTask(this.tender.id, task.id).subscribe({
      next: () => { this.reload(); this.notification.onDefault('Task removed.'); },
      error: () => this.notification.onError('Failed to delete task.')
    });
  }

  // ── Requirements ───────────────────────────────────────────────────────
  showRequirementModal = false;
  editingRequirementId: number | null = null;
  requirementForm = this.emptyRequirementForm();
  savingRequirement = false;

  private emptyRequirementForm() {
    return { type: 'MANDATORY' as TenderRequirement['type'], description: '', ownerId: null as number | null, ownerName: '', status: 'NOT_STARTED' as TenderRequirement['status'] };
  }

  openAddRequirementModal(): void {
    this.requirementForm = this.emptyRequirementForm();
    this.editingRequirementId = null;
    this.showRequirementModal = true;
  }

  openEditRequirementModal(req: TenderRequirement): void {
    this.requirementForm = { type: req.type, description: req.description, ownerId: req.ownerId ?? null, ownerName: req.ownerName || '', status: req.status };
    this.editingRequirementId = req.id;
    this.showRequirementModal = true;
  }

  closeRequirementModal(): void { this.showRequirementModal = false; }

  onRequirementOwnerChange(employeeId: string): void {
    const emp = this.employees.find(e => String(e.id) === employeeId);
    this.requirementForm.ownerId = emp ? emp.id : null;
    this.requirementForm.ownerName = emp ? `${emp.firstName} ${emp.lastName}` : '';
  }

  submitRequirement(): void {
    if (!this.tender || !this.requirementForm.description.trim()) return;
    this.savingRequirement = true;
    const body = {
      type: this.requirementForm.type,
      description: this.requirementForm.description,
      ownerId: this.requirementForm.ownerId ?? undefined,
      ownerName: this.requirementForm.ownerName || undefined,
      status: this.requirementForm.status
    };
    const req = this.editingRequirementId
      ? this.tenderService.updateRequirement(this.tender.id, this.editingRequirementId, body)
      : this.tenderService.createRequirement(this.tender.id, body);
    req.subscribe({
      next: () => { this.savingRequirement = false; this.showRequirementModal = false; this.reload(); this.notification.onDefault('Requirement saved.'); },
      error: () => { this.savingRequirement = false; this.notification.onError('Failed to save requirement.'); }
    });
  }

  deleteRequirement(req: TenderRequirement): void {
    if (!this.tender) return;
    this.tenderService.deleteRequirement(this.tender.id, req.id).subscribe({
      next: () => { this.reload(); this.notification.onDefault('Requirement removed.'); },
      error: () => this.notification.onError('Failed to delete requirement.')
    });
  }

  // ── Pricing ────────────────────────────────────────────────────────────
  showPricingLineModal = false;
  editingPricingLineId: number | null = null;
  pricingLineForm = this.emptyPricingLineForm();
  savingPricingLine = false;
  finalisingPricing = false;

  private emptyPricingLineForm() {
    return { itemName: '', description: '', quantity: 1, supplierName: '', supplierReference: '', unitCost: 0, vatRate: 15, profitMarkupPercent: 0 };
  }

  openAddPricingLineModal(): void {
    this.pricingLineForm = this.emptyPricingLineForm();
    this.editingPricingLineId = null;
    this.showPricingLineModal = true;
  }

  openEditPricingLineModal(line: TenderPricingLine): void {
    this.pricingLineForm = {
      itemName: line.itemName, description: line.description || '', quantity: line.quantity,
      supplierName: line.supplierName || '', supplierReference: line.supplierReference || '',
      unitCost: line.unitCost, vatRate: line.vatRate, profitMarkupPercent: line.profitMarkupPercent
    };
    this.editingPricingLineId = line.id;
    this.showPricingLineModal = true;
  }

  closePricingLineModal(): void { this.showPricingLineModal = false; }

  submitPricingLine(): void {
    if (!this.tender || !this.pricingLineForm.itemName.trim()) return;
    this.savingPricingLine = true;
    const body = { ...this.pricingLineForm };
    const req = this.editingPricingLineId
      ? this.tenderService.updatePricingLine(this.tender.id, this.editingPricingLineId, body)
      : this.tenderService.createPricingLine(this.tender.id, body);
    req.subscribe({
      next: () => { this.savingPricingLine = false; this.showPricingLineModal = false; this.reload(); this.notification.onDefault('Pricing line saved.'); },
      error: () => { this.savingPricingLine = false; this.notification.onError('Failed to save pricing line.'); }
    });
  }

  deletePricingLine(line: TenderPricingLine): void {
    if (!this.tender) return;
    this.tenderService.deletePricingLine(this.tender.id, line.id).subscribe({
      next: () => { this.reload(); this.notification.onDefault('Pricing line removed.'); },
      error: () => this.notification.onError('Failed to delete pricing line.')
    });
  }

  finalisePricing(): void {
    if (!this.tender) return;
    this.finalisingPricing = true;
    this.tenderService.finalisePricing(this.tender.id).subscribe({
      next: t => { this.tender = { ...this.tender, ...t }; this.finalisingPricing = false; this.notification.onDefault('Bid price finalised.'); },
      error: () => { this.finalisingPricing = false; this.notification.onError('Failed to finalise pricing.'); }
    });
  }

  // ── Bid Documents ──────────────────────────────────────────────────────
  showBidDocumentModal = false;
  bidDocumentModalMode: 'add' | 'edit' = 'add';
  editingBidDocumentId: number | null = null;
  bidDocumentForm = this.emptyBidDocumentForm();
  bidDocumentFile: File | null = null;
  savingBidDocument = false;
  replacingBidDocumentId: number | null = null;

  private emptyBidDocumentForm() {
    return { category: 'COVER_LETTER' as TenderBidDocument['category'], displayName: '', description: '' };
  }

  get bidDocumentDisplayNameRequired(): boolean {
    return this.bidDocumentForm.category === 'OTHER';
  }

  openAddBidDocumentModal(): void {
    this.bidDocumentForm = this.emptyBidDocumentForm();
    this.bidDocumentFile = null;
    this.bidDocumentModalMode = 'add';
    this.editingBidDocumentId = null;
    this.showBidDocumentModal = true;
  }

  openEditBidDocumentModal(doc: TenderBidDocument): void {
    this.bidDocumentForm = { category: doc.category, displayName: doc.displayName || '', description: doc.description || '' };
    this.bidDocumentModalMode = 'edit';
    this.editingBidDocumentId = doc.id;
    this.showBidDocumentModal = true;
  }

  closeBidDocumentModal(): void { this.showBidDocumentModal = false; }

  onBidDocumentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bidDocumentFile = input.files?.length ? input.files[0] : null;
  }

  submitBidDocument(): void {
    if (!this.tender) return;
    if (this.bidDocumentDisplayNameRequired && !this.bidDocumentForm.displayName.trim()) return;
    this.savingBidDocument = true;
    if (this.bidDocumentModalMode === 'add') {
      if (!this.bidDocumentFile) { this.savingBidDocument = false; return; }
      this.tenderService.createBidDocument(this.tender.id, this.bidDocumentFile, this.bidDocumentForm.category, this.bidDocumentForm.displayName, this.bidDocumentForm.description).subscribe({
        next: () => { this.savingBidDocument = false; this.showBidDocumentModal = false; this.reload(); this.notification.onDefault('Document uploaded.'); },
        error: () => { this.savingBidDocument = false; this.notification.onError('Failed to upload document.'); }
      });
    } else if (this.editingBidDocumentId) {
      this.tenderService.updateBidDocument(this.tender.id, this.editingBidDocumentId, this.bidDocumentForm).subscribe({
        next: () => { this.savingBidDocument = false; this.showBidDocumentModal = false; this.reload(); this.notification.onDefault('Document updated.'); },
        error: () => { this.savingBidDocument = false; this.notification.onError('Failed to update document.'); }
      });
    }
  }

  onReplaceFileSelected(doc: TenderBidDocument, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!this.tender || !input.files?.length) return;
    this.replacingBidDocumentId = doc.id;
    this.tenderService.replaceBidDocument(this.tender.id, doc.id, input.files[0]).subscribe({
      next: () => { this.replacingBidDocumentId = null; this.reload(); this.notification.onDefault('Document replaced.'); },
      error: () => { this.replacingBidDocumentId = null; this.notification.onError('Failed to replace document.'); }
    });
  }

  viewBidDocument(doc: TenderBidDocument): void {
    if (!this.tender) return;
    this.tenderService.downloadBidDocument(this.tender.id, doc.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      },
      error: () => this.notification.onError('Failed to open document.')
    });
  }

  downloadBidDocumentFile(doc: TenderBidDocument): void {
    if (!this.tender) return;
    this.tenderService.downloadBidDocument(this.tender.id, doc.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName || 'document';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: () => this.notification.onError('Failed to download document.')
    });
  }

  deleteBidDocument(doc: TenderBidDocument): void {
    if (!this.tender) return;
    this.tenderService.deleteBidDocument(this.tender.id, doc.id).subscribe({
      next: () => { this.reload(); this.notification.onDefault('Document removed.'); },
      error: () => this.notification.onError('Failed to delete document.')
    });
  }
}
