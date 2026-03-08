import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OpeningBalanceService } from '../services/opening-balance.service';

@Component({
  standalone: false,
  selector: 'app-opening-balance',
  templateUrl: './opening-balance.component.html',
  styleUrls: ['./opening-balance.component.scss']
})
export class OpeningBalanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  years = Array.from({ length: 6 }, (_, i) => this.currentYear - i + 1);

  form: any = {
    year: this.currentYear,
    cashBalance: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    otherAssets: 0,
    otherLiabilities: 0,
    notes: ''
  };

  allBalances: any[] = [];
  loading = false;
  saving = false;
  successMsg = '';
  errorMsg = '';

  get netOpeningPosition(): number {
    return (
      (+this.form.cashBalance || 0) +
      (+this.form.accountsReceivable || 0) -
      (+this.form.accountsPayable || 0) +
      (+this.form.otherAssets || 0) -
      (+this.form.otherLiabilities || 0)
    );
  }

  constructor(private openingBalanceService: OpeningBalanceService) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadForYear(this.selectedYear);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAll(): void {
    this.openingBalanceService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => { this.allBalances = res.data?.balances || []; },
        error: () => {}
      });
  }

  loadForYear(year: number): void {
    this.form.year = year;
    this.openingBalanceService.getByYear(year)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const b = res.data?.balance;
          if (b) {
            this.form = {
              ...b,
              cashBalance: b.cashBalance || 0,
              accountsReceivable: b.accountsReceivable || 0,
              accountsPayable: b.accountsPayable || 0,
              otherAssets: b.otherAssets || 0,
              otherLiabilities: b.otherLiabilities || 0
            };
          } else {
            this.resetForm(year);
          }
        },
        error: () => this.resetForm(year)
      });
  }

  onYearChange(): void {
    this.loadForYear(this.selectedYear);
  }

  resetForm(year: number): void {
    this.form = { year, cashBalance: 0, accountsReceivable: 0, accountsPayable: 0, otherAssets: 0, otherLiabilities: 0, notes: '' };
  }

  save(): void {
    this.saving = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.openingBalanceService.save({ ...this.form, year: this.selectedYear })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.successMsg = 'Opening balance saved successfully.';
          this.loadAll();
          this.loadForYear(this.selectedYear);
        },
        error: (err: any) => {
          this.saving = false;
          this.errorMsg = err?.error?.message || 'Failed to save opening balance.';
        }
      });
  }
}
