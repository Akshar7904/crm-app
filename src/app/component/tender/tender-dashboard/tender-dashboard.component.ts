// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TenderService } from '../services/tender.service';
import { EmployeeService } from '../../../service/employee.service';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';
import { Tender, TenderDashboardStats } from '../models/tender.model';

@Component({
  standalone: false,
  selector: 'app-tender-dashboard',
  templateUrl: './tender-dashboard.component.html',
  styleUrls: ['./tender-dashboard.component.scss']
})
export class TenderDashboardComponent implements OnInit {
  tenders: Tender[] = [];
  stats: TenderDashboardStats | null = null;
  loading = true;
  page = 0;
  totalPages = 0;

  employees: any[] = [];

  showAddModal = false;
  saving = false;
  newTender = this.emptyNewTender();

  // Role gating — mirrors project-detail.component.ts: only Manager+ may
  // add tenders; the backend enforces the same
  // @PreAuthorize("hasAnyRole(...MANAGER...)") guard.
  isManagerOrAbove = false;

  constructor(
    private tenderService: TenderService,
    private employeeService: EmployeeService,
    private notification: NotificationService,
    private router: Router,
    private userSvc: UserService
  ) {}

  ngOnInit(): void {
    const user = this.userSvc.getUserFromLocalCache();
    this.isManagerOrAbove = ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN'].includes(user?.roleName || '');
    this.load(0);
    this.tenderService.getDashboardStats().subscribe({ next: s => this.stats = s, error: () => {} });
    this.employeeService.searchEmployees$().subscribe({
      next: (response: any) => { this.employees = response.data?.employees || []; },
      error: () => { /* picker just stays empty — not fatal to the page */ }
    });
  }

  load(page: number): void {
    this.loading = true;
    this.tenderService.getAll({ page, size: 20 }).subscribe({
      next: p => { this.tenders = p.content; this.page = p.number; this.totalPages = p.totalPages; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.load(page);
  }

  openTender(id: number): void {
    this.router.navigate(['/tenders', id]);
  }

  private emptyNewTender() {
    return { title: '', issuingOrganisation: '', tenderReference: '', closingDate: '', bidLeadId: null as number | null, bidLeadName: '', goNoGoOwnerId: null as number | null, goNoGoOwnerName: '' };
  }

  openAddModal(): void {
    this.newTender = this.emptyNewTender();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onBidLeadChange(employeeId: string): void {
    const emp = this.employees.find(e => String(e.id) === employeeId);
    this.newTender.bidLeadId = emp ? emp.id : null;
    this.newTender.bidLeadName = emp ? `${emp.firstName} ${emp.lastName}` : '';
  }

  onGoNoGoOwnerChange(employeeId: string): void {
    const emp = this.employees.find(e => String(e.id) === employeeId);
    this.newTender.goNoGoOwnerId = emp ? emp.id : null;
    this.newTender.goNoGoOwnerName = emp ? `${emp.firstName} ${emp.lastName}` : '';
  }

  submitNewTender(): void {
    if (!this.newTender.title.trim()) return;
    this.saving = true;
    this.tenderService.create({
      title: this.newTender.title,
      issuingOrganisation: this.newTender.issuingOrganisation || undefined,
      tenderReference: this.newTender.tenderReference || undefined,
      closingDate: this.newTender.closingDate || undefined,
      bidLeadId: this.newTender.bidLeadId || undefined,
      bidLeadName: this.newTender.bidLeadName || undefined,
      goNoGoOwnerId: this.newTender.goNoGoOwnerId || undefined,
      goNoGoOwnerName: this.newTender.goNoGoOwnerName || undefined
    }).subscribe({
      next: t => {
        this.saving = false;
        this.showAddModal = false;
        this.notification.onDefault('Tender created.');
        this.router.navigate(['/tenders', t.id]);
      },
      error: () => {
        this.saving = false;
        this.notification.onError('Failed to create tender.');
      }
    });
  }

  closingCountdownDays(tender: Tender): number | null {
    if (!tender.closingDate) return null;
    return Math.ceil((new Date(tender.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }
}
