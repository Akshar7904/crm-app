// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ContractService } from '../services/contract.service';
import { Contract } from '../models/contract.model';

@Component({
  standalone: false,
  selector: 'app-contract-alerts',
  templateUrl: './contract-alerts.component.html',
  styleUrls: ['./contract-alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractAlertsComponent implements OnInit {

  expiring30: Contract[] = [];
  expiring60: Contract[] = [];
  expiring90: Contract[] = [];
  loading = true;

  activeWindow: 30 | 60 | 90 = 30;

  constructor(
    private contractSvc: ContractService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.contractSvc.getExpiring(90).subscribe({
      next: contracts => {
        const today = new Date();
        const d30 = this.addDays(today, 30);
        const d60 = this.addDays(today, 60);
        const d90 = this.addDays(today, 90);

        this.expiring30 = contracts.filter(c => {
          const end = c.endDate ? new Date(c.endDate) : null;
          return end && end <= d30;
        });
        this.expiring60 = contracts.filter(c => {
          const end = c.endDate ? new Date(c.endDate) : null;
          return end && end > d30 && end <= d60;
        });
        this.expiring90 = contracts.filter(c => {
          const end = c.endDate ? new Date(c.endDate) : null;
          return end && end > d60 && end <= d90;
        });

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  get activeList(): Contract[] {
    return this.activeWindow === 30 ? this.expiring30
         : this.activeWindow === 60 ? this.expiring60
         : this.expiring90;
  }

  viewContract(c: Contract): void {
    this.router.navigate(['/contracts', c.id]);
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
}
