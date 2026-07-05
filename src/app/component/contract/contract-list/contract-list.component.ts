// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { Router } from '@angular/router';
import { ContractService } from '../services/contract.service';
import {
  Contract, ContractStats, ContractStatus, ContractType, ContractEnumItem
} from '../models/contract.model';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';

@Component({
  standalone: false,
  selector: 'app-contract-list',
  templateUrl: './contract-list.component.html',
  styleUrls: ['./contract-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractListComponent implements OnInit {

  contracts: Contract[] = [];
  stats: ContractStats = {
    draft: 0, pending_approval: 0, active: 0, expiring_soon: 0,
    expired: 0, terminated: 0, renewed: 0,
    expiring30Days: 0, expiring90Days: 0, expiring180Days: 0,
    totalFinancialLiability: undefined
  };

  loading = false;
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  searchTerm = '';
  statusFilter: ContractStatus | '' = '';
  typeFilter: ContractType | '' = '';

  statuses: ContractEnumItem[] = [];
  types: ContractEnumItem[] = [];

  isAdmin = false;

  readonly statusTabs = [
    { value: '' as ContractStatus | '', label: 'All' },
    { value: 'ACTIVE' as ContractStatus, label: 'Active' },
    { value: 'EXPIRING_SOON' as ContractStatus, label: 'Expiring Soon' },
    { value: 'PENDING_APPROVAL' as ContractStatus, label: 'Pending Approval' },
    { value: 'DRAFT' as ContractStatus, label: 'Draft' },
    { value: 'EXPIRED' as ContractStatus, label: 'Expired' },
    { value: 'TERMINATED' as ContractStatus, label: 'Terminated' }
  ];

  constructor(
    private contractSvc: ContractService,
    private notification: NotificationService,
    private userSvc: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.userSvc.getUserFromLocalCache();
    this.isAdmin = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN', 'ROLE_MANAGER']
      .includes(user?.role || '');
    this.loadMeta();
    this.loadStats();
    this.loadContracts();
  }

  loadMeta(): void {
    this.contractSvc.getStatuses().subscribe(s => { this.statuses = s; this.cdr.markForCheck(); });
    this.contractSvc.getTypes().subscribe(t => { this.types = t; this.cdr.markForCheck(); });
  }

  loadStats(): void {
    this.contractSvc.getStats().subscribe({
      next: s => { this.stats = s; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  loadContracts(): void {
    this.loading = true;
    this.contractSvc.search({
      page: this.currentPage,
      size: this.pageSize,
      status: this.statusFilter || undefined,
      contractType: this.typeFilter || undefined,
      search: this.searchTerm || undefined,
      sortBy: 'createdAt',
      sortDir: 'DESC'
    }).subscribe({
      next: result => {
        this.contracts = result.contracts;
        this.totalElements = result.totalElements;
        this.totalPages = result.totalPages;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notification.onError('Failed to load contracts');
        this.cdr.markForCheck();
      }
    });
  }

  onStatusFilter(status: ContractStatus | ''): void {
    this.statusFilter = status;
    this.currentPage = 0;
    this.loadContracts();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 0;
    this.loadContracts();
  }

  onTypeChange(type: string): void {
    this.typeFilter = type as ContractType | '';
    this.currentPage = 0;
    this.loadContracts();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadContracts();
  }

  goToDetail(contract: Contract): void {
    this.router.navigate(['/contracts', contract.id]);
  }

  goToNew(): void {
    this.router.navigate(['/contracts/new']);
  }

  getStatusClass(status: ContractStatus | undefined): string {
    const map: Record<string, string> = {
      DRAFT: 'badge-soft-secondary',
      PENDING_APPROVAL: 'badge-soft-warning',
      ACTIVE: 'badge-soft-success',
      EXPIRING_SOON: 'badge-soft-warning',
      EXPIRED: 'badge-soft-danger',
      TERMINATED: 'badge-soft-danger',
      RENEWED: 'badge-soft-info'
    };
    return map[status || ''] || 'badge-soft-secondary';
  }

  getTypeClass(type: ContractType | undefined): string {
    const map: Record<string, string> = {
      SERVICE: 'badge-soft-primary',
      SUPPLIER: 'badge-soft-info',
      NDA: 'badge-soft-warning',
      EMPLOYMENT: 'badge-soft-success',
      LEASE: 'badge-soft-secondary',
      MAINTENANCE: 'badge-soft-primary',
      OTHER: 'badge-soft-secondary'
    };
    return map[type || ''] || 'badge-soft-secondary';
  }

  formatCurrency(value: number | undefined): string {
    if (value == null) return 'R 0.00';
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}
