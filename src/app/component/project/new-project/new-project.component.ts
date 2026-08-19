// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../services/project.service';

@Component({
  standalone: false,
  selector: 'app-new-project',
  templateUrl: './new-project.component.html',
  styleUrls: ['./new-project.component.scss']
})
export class NewProjectComponent implements OnInit {
  form: FormGroup;
  customers: any[] = [];
  editingId: number | null = null;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      customerId: [null],
      startDate: [null],
      endDate: [null],
      status: ['DRAFT'],
      budget: [0]
    });
  }

  ngOnInit(): void {
    this.projectService.getCustomers().subscribe(c => this.customers = c);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId = Number(id);
      this.projectService.getById(this.editingId).subscribe(p => this.form.patchValue(p));
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const value = this.form.value;
    const request$ = this.editingId
      ? this.projectService.update(this.editingId, value)
      : this.projectService.create(value);
    request$.subscribe({
      next: (project) => {
        this.saving = false;
        this.router.navigate(['/projects', project.id]);
      },
      error: () => { this.saving = false; }
    });
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }
}
