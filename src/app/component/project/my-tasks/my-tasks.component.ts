// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../services/project.service';
import { ProjectTask, TaskStatus } from '../models/project.model';

@Component({
  standalone: false,
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss']
})
export class MyTasksComponent implements OnInit {
  tasks: ProjectTask[] = [];
  loading = false;

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void {
    this.loading = true;
    this.projectService.getMyTasks().subscribe({
      next: (tasks) => { this.tasks = tasks; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  changeStatus(task: ProjectTask, status: TaskStatus): void {
    this.projectService.updateTaskStatus(task.projectId, task.id, status).subscribe(updated => {
      task.status = updated.status;
    });
  }

  openProject(task: ProjectTask): void {
    this.router.navigate(['/projects', task.projectId]);
  }
}
