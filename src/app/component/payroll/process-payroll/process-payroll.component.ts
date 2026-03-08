import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PayrollService } from 'src/app/service/payroll.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { Employee } from 'src/app/component/employee/employee.model';

@Component({
  standalone: false,
  selector: 'app-process-payroll',
  templateUrl: './process-payroll.component.html',
  styleUrls: ['./process-payroll.component.scss']
})
export class ProcessPayrollComponent implements OnInit {
  processForm: FormGroup;
  employees: Employee[] = [];
  selectedEmployees: Set<number> = new Set();
  isProcessing = false;
  selectAll = false;

  constructor(
    private fb: FormBuilder,
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmployees();
  }

  initializeForm(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    this.processForm = this.fb.group({
      payPeriodStart: [firstDay, Validators.required],
      payPeriodEnd: [lastDay, Validators.required]
    });
  }

  loadEmployees(): void {
    // ✅ FIXED: Using corrected EmployeeService with proper endpoint
    this.employeeService.employees$(0).subscribe({
      next: response => {
        console.log('✅ Employees loaded for bulk processing:', response);
        // Extract employees - backend returns { employees: [...] }, not paginated content
        const allEmployees = (response.data as any).employees || response.data.content || [];
        this.employees = allEmployees.filter(emp => emp.status?.toLowerCase() === 'active');
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('❌ Error loading employees:', err);
        alert('Failed to load employees. Please check console for details.');
      }
    });
  }

  toggleEmployee(employeeId: number): void {
    if (this.selectedEmployees.has(employeeId)) {
      this.selectedEmployees.delete(employeeId);
    } else {
      this.selectedEmployees.add(employeeId);
    }
    this.selectAll = this.selectedEmployees.size === this.employees.length;
    this.cdr.markForCheck();
  }

  toggleAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.employees.forEach(emp => this.selectedEmployees.add(emp.id));
    } else {
      this.selectedEmployees.clear();
    }
    this.cdr.markForCheck();
  }

  processPayroll(): void {
    if (this.processForm.invalid || this.selectedEmployees.size === 0) {
      alert('Please select at least one employee and provide valid dates');
      return;
    }

    if (!confirm(`Process payroll for ${this.selectedEmployees.size} employee(s)?`)) {
      return;
    }

    this.isProcessing = true;
    const formData = this.processForm.value;
    const employeeIds = Array.from(this.selectedEmployees);

    this.payrollService.processBulkPayroll(
      employeeIds,
      formData.payPeriodStart,
      formData.payPeriodEnd
    ).subscribe({
      next: response => {
        alert(`Successfully processed ${response.data.count} payroll(s)`);
        this.router.navigate(['/payroll/list']);
      },
      error: err => {
        this.isProcessing = false;
        alert(`Failed to process payroll: ${err.error?.message || err.message}`);
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/payroll/list']);
  }
}
