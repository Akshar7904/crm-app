// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EmployeeService } from 'src/app/service/employee.service';
import { Employee } from 'src/app/component/employee/employee.model';

@Component({
  standalone: false,
  selector: 'app-employee-salary',
  templateUrl: './employee-salary.component.html',
  styleUrls: ['./employee-salary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeSalaryComponent implements OnInit {
  employees: Employee[] = [];
  allEmployees: Employee[] = [];
  isLoading = true;
  searchTerm = '';

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    // ✅ FIXED: Using corrected EmployeeService with proper endpoint
    this.employeeService.employees$(0).subscribe({
      next: response => {
        console.log('✅ Employees loaded for salary view:', response);
        // Extract employees - backend returns { employees: [...] }, not paginated content
        this.allEmployees = (response.data as any).employees || response.data.content || [];
        this.employees = [...this.allEmployees];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('❌ Error loading employees:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.employees = [...this.allEmployees];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.employees = this.allEmployees.filter(emp =>
        emp.firstName?.toLowerCase().includes(term) ||
        emp.lastName?.toLowerCase().includes(term) ||
        emp.employeeId?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term)
      );
    }
    this.cdr.markForCheck();
  }

  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  }

  trackById = (index: number, item: any) => item.id;
}
