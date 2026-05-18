// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BankingService } from '../services/banking.service';
import { NotificationService } from '../../../service/notification.service';
import {
  BankAccount, BankTransaction, BankingStats,
  BankAccountType, BankTransactionType,
  ACCOUNT_TYPE_LABELS, TRANSACTION_CATEGORIES
} from '../models/banking.model';

@Component({
  standalone: false,
  selector: 'app-banking',
  templateUrl: './banking.component.html',
  styleUrls: ['./banking.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankingComponent implements OnInit {

  // Accounts list
  accounts: BankAccount[] = [];
  stats: BankingStats = { total: 0, active: 0, totalBalance: 0 };
  loading = false;
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 20;
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }

  // Selected account & transactions
  selectedAccount: BankAccount | null = null;
  transactions: BankTransaction[] = [];
  txPage = 0;
  txTotalPages = 0;
  txTotalElements = 0;
  loadingTx = false;

  // Modals
  showAccountModal = false;
  showTxModal = false;
  editingAccount: BankAccount | null = null;
  submitting = false;

  // Forms
  accountForm: Partial<BankAccount> = this.blankAccount();
  txForm: Partial<BankTransaction> = this.blankTx();

  readonly accountTypes: BankAccountType[] = ['CURRENT', 'SAVINGS', 'CREDIT'];
  readonly accountTypeLabels = ACCOUNT_TYPE_LABELS;
  readonly txCategories = TRANSACTION_CATEGORIES;

  constructor(
    private bankingService: BankingService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  // ======================== ACCOUNTS ========================

  loadAccounts(): void {
    this.loading = true;
    this.bankingService.getAccounts$(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        const p = res?.data?.page;
        this.accounts = p?.content ?? [];
        this.totalPages = p?.totalPages ?? 0;
        this.totalElements = p?.totalElements ?? 0;
        this.stats = res?.data?.stats ?? this.stats;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  selectAccount(account: BankAccount): void {
    this.selectedAccount = account;
    this.txPage = 0;
    this.loadTransactions();
  }

  openCreateAccount(): void {
    this.editingAccount = null;
    this.accountForm = this.blankAccount();
    this.showAccountModal = true;
    this.cdr.markForCheck();
  }

  openEditAccount(account: BankAccount, event: Event): void {
    event.stopPropagation();
    this.editingAccount = account;
    this.accountForm = { ...account };
    this.showAccountModal = true;
    this.cdr.markForCheck();
  }

  saveAccount(): void {
    if (!this.accountForm.name || !this.accountForm.bankName || !this.accountForm.accountNumber) {
      this.notification.onWarning('Please fill in all required fields.');
      return;
    }
    this.submitting = true;
    const call$ = this.editingAccount
      ? this.bankingService.updateAccount$(this.accountForm as BankAccount)
      : this.bankingService.createAccount$(this.accountForm as BankAccount);

    call$.subscribe({
      next: () => {
        this.notification.onSuccess(this.editingAccount ? 'Account updated.' : 'Account created.');
        this.showAccountModal = false;
        this.submitting = false;
        this.loadAccounts();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notification.onError(err?.error?.message ?? 'Failed to save account.');
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleAccount(account: BankAccount, event: Event): void {
    event.stopPropagation();
    this.bankingService.toggleAccount$(account.id!).subscribe({
      next: () => {
        this.notification.onSuccess(`Account ${account.active ? 'deactivated' : 'activated'}.`);
        this.loadAccounts();
      },
      error: () => this.notification.onError('Failed to update account status.')
    });
  }

  deleteAccount(account: BankAccount, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete "${account.name}"? This cannot be undone.`)) return;
    this.bankingService.deleteAccount$(account.id!).subscribe({
      next: () => {
        this.notification.onSuccess('Account deleted.');
        if (this.selectedAccount?.id === account.id) { this.selectedAccount = null; this.transactions = []; }
        this.loadAccounts();
        this.cdr.markForCheck();
      },
      error: (err) => this.notification.onError(err?.error?.message ?? 'Failed to delete account.')
    });
  }

  goPage(p: number): void {
    this.currentPage = p;
    this.loadAccounts();
  }

  // ======================== TRANSACTIONS ========================

  loadTransactions(): void {
    if (!this.selectedAccount?.id) return;
    this.loadingTx = true;
    this.bankingService.getTransactions$(this.selectedAccount.id, this.txPage, 20).subscribe({
      next: (res) => {
        const p = res?.data?.page;
        this.transactions = p?.content ?? [];
        this.txTotalPages = p?.totalPages ?? 0;
        this.txTotalElements = p?.totalElements ?? 0;
        // refresh the selected account balance
        const fresh = res?.data?.account;
        if (fresh) { this.selectedAccount = fresh; }
        this.loadingTx = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingTx = false; this.cdr.markForCheck(); }
    });
  }

  openAddTransaction(): void {
    if (!this.selectedAccount) return;
    this.txForm = this.blankTx();
    this.showTxModal = true;
    this.cdr.markForCheck();
  }

  saveTransaction(): void {
    if (!this.txForm.description || !this.txForm.amount || !this.txForm.type || !this.txForm.date) {
      this.notification.onWarning('Please fill in all required fields.');
      return;
    }
    this.txForm.bankAccount = { id: this.selectedAccount!.id! };
    this.submitting = true;
    this.bankingService.createTransaction$(this.txForm as BankTransaction).subscribe({
      next: () => {
        this.notification.onSuccess('Transaction recorded.');
        this.showTxModal = false;
        this.submitting = false;
        this.loadTransactions();
        this.loadAccounts();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notification.onError(err?.error?.message ?? 'Failed to save transaction.');
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  reconcile(tx: BankTransaction): void {
    if (tx.reconciled) return;
    this.bankingService.reconcileTransaction$(tx.id!).subscribe({
      next: () => {
        this.notification.onSuccess('Transaction reconciled.');
        this.loadTransactions();
      },
      error: () => this.notification.onError('Failed to reconcile.')
    });
  }

  deleteTransaction(tx: BankTransaction): void {
    if (!confirm('Delete this transaction? The account balance will be reversed.')) return;
    this.bankingService.deleteTransaction$(tx.id!).subscribe({
      next: () => {
        this.notification.onSuccess('Transaction deleted.');
        this.loadTransactions();
        this.loadAccounts();
        this.cdr.markForCheck();
      },
      error: (err) => this.notification.onError(err?.error?.message ?? 'Failed to delete.')
    });
  }

  goTxPage(p: number): void {
    this.txPage = p;
    this.loadTransactions();
  }

  get txPages(): number[] { return Array.from({ length: this.txTotalPages }, (_, i) => i); }

  // ======================== HELPERS ========================

  closeAccountModal(): void { this.showAccountModal = false; this.cdr.markForCheck(); }
  closeTxModal(): void { this.showTxModal = false; this.cdr.markForCheck(); }

  formatBalance(val: number | undefined): string {
    if (val == null) return 'R 0.00';
    return 'R ' + Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private blankAccount(): Partial<BankAccount> {
    return { name: '', bankName: '', accountNumber: '', accountType: 'CURRENT', openingBalance: 0, currency: 'ZAR', active: true, notes: '' };
  }

  private blankTx(): Partial<BankTransaction> {
    return { date: new Date().toISOString().split('T')[0], description: '', amount: 0, type: 'CREDIT', reference: '', category: '', reconciled: false };
  }
}
