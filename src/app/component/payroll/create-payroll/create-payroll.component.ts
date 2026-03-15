// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PayrollService } from 'src/app/service/payroll.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { Employee } from 'src/app/component/employee/employee.model';

@Component({
  standalone: false,
  selector: 'app-create-payroll',
  templateUrl: './create-payroll.component.html',
  styleUrls: ['./create-payroll.component.scss']
})
export class CreatePayrollComponent implements OnInit {
  payrollForm: FormGroup;
  employees: Employee[] = [];
  isEditMode = false;
  payrollId: number;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmployees();

    this.payrollId = +this.route.snapshot.params['id'];
    if (this.payrollId) {
      this.isEditMode = true;
      this.loadPayroll();
    }
  }

  initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];

    this.payrollForm = this.fb.group({
      employeeId: ['', Validators.required],
      payPeriodStart: ['', Validators.required],
      payPeriodEnd: ['', Validators.required],
      paymentDate: [today, Validators.required],
      basicSalary: [0, [Validators.required, Validators.min(0)]],
      overtimePay: [0, Validators.min(0)],
      bonus: [0, Validators.min(0)],
      allowances: [0, Validators.min(0)],
      commission: [0, Validators.min(0)],
      pensionFund: [0, Validators.min(0)],
      medicalAid: [0, Validators.min(0)],
      otherDeductions: [0, Validators.min(0)],
      daysWorked: [0, Validators.min(0)],
      daysAbsent: [0, Validators.min(0)],
      daysOnLeave: [0, Validators.min(0)],
      overtimeHours: [0, Validators.min(0)],
      remarks: [''],
      paymentMethod: ['BANK_TRANSFER'],
      grossSalary: [{value: 0, disabled: true}, [Validators.required, Validators.min(0)]],
      payeTax: [{value: 0, disabled: true}, [Validators.min(0)]],
      uif: [{value: 0, disabled: true}, [Validators.min(0)]],
      totalDeductions: [{value: 0, disabled: true}, [Validators.min(0)]],
      netSalary: [{value: 0, disabled: true}, [Validators.required, Validators.min(0)]]
    });

    // Add value change listeners for auto-calculation
    this.setupAutoCalculations();
  }

  setupAutoCalculations(): void {
    // Calculate gross salary when earnings change
    const earningsFields = ['basicSalary', 'overtimePay', 'bonus', 'allowances', 'commission'];
    earningsFields.forEach(field => {
      this.payrollForm.get(field)?.valueChanges.subscribe(() => this.calculateGrossSalary());
    });

    // Calculate deductions when they change
    const deductionFields = ['pensionFund', 'medicalAid', 'otherDeductions'];
    deductionFields.forEach(field => {
      this.payrollForm.get(field)?.valueChanges.subscribe(() => this.calculateDeductions());
    });
  }

  calculateTaxes(grossSalary: number): void {
    const annualIncome = grossSalary * 12;
    let annualTax = 0;

    if (annualIncome <= 237100) {
      annualTax = annualIncome * 0.18;
    } else if (annualIncome <= 370500) {
      annualTax = 42678 + (annualIncome - 237100) * 0.26;
    } else if (annualIncome <= 512800) {
      annualTax = 77362 + (annualIncome - 370500) * 0.31;
    } else if (annualIncome <= 673000) {
      annualTax = 121475 + (annualIncome - 512800) * 0.36;
    } else if (annualIncome <= 857900) {
      annualTax = 179147 + (annualIncome - 673000) * 0.39;
    } else if (annualIncome <= 1817000) {
      annualTax = 251258 + (annualIncome - 857900) * 0.41;
    } else {
      annualTax = 644489 + (annualIncome - 1817000) * 0.45;
    }

    const monthlyPAYE = annualTax / 12;

    // UIF (1% of gross up to max R148.72 per month)
    const uif = Math.min(grossSalary * 0.01, 148.72);

    this.payrollForm.get('payeTax')?.setValue(monthlyPAYE, { emitEvent: false });
    this.payrollForm.get('uif')?.setValue(uif, { emitEvent: false });
  }

  calculateDeductions(): void {
    const paye = this.payrollForm.get('payeTax')?.value || 0;
    const uif = this.payrollForm.get('uif')?.value || 0;
    const pension = this.payrollForm.get('pensionFund')?.value || 0;
    const medical = this.payrollForm.get('medicalAid')?.value || 0;
    const other = this.payrollForm.get('otherDeductions')?.value || 0;

    const total = paye + uif + pension + medical + other;
    this.payrollForm.get('totalDeductions')?.setValue(total, { emitEvent: false });

    this.calculateNetSalary();
  }

  calculateNetSalary(): void {
    const gross = this.payrollForm.get('grossSalary')?.value || 0;
    const deductions = this.payrollForm.get('totalDeductions')?.value || 0;

    const net = gross - deductions;
    this.payrollForm.get('netSalary')?.setValue(net, { emitEvent: false });
  }

  loadPayroll(): void {
    this.payrollService.getPayroll(this.payrollId).subscribe({
      next: response => {
        const payroll = response.data.payroll;
        // Enable fields temporarily to set values, then disable readonly fields
        ['grossSalary', 'payeTax', 'uif', 'totalDeductions', 'netSalary'].forEach(field => {
          this.payrollForm.get(field)?.enable();
        });

        this.payrollForm.patchValue(payroll);

        ['grossSalary', 'payeTax', 'uif', 'totalDeductions', 'netSalary'].forEach(field => {
          this.payrollForm.get(field)?.disable();
        });

        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error loading payroll:', err);
        alert('Failed to load payroll');
      }
    });
  }


  calculateGrossSalary(): void {
    const basic = this.payrollForm.get('basicSalary')?.value || 0;
    const overtime = this.payrollForm.get('overtimePay')?.value || 0;
    const bonus = this.payrollForm.get('bonus')?.value || 0;
    const allowances = this.payrollForm.get('allowances')?.value || 0;
    const commission = this.payrollForm.get('commission')?.value || 0;

    const gross = basic + overtime + bonus + allowances + commission;
    this.payrollForm.get('grossSalary')?.setValue(gross, {emitEvent: false});

    // Calculate taxes based on gross
    this.calculateTaxes(gross);
    this.calculateNetSalary();
  }


  /**
   * Load employees using employees$ method (paginated list)
   * Only loads ACTIVE employees for payroll creation
   */
  loadEmployees(): void {
    this.employeeService.employees$(0).subscribe({
      next: response => {
        console.log('Employees Response:', response);

        // Extract employees from response - backend returns { data: { employees: [...], count: N } }
        const data = response?.data as any;
        let allEmployees: Employee[] = [];

        // Check for employees array first (backend returns this)
        if (data?.employees && Array.isArray(data.employees)) {
          allEmployees = data.employees;
        } else if (data?.content && Array.isArray(data.content)) {
          allEmployees = data.content;
        } else if (Array.isArray(data)) {
          allEmployees = data;
        } else {
          allEmployees = [];
        }

        // Filter only ACTIVE employees for payroll
        this.employees = allEmployees.filter((emp: Employee) => {
          const status = emp.status?.toLowerCase();
          return status === 'active';
        });

        console.log('Employees loaded:', this.employees.length, 'active employees');
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error loading employees:', err);
        this.employees = [];
        this.cdr.markForCheck();
      }
    });
  }


  onSubmit(): void {
    if (this.payrollForm.invalid) {
      Object.keys(this.payrollForm.controls).forEach(key => {
        this.payrollForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    const formData = this.payrollForm.value;

    const request$ = this.isEditMode
      ? this.payrollService.updatePayroll(this.payrollId, formData)
      : this.payrollService.createPayroll(formData);

    request$.subscribe({
      next: () => {
        alert(`Payroll ${this.isEditMode ? 'updated' : 'created'} successfully`);
        this.router.navigate(['/payroll/list']);
      },
      error: err => {
        this.isLoading = false;
        alert(`Failed to ${this.isEditMode ? 'update' : 'create'} payroll: ${err.error?.message || err.message}`);
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/payroll/list']);
  }
}
