import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PayrollService, PayrollStats } from 'src/app/service/payroll.service';

@Component({
  selector: 'app-payroll-stats',
  templateUrl: './payroll-stats.component.html',
  styleUrls: ['./payroll-stats.component.scss']
})
export class PayrollStatsComponent implements OnInit {
  stats: PayrollStats | null = null;
  isLoading = true;

  constructor(
    private payrollService: PayrollService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.payrollService.getPayrollStats().subscribe({
      next: response => {
        this.stats = response.data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error loading stats:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
