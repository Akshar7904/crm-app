// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { TenderService } from '../services/tender.service';
import { TenderReport } from '../models/tender.model';

@Component({
  standalone: false,
  selector: 'app-tender-reporting',
  templateUrl: './tender-reporting.component.html',
  styleUrls: ['./tender-reporting.component.scss']
})
export class TenderReportingComponent implements OnInit {
  report: TenderReport | null = null;
  loading = true;

  constructor(private tenderService: TenderService) {}

  ngOnInit(): void {
    this.tenderService.getReporting().subscribe({
      next: r => { this.report = r; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get pipelineEntries(): { status: string; value: number }[] {
    if (!this.report) return [];
    return Object.entries(this.report.pipelineValueByStatus).map(([status, value]) => ({ status, value }));
  }

  get maxPipelineValue(): number {
    return Math.max(1, ...this.pipelineEntries.map(e => e.value));
  }

  get lossReasonEntries(): { reason: string; count: number; percent: number }[] {
    if (!this.report) return [];
    return Object.entries(this.report.lossReasons).map(([reason, v]) => ({ reason, count: v.count, percent: v.percent }));
  }

  get workloadEntries(): { name: string; count: number }[] {
    if (!this.report) return [];
    return Object.entries(this.report.teamWorkload).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }

  exportReport(): void {
    window.print();
  }
}
