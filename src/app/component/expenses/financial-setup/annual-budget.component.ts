import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BudgetService } from '../services/budget.service';

@Component({
  standalone: false,
  selector: 'app-annual-budget',
  templateUrl: './annual-budget.component.html',
  styleUrls: ['./annual-budget.component.scss']
})
export class AnnualBudgetComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  years = Array.from({ length: 6 }, (_, i) => this.currentYear - i + 1);

  budgetLines: any[] = [];
  loading = false;
  saving = false;
  successMsg = '';
  errorMsg = '';

  get incomeLines() { return this.budgetLines.filter(l => l.accountType === 'INCOME' || l.accountType === 'OTHER_INCOME'); }
  get cogsLines()   { return this.budgetLines.filter(l => l.accountType === 'COGS'); }
  get expenseLines(){ return this.budgetLines.filter(l => l.accountType === 'OPERATING_EXPENSE' || l.accountType === 'OTHER_EXPENSE'); }

  get totalIncomeBudget(): number {
    return this.incomeLines.reduce((sum, l) => sum + (+l.budgetedAmount || 0), 0);
  }
  get totalExpenseBudget(): number {
    return this.cogsLines.concat(this.expenseLines).reduce((sum, l) => sum + (+l.budgetedAmount || 0), 0);
  }
  get netBudget(): number {
    return this.totalIncomeBudget - this.totalExpenseBudget;
  }

  constructor(private budgetService: BudgetService) {}

  ngOnInit(): void {
    this.loadBudget();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBudget(): void {
    this.loading = true;
    this.budgetService.getBudgetForYear(this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.budgetLines = (res.data?.budgets || []).map((b: any) => ({ ...b }));
        },
        error: () => { this.loading = false; }
      });
  }

  onYearChange(): void {
    this.loadBudget();
  }

  save(): void {
    this.saving = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.budgetService.bulkSave(this.selectedYear, this.budgetLines)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.successMsg = 'Budget saved successfully.';
          this.loadBudget();
        },
        error: (err: any) => {
          this.saving = false;
          this.errorMsg = err?.error?.message || 'Failed to save budget.';
        }
      });
  }

  formatCurrency(val: any): string {
    return 'R ' + (+val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
