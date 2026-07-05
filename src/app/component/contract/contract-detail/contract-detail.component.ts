// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractService } from '../services/contract.service';
import { Contract, ApprovalStep, DocumentMeta } from '../models/contract.model';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';
@Component({
  standalone: false,
  selector: 'app-contract-detail',
  templateUrl: './contract-detail.component.html',
  styleUrls: ['./contract-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractDetailComponent implements OnInit {

  contract: Contract | null = null;
  loading = true;
  isAdmin = false;
  currentUserId: number | null = null;

  // Modals
  showTerminateModal = false;
  showRenewModal = false;
  showAddStepModal = false;
  showApproveModal = false;
  showRejectModal = false;

  actioningStepId: number | null = null;
  actionComment = '';
  terminateReason = '';

  renewForm: FormGroup;
  stepForm: FormGroup;

  uploading = false;
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractSvc: ContractService,
    private notification: NotificationService,
    private userSvc: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.renewForm = this.fb.group({
      endDate: ['', Validators.required],
      renewalDate: [''],
      value: [null]
    });
    this.stepForm = this.fb.group({
      stepOrder: [1, [Validators.required, Validators.min(1)]],
      approverId: [null],
      approverName: ['', Validators.required],
      approverRole: ['']
    });
  }

  ngOnInit(): void {
    const user = this.userSvc.getUserFromLocalCache();
    this.isAdmin = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN', 'ROLE_MANAGER']
      .includes(user?.role || '');
    this.currentUserId = user?.id || null;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadContract(id);
  }

  loadContract(id: number): void {
    this.loading = true;
    this.contractSvc.getById(id).subscribe({
      next: c => {
        this.contract = c;
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

  // ── Status Actions ──────────────────────────────────────────────────────
  submitForApproval(): void {
    if (!this.contract?.id) return;
    this.contractSvc.submit(this.contract.id).subscribe({
      next: c => {
        this.contract = c;
        this.notification.onSuccess('Contract submitted for approval');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to submit')
    });
  }

  activateContract(): void {
    if (!this.contract?.id) return;
    this.contractSvc.activate(this.contract.id).subscribe({
      next: c => {
        this.contract = c;
        this.notification.onSuccess('Contract activated');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to activate')
    });
  }

  terminateContract(): void {
    if (!this.contract?.id || !this.terminateReason.trim()) return;
    this.contractSvc.terminate(this.contract.id, this.terminateReason).subscribe({
      next: c => {
        this.contract = c;
        this.showTerminateModal = false;
        this.terminateReason = '';
        this.notification.onSuccess('Contract terminated');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to terminate')
    });
  }

  renewContract(): void {
    if (!this.contract?.id || this.renewForm.invalid) return;
    this.contractSvc.renew(this.contract.id, this.renewForm.value).subscribe({
      next: c => {
        this.contract = c;
        this.showRenewModal = false;
        this.renewForm.reset();
        this.notification.onSuccess('Contract renewed');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to renew')
    });
  }

  // ── Approval Steps ──────────────────────────────────────────────────────
  addStep(): void {
    if (!this.contract?.id || this.stepForm.invalid) return;
    this.contractSvc.addApprovalStep(this.contract.id, this.stepForm.value).subscribe({
      next: c => {
        this.contract = c;
        this.showAddStepModal = false;
        this.stepForm.reset({ stepOrder: 1 });
        this.notification.onSuccess('Approval step added');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to add step')
    });
  }

  openApprove(step: ApprovalStep): void {
    this.actioningStepId = step.id!;
    this.actionComment = '';
    this.showApproveModal = true;
  }

  openReject(step: ApprovalStep): void {
    this.actioningStepId = step.id!;
    this.actionComment = '';
    this.showRejectModal = true;
  }

  confirmApprove(): void {
    if (!this.contract?.id || !this.actioningStepId) return;
    this.contractSvc.approveStep(this.contract.id, this.actioningStepId, this.actionComment).subscribe({
      next: c => {
        this.contract = c;
        this.showApproveModal = false;
        this.notification.onSuccess('Step approved');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to approve')
    });
  }

  confirmReject(): void {
    if (!this.contract?.id || !this.actioningStepId) return;
    this.contractSvc.rejectStep(this.contract.id, this.actioningStepId, this.actionComment).subscribe({
      next: c => {
        this.contract = c;
        this.showRejectModal = false;
        this.notification.onError('Step rejected — contract returned to Draft');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to reject')
    });
  }

  // ── Documents ────────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  uploadDocument(): void {
    if (!this.contract?.id || !this.selectedFile) return;
    this.uploading = true;
    this.contractSvc.uploadDocument(this.contract.id, this.selectedFile).subscribe({
      next: doc => {
        this.contract!.documents = [...(this.contract!.documents || []), doc];
        this.selectedFile = null;
        this.uploading = false;
        this.notification.onSuccess('Document uploaded');
        this.cdr.markForCheck();
      },
      error: e => {
        this.uploading = false;
        this.notification.onError(e?.error?.message || 'Upload failed');
        this.cdr.markForCheck();
      }
    });
  }

  downloadDocument(doc: DocumentMeta): void {
    if (!this.contract?.id) return;
    const url = this.contractSvc.getDocumentUrl(this.contract.id, doc.id);
    window.open(url, '_blank');
  }

  deleteDocument(doc: DocumentMeta): void {
    if (!this.contract?.id) return;
    this.contractSvc.deleteDocument(this.contract.id, doc.id).subscribe({
      next: () => {
        this.contract!.documents = (this.contract!.documents || []).filter(d => d.id !== doc.id);
        this.notification.onSuccess('Document deleted');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Delete failed')
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  goBack(): void { this.router.navigate(['/contracts']); }

  goToEdit(): void {
    if (this.contract?.id) this.router.navigate(['/contracts', this.contract.id, 'edit']);
  }

  getStatusClass(status: string | undefined): string {
    const map: Record<string, string> = {
      DRAFT: 'badge-soft-secondary', PENDING_APPROVAL: 'badge-soft-warning',
      ACTIVE: 'badge-soft-success', EXPIRING_SOON: 'badge-soft-warning',
      EXPIRED: 'badge-soft-danger', TERMINATED: 'badge-soft-danger', RENEWED: 'badge-soft-info'
    };
    return map[status || ''] || 'badge-soft-secondary';
  }

  getStepClass(status: string): string {
    return status === 'APPROVED' ? 'step-approved' : status === 'REJECTED' ? 'step-rejected' : 'step-pending';
  }

  formatCurrency(value: number | undefined): string {
    if (value == null) return 'R 0.00';
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }

  formatBytes(bytes: number | undefined): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  canApproveStep(step: ApprovalStep): boolean {
    return step.status === 'PENDING' && this.isAdmin;
  }
}
