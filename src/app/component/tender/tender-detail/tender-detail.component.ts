// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TenderService } from '../services/tender.service';
import { EmployeeService } from '../../../service/employee.service';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';
import { Tender, TenderTaskItem, TenderRequirement, TenderPricingLine, TenderBidDocument, TenderFollowUp } from '../models/tender.model';

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

  // Role gating — mirrors project-detail.component.ts: only Manager+ may
  // mutate tender data (edit/add/finalise/go-no-go/delete); the backend
  // enforces the same @PreAuthorize("hasAnyRole(...MANAGER...)") guard.
  isManagerOrAbove = false;
  isAdminOrAbove = false;

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
    protected notification: NotificationService,
    private userSvc: UserService
  ) {}

  ngOnInit(): void {
    const user = this.userSvc.getUserFromLocalCache();
    this.isManagerOrAbove = ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN'].includes(user?.roleName || '');
    this.isAdminOrAbove = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN'].includes(user?.roleName || '');
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
        this.postBidForm = { outcome: t.outcome, outcomeReason: t.outcomeReason || '', lessonLearned: t.lessonLearned || '' };
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

  // Delete confirm state
  deletingTaskId: number | null = null;

  confirmDeleteTask(task: TenderTaskItem): void {
    this.deletingTaskId = task.id;
  }

  cancelDeleteTask(): void {
    this.deletingTaskId = null;
  }

  executeDeleteTask(task: TenderTaskItem): void {
    if (!this.tender) return;
    this.tenderService.deleteTask(this.tender.id, task.id).subscribe({
      next: () => { this.deletingTaskId = null; this.reload(); this.notification.onDefault('Task removed.'); },
      error: () => { this.deletingTaskId = null; this.notification.onError('Failed to delete task.'); }
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

  // Delete confirm state
  deletingRequirementId: number | null = null;

  confirmDeleteRequirement(req: TenderRequirement): void {
    this.deletingRequirementId = req.id;
  }

  cancelDeleteRequirement(): void {
    this.deletingRequirementId = null;
  }

  executeDeleteRequirement(req: TenderRequirement): void {
    if (!this.tender) return;
    this.tenderService.deleteRequirement(this.tender.id, req.id).subscribe({
      next: () => { this.deletingRequirementId = null; this.reload(); this.notification.onDefault('Requirement removed.'); },
      error: () => { this.deletingRequirementId = null; this.notification.onError('Failed to delete requirement.'); }
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

  // Delete confirm state
  deletingPricingLineId: number | null = null;

  confirmDeletePricingLine(line: TenderPricingLine): void {
    this.deletingPricingLineId = line.id;
  }

  cancelDeletePricingLine(): void {
    this.deletingPricingLineId = null;
  }

  executeDeletePricingLine(line: TenderPricingLine): void {
    if (!this.tender) return;
    this.tenderService.deletePricingLine(this.tender.id, line.id).subscribe({
      next: () => { this.deletingPricingLineId = null; this.reload(); this.notification.onDefault('Pricing line removed.'); },
      error: () => { this.deletingPricingLineId = null; this.notification.onError('Failed to delete pricing line.'); }
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

  // Delete confirm state
  deletingBidDocumentId: number | null = null;

  confirmDeleteBidDocument(doc: TenderBidDocument): void {
    this.deletingBidDocumentId = doc.id;
  }

  cancelDeleteBidDocument(): void {
    this.deletingBidDocumentId = null;
  }

  executeDeleteBidDocument(doc: TenderBidDocument): void {
    if (!this.tender) return;
    this.tenderService.deleteBidDocument(this.tender.id, doc.id).subscribe({
      next: () => { this.deletingBidDocumentId = null; this.reload(); this.notification.onDefault('Document removed.'); },
      error: () => { this.deletingBidDocumentId = null; this.notification.onError('Failed to delete document.'); }
    });
  }

  // ── Submission ─────────────────────────────────────────────────────────
  savingSubmissionChecks = false;
  exportingBid = false;

  get submissionReadinessChecks(): { label: string; ready: boolean }[] {
    if (!this.tender) return [];
    const allReqsComplete = !!this.tender.requirements?.length && this.tender.requirements.every(r => r.status === 'COMPLETE');
    return [
      { label: 'Go/No-Go approved', ready: this.tender.goNoGoDecision === 'GO' },
      { label: 'All requirements completed', ready: allReqsComplete },
      { label: 'Bid documents attached', ready: !!this.tender.bidDocuments?.length },
      { label: 'Pricing finalised', ready: !!this.tender.pricingFinalised }
    ];
  }

  toggleSubmissionCheck(field: 'execSignOffRecorded' | 'fileNamesAndOrderChecked' | 'portalUploadTestCompleted' | 'proofOfSubmissionSaved'): void {
    if (!this.tender) return;
    this.tender[field] = !this.tender[field];
    this.savingSubmissionChecks = true;
    this.tenderService.updateSubmissionChecks(this.tender.id, {
      execSignOffRecorded: !!this.tender.execSignOffRecorded,
      fileNamesAndOrderChecked: !!this.tender.fileNamesAndOrderChecked,
      portalUploadTestCompleted: !!this.tender.portalUploadTestCompleted,
      proofOfSubmissionSaved: !!this.tender.proofOfSubmissionSaved
    }).subscribe({
      next: t => { this.tender = { ...this.tender, ...t }; this.savingSubmissionChecks = false; },
      error: () => { this.savingSubmissionChecks = false; this.notification.onError('Failed to save submission checks.'); }
    });
  }

  exportBid(): void {
    if (!this.tender) return;
    this.exportingBid = true;
    this.tenderService.exportBid(this.tender.id).subscribe({
      next: blob => {
        this.exportingBid = false;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tender-bid-${this.tender!.tenderReference || this.tender!.id}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: () => { this.exportingBid = false; this.notification.onError('Failed to export bid.'); }
    });
  }

  printSubmissionChecklist(): void {
    window.print();
  }

  // ── Post-bid ────────────────────────────────────────────────────────────
  showFollowUpModal = false;
  followUpForm = this.emptyFollowUpForm();
  savingFollowUp = false;

  postBidForm: { outcome: Tender['outcome']; outcomeReason: string; lessonLearned: string } = { outcome: 'PENDING', outcomeReason: '', lessonLearned: '' };
  savingPostBid = false;

  private emptyFollowUpForm() {
    return { description: '', dueDate: '' };
  }

  openAddFollowUpModal(): void {
    this.followUpForm = this.emptyFollowUpForm();
    this.showFollowUpModal = true;
  }

  closeFollowUpModal(): void { this.showFollowUpModal = false; }

  submitFollowUp(): void {
    if (!this.tender || !this.followUpForm.description.trim()) return;
    this.savingFollowUp = true;
    this.tenderService.createFollowUp(this.tender.id, {
      description: this.followUpForm.description,
      dueDate: this.followUpForm.dueDate || undefined
    }).subscribe({
      next: () => { this.savingFollowUp = false; this.showFollowUpModal = false; this.reload(); this.notification.onDefault('Follow-up added.'); },
      error: () => { this.savingFollowUp = false; this.notification.onError('Failed to add follow-up.'); }
    });
  }

  toggleFollowUpStatus(followUp: TenderFollowUp): void {
    if (!this.tender) return;
    const status = followUp.status === 'OPEN' ? 'DONE' : 'OPEN';
    this.tenderService.updateFollowUp(this.tender.id, followUp.id, { status }).subscribe({
      next: () => this.reload(),
      error: () => this.notification.onError('Failed to update follow-up.')
    });
  }

  // Delete confirm state
  deletingFollowUpId: number | null = null;

  confirmDeleteFollowUp(followUp: TenderFollowUp): void {
    this.deletingFollowUpId = followUp.id;
  }

  cancelDeleteFollowUp(): void {
    this.deletingFollowUpId = null;
  }

  executeDeleteFollowUp(followUp: TenderFollowUp): void {
    if (!this.tender) return;
    this.tenderService.deleteFollowUp(this.tender.id, followUp.id).subscribe({
      next: () => { this.deletingFollowUpId = null; this.reload(); this.notification.onDefault('Follow-up removed.'); },
      error: () => { this.deletingFollowUpId = null; this.notification.onError('Failed to delete follow-up.'); }
    });
  }

  submitPostBid(): void {
    if (!this.tender) return;
    this.savingPostBid = true;
    this.tenderService.updatePostBid(this.tender.id, {
      outcome: this.postBidForm.outcome,
      outcomeReason: this.postBidForm.outcomeReason || undefined,
      lessonLearned: this.postBidForm.lessonLearned || undefined
    }).subscribe({
      next: t => { this.tender = { ...this.tender, ...t }; this.savingPostBid = false; this.notification.onDefault('Outcome saved.'); },
      error: () => { this.savingPostBid = false; this.notification.onError('Failed to save outcome.'); }
    });
  }
}
