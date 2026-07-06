// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ContractService } from '../services/contract.service';
import { CompanyService } from '../../../service/company.service';
import {
  Contract, ApprovalStep, DocumentMeta, ContractObligation,
  ContractMessage, ContractSignature, ContractVersion
} from '../models/contract.model';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';
import { jsPDF as JsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type DetailTab = 'overview' | 'content' | 'obligations' | 'messages' | 'documents' | 'approvals' | 'versions' | 'signatures';

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
  currentUserName = '';
  companyLogoUrl = '';
  companyName = '';
  downloading = false;

  activeTab: DetailTab = 'overview';

  // Modals
  showTerminateModal = false;
  showRenewModal = false;
  showAddStepModal = false;
  showApproveModal = false;
  showRejectModal = false;
  showObligationModal = false;
  showMessageModal = false;
  showSignModal = false;
  showVersionModal = false;
  selectedVersion: ContractVersion | null = null;

  actioningStepId: number | null = null;
  actionComment = '';
  terminateReason = '';

  renewForm: FormGroup;
  stepForm: FormGroup;
  obligationForm: FormGroup;
  messageForm: FormGroup;

  uploading = false;
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractSvc: ContractService,
    private companySvc: CompanyService,
    private notification: NotificationService,
    private userSvc: UserService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.renewForm = this.fb.group({
      endDate: ['', Validators.required],
      renewalDate: [''],
      value: [null],
      renewalNotes: ['', Validators.required]
    });

    this.stepForm = this.fb.group({
      stepOrder: [1, [Validators.required, Validators.min(1)]],
      approverId: [null],
      approverName: ['', Validators.required],
      approverRole: ['']
    });

    this.obligationForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      obligationType: ['GENERAL'],
      party: ['OUR_COMPANY'],
      dueDate: [''],
      recurring: [false],
      recurrenceDays: [null],
      assignedToName: ['']
    });

    this.messageForm = this.fb.group({
      messageType: ['INTERNAL'],
      subject: [''],
      body: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const user = this.userSvc.getUserFromLocalCache();
    this.isAdmin = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN', 'ROLE_MANAGER']
      .includes(user?.role || '');
    this.currentUserId = user?.id || null;
    this.currentUserName = user ? `${user.firstName} ${user.lastName}` : '';
    if (user?.companyId) {
      this.companyLogoUrl = this.companySvc.getLogoUrl(user.companyId);
    }
    this.companySvc.getMyCompany$().subscribe({
      next: r => { this.companyName = r?.data?.name || r?.name || ''; this.cdr.markForCheck(); },
      error: () => {}
    });
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

  setTab(tab: DetailTab): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  // ── Status Actions ──────────────────────────────────────────────────────
  submitForApproval(): void {
    if (!this.contract?.id) return;
    this.contractSvc.submit(this.contract.id).subscribe({
      next: c => { this.contract = c; this.notification.onSuccess('Contract submitted for approval'); this.cdr.markForCheck(); },
      error: e => this.notification.onError(e?.error?.message || 'Failed to submit')
    });
  }

  activateContract(): void {
    if (!this.contract?.id) return;
    this.contractSvc.activate(this.contract.id).subscribe({
      next: c => { this.contract = c; this.notification.onSuccess('Contract activated'); this.cdr.markForCheck(); },
      error: e => this.notification.onError(e?.error?.message || 'Failed to activate')
    });
  }

  terminateContract(): void {
    if (!this.contract?.id || !this.terminateReason.trim()) return;
    this.contractSvc.terminate(this.contract.id, this.terminateReason).subscribe({
      next: c => {
        this.contract = c; this.showTerminateModal = false; this.terminateReason = '';
        this.notification.onSuccess('Contract terminated — you will be notified to upload the performance review report');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to terminate')
    });
  }

  renewContract(): void {
    if (!this.contract?.id || this.renewForm.invalid) return;
    this.contractSvc.renew(this.contract.id, this.renewForm.value).subscribe({
      next: c => {
        this.contract = c; this.showRenewModal = false; this.renewForm.reset();
        this.notification.onSuccess('Contract renewed');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to renew')
    });
  }

  signContract(): void {
    if (!this.contract?.id) return;
    const user = this.userSvc.getUserFromLocalCache();
    this.contractSvc.sign(this.contract.id, user?.role).subscribe({
      next: c => {
        this.contract = c; this.showSignModal = false;
        this.notification.onSuccess('Contract digitally signed');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to sign')
    });
  }

  // ── Approval Steps ──────────────────────────────────────────────────────
  addStep(): void {
    if (!this.contract?.id || this.stepForm.invalid) return;
    this.contractSvc.addApprovalStep(this.contract.id, this.stepForm.value).subscribe({
      next: c => {
        this.contract = c; this.showAddStepModal = false; this.stepForm.reset({ stepOrder: 1 });
        this.notification.onSuccess('Approval step added');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to add step')
    });
  }

  openApprove(step: ApprovalStep): void { this.actioningStepId = step.id!; this.actionComment = ''; this.showApproveModal = true; }
  openReject(step: ApprovalStep): void { this.actioningStepId = step.id!; this.actionComment = ''; this.showRejectModal = true; }

  confirmApprove(): void {
    if (!this.contract?.id || !this.actioningStepId) return;
    this.contractSvc.approveStep(this.contract.id, this.actioningStepId, this.actionComment).subscribe({
      next: c => { this.contract = c; this.showApproveModal = false; this.notification.onSuccess('Step approved'); this.cdr.markForCheck(); },
      error: e => this.notification.onError(e?.error?.message || 'Failed to approve')
    });
  }

  confirmReject(): void {
    if (!this.contract?.id || !this.actioningStepId) return;
    this.contractSvc.rejectStep(this.contract.id, this.actioningStepId, this.actionComment).subscribe({
      next: c => { this.contract = c; this.showRejectModal = false; this.notification.onError('Step rejected — contract returned to Draft'); this.cdr.markForCheck(); },
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
        this.selectedFile = null; this.uploading = false;
        this.notification.onSuccess('Document uploaded');
        this.cdr.markForCheck();
      },
      error: e => { this.uploading = false; this.notification.onError(e?.error?.message || 'Upload failed'); this.cdr.markForCheck(); }
    });
  }

  downloadDocument(doc: DocumentMeta): void {
    if (!this.contract?.id) return;
    window.open(this.contractSvc.getDocumentUrl(this.contract.id, doc.id), '_blank');
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

  // ── Obligations ──────────────────────────────────────────────────────────
  addObligation(): void {
    if (!this.contract?.id || this.obligationForm.invalid) return;
    this.contractSvc.addObligation(this.contract.id, this.obligationForm.value).subscribe({
      next: o => {
        this.contract!.obligations = [...(this.contract!.obligations || []), o];
        this.showObligationModal = false; this.obligationForm.reset({ obligationType: 'GENERAL', party: 'OUR_COMPANY' });
        this.notification.onSuccess('Obligation added');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to add obligation')
    });
  }

  completeObligation(o: ContractObligation): void {
    if (!this.contract?.id || !o.id) return;
    this.contractSvc.completeObligation(this.contract.id, o.id).subscribe({
      next: updated => {
        this.contract!.obligations = (this.contract!.obligations || []).map(ob => ob.id === updated.id ? updated : ob);
        this.notification.onSuccess('Obligation marked complete');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed')
    });
  }

  deleteObligation(o: ContractObligation): void {
    if (!this.contract?.id || !o.id) return;
    this.contractSvc.deleteObligation(this.contract.id, o.id).subscribe({
      next: () => {
        this.contract!.obligations = (this.contract!.obligations || []).filter(ob => ob.id !== o.id);
        this.notification.onSuccess('Obligation deleted');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed')
    });
  }

  // ── Messages ─────────────────────────────────────────────────────────────
  sendMessage(): void {
    if (!this.contract?.id || this.messageForm.invalid) return;
    this.contractSvc.sendMessage(this.contract.id, {
      ...this.messageForm.value,
      senderName: this.currentUserName,
      senderId: this.currentUserId || undefined
    }).subscribe({
      next: m => {
        this.contract!.messages = [...(this.contract!.messages || []), m];
        this.messageForm.reset({ messageType: 'INTERNAL' });
        this.notification.onSuccess('Message sent');
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to send')
    });
  }

  // ── Versions ─────────────────────────────────────────────────────────────
  viewVersion(v: ContractVersion): void { this.selectedVersion = v; this.showVersionModal = true; this.cdr.markForCheck(); }

  restoreVersion(v: ContractVersion): void {
    if (!this.contract?.id || !v.id) return;
    if (!confirm(`Restore version ${v.versionNumber}? Current contract will be saved as a new version.`)) return;
    this.contractSvc.restoreVersion(this.contract.id, v.id).subscribe({
      next: c => {
        this.contract = c; this.showVersionModal = false;
        this.notification.onSuccess(`Restored to version ${v.versionNumber}`);
        this.cdr.markForCheck();
      },
      error: e => this.notification.onError(e?.error?.message || 'Restore failed')
    });
  }

  // ── Print / Download / Delete ─────────────────────────────────────────────
  printContract(): void {
    if (!this.contract) return;
    const c = this.contract;
    const logoTag = this.companyLogoUrl
      ? `<img src="${this.companyLogoUrl}" style="max-height:60px;max-width:180px;object-fit:contain" onerror="this.style.display='none'">`
      : '';
    const meta = (label: string, value: string) =>
      `<div><div style="font-size:7.5pt;text-transform:uppercase;letter-spacing:.5px;color:#888;margin-bottom:2px">${label}</div><div style="font-weight:500">${value}</div></div>`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${c.title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:10.5pt;color:#1a1a2e;padding:20mm 22mm}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #2563eb;padding-bottom:14px;margin-bottom:18px}
  .co-name{font-size:13pt;font-weight:700;color:#2563eb;margin-top:4px}
  .ref{font-size:8.5pt;color:#666;text-align:right;line-height:1.6}
  h1{font-size:17pt;font-weight:700;text-align:center;margin:14px 0}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;background:#f8fafc;padding:14px;border-radius:6px;margin:14px 0}
  .sec{font-size:11pt;font-weight:700;margin:18px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:5px}
  .body{font-size:10pt;line-height:1.85}
  .body-plain{white-space:pre-wrap;word-break:break-word}
  .sig-row{display:flex;gap:20px;margin-top:18px}
  .sig-box{flex:1;border-top:1px solid #000;padding-top:8px;font-size:9pt;line-height:1.5}
  .ftr{margin-top:30px;font-size:8pt;color:#999;display:flex;justify-content:space-between;border-top:1px solid #eee;padding-top:6px}
  @media print{@page{size:A4;margin:15mm 20mm}body{padding:0}}
</style></head><body>
<div class="hdr">
  <div>${logoTag}${this.companyName ? `<div class="co-name">${this.companyName}</div>` : ''}</div>
  <div class="ref">
    Ref: ${c.contractNumber || 'N/A'}<br>
    Status: ${c.statusDisplay || c.status || ''}<br>
    Generated: ${new Date().toLocaleDateString('en-ZA')}
  </div>
</div>
<h1>${c.title}</h1>
<div class="meta">
  ${meta('Contract Type', c.contractTypeDisplay || c.contractType || '')}
  ${meta('Counterparty', c.counterpartyName || '—')}
  ${meta('Start Date', c.startDate || '—')}
  ${meta('End Date', c.endDate || '—')}
  ${meta('Value', this.formatCurrency(c.value))}
  ${meta('Currency', c.currency || 'ZAR')}
  ${meta('Owner', c.ownerName || '—')}
  ${meta('Department', c.department || '—')}
</div>
${c.description ? `<div class="sec">Scope / Description</div><p class="body">${c.description}</p>` : ''}
${c.content ? `<div class="sec">Contract Terms &amp; Conditions</div><div class="body">${c.content}</div>` : ''}
${c.signatures?.length ? `<div class="sec">Signatures</div><div class="sig-row">
  ${c.signatures.map(s => `<div class="sig-box"><strong>${s.signerName}</strong><br>${s.signerRole || ''}<br><span style="color:#666;font-size:8pt">${s.signedAt ? new Date(s.signedAt).toLocaleDateString('en-ZA') : ''}</span></div>`).join('')}
</div>` : ''}
<div class="ftr"><span>ORION — LKCentrix HR &amp; Payroll Management System</span><span>${c.contractNumber}</span></div>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { this.notification.onError('Pop-up blocked — allow pop-ups to print'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  }

  async downloadPdf(): Promise<void> {
    if (!this.contract) return;
    this.downloading = true;
    this.cdr.markForCheck();
    try {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;padding:30px 40px;background:#fff;font-family:Arial,sans-serif;font-size:10pt;color:#1a1a2e;line-height:1.7';
      const c = this.contract;
      const logoTag = this.companyLogoUrl
        ? `<img src="${this.companyLogoUrl}" crossorigin="anonymous" style="max-height:55px;max-width:160px;object-fit:contain" onerror="this.style.display='none'">`
        : '';
      const meta = (l: string, v: string) =>
        `<div><div style="font-size:7.5pt;text-transform:uppercase;color:#888;letter-spacing:.5px;margin-bottom:2px">${l}</div><div style="font-weight:500">${v}</div></div>`;

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #2563eb;padding-bottom:12px;margin-bottom:16px">
          <div>${logoTag}${this.companyName ? `<div style="font-size:13pt;font-weight:700;color:#2563eb;margin-top:4px">${this.companyName}</div>` : ''}</div>
          <div style="text-align:right;font-size:8.5pt;color:#666;line-height:1.6">Ref: ${c.contractNumber || 'N/A'}<br>Status: ${c.statusDisplay || ''}<br>${new Date().toLocaleDateString('en-ZA')}</div>
        </div>
        <div style="font-size:17pt;font-weight:700;text-align:center;margin:14px 0">${c.title}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;background:#f8fafc;padding:14px;border-radius:6px;margin-bottom:16px">
          ${meta('Type', c.contractTypeDisplay || '')}
          ${meta('Counterparty', c.counterpartyName || '—')}
          ${meta('Start Date', c.startDate || '—')}
          ${meta('End Date', c.endDate || '—')}
          ${meta('Value', this.formatCurrency(c.value))}
          ${meta('Owner', c.ownerName || '—')}
        </div>
        ${c.content ? `<div style="font-size:11pt;font-weight:700;border-bottom:1px solid #e5e7eb;padding-bottom:5px;margin:16px 0 10px">Contract Terms</div><div style="font-size:10pt;line-height:1.85">${c.content}</div>` : ''}`;

      document.body.appendChild(el);
      const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false });
      document.body.removeChild(el);

      const doc = new JsPDF('p', 'mm', 'a4');
      const pdfW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let y = 0;
      while (y < imgH) {
        if (y > 0) doc.addPage();
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -y, pdfW, imgH);
        y += pageH;
      }
      doc.save(`${c.contractNumber || c.title.replace(/\s+/g, '-')}.pdf`);
    } catch {
      this.notification.onError('Failed to generate PDF');
    } finally {
      this.downloading = false;
      this.cdr.markForCheck();
    }
  }

  deleteContract(): void {
    if (!this.contract?.id) return;
    if (!confirm(`Delete "${this.contract.title}"? This action cannot be undone.`)) return;
    this.contractSvc.delete(this.contract.id).subscribe({
      next: () => { this.notification.onSuccess('Contract deleted'); this.router.navigate(['/contracts']); },
      error: e => this.notification.onError(e?.error?.message || 'Failed to delete')
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  goBack(): void { this.router.navigate(['/contracts']); }
  goToEdit(): void { if (this.contract?.id) this.router.navigate(['/contracts', this.contract.id, 'edit']); }

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

  getObligationClass(status: string | undefined): string {
    const map: Record<string, string> = {
      PENDING: 'badge-soft-warning', COMPLETED: 'badge-soft-success', OVERDUE: 'badge-soft-danger'
    };
    return map[status || ''] || 'badge-soft-secondary';
  }

  getMessageTypeClass(type: string | undefined): string {
    return type === 'EXTERNAL' ? 'badge-soft-info' : type === 'SYSTEM' ? 'badge-soft-secondary' : 'badge-soft-primary';
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

  canApproveStep(step: ApprovalStep): boolean { return step.status === 'PENDING' && this.isAdmin; }
  alreadySigned(): boolean { return (this.contract?.signatures || []).some(s => s.signerId === this.currentUserId); }

  get safeContent(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.contract?.content || '');
  }

  get tabCounts() {
    return {
      obligations: this.contract?.obligations?.length || 0,
      messages: this.contract?.messages?.filter(m => !m.read).length || 0,
      documents: this.contract?.documents?.length || 0,
      approvals: this.contract?.approvalSteps?.length || 0,
      versions: this.contract?.versions?.length || 0,
      signatures: this.contract?.signatures?.length || 0
    };
  }
}
