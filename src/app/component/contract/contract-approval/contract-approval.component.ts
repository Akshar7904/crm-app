// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ContractService } from '../services/contract.service';
import { Contract } from '../models/contract.model';
import { NotificationService } from '../../../service/notification.service';

@Component({
  standalone: false,
  selector: 'app-contract-approval',
  templateUrl: './contract-approval.component.html',
  styleUrls: ['./contract-approval.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractApprovalComponent implements OnInit {

  pendingContracts: Contract[] = [];
  loading = true;

  approvingContract: Contract | null = null;
  rejectingContract: Contract | null = null;
  actionComment = '';

  constructor(
    private contractSvc: ContractService,
    private notification: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.loading = true;
    // Load contracts in PENDING_APPROVAL status using search with empty query
    this.contractSvc.search({ status: 'PENDING_APPROVAL', page: 0, size: 50 }).subscribe({
      next: page => {
        this.pendingContracts = page.contracts || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  viewContract(c: Contract): void {
    this.router.navigate(['/contracts', c.id]);
  }

  getPendingStep(c: Contract) {
    return (c.approvalSteps || []).find(s => s.status === 'PENDING');
  }

  openApprove(c: Contract): void {
    this.approvingContract = c;
    this.actionComment = '';
  }

  openReject(c: Contract): void {
    this.rejectingContract = c;
    this.actionComment = '';
  }

  confirmApprove(): void {
    const c = this.approvingContract;
    const step = c ? this.getPendingStep(c) : null;
    if (!c?.id || !step?.id) return;
    this.contractSvc.approveStep(c.id, step.id, this.actionComment).subscribe({
      next: () => {
        this.approvingContract = null;
        this.notification.onSuccess('Step approved');
        this.loadPending();
      },
      error: e => this.notification.onError(e?.error?.message || 'Approval failed')
    });
  }

  confirmReject(): void {
    const c = this.rejectingContract;
    const step = c ? this.getPendingStep(c) : null;
    if (!c?.id || !step?.id || !this.actionComment.trim()) return;
    this.contractSvc.rejectStep(c.id, step.id, this.actionComment).subscribe({
      next: () => {
        this.rejectingContract = null;
        this.notification.onError('Rejected — contract returned to Draft');
        this.loadPending();
      },
      error: e => this.notification.onError(e?.error?.message || 'Rejection failed')
    });
  }

  formatCurrency(value: number | undefined): string {
    if (value == null) return '—';
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }
}
