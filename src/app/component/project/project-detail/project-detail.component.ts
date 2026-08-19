// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../services/project.service';
import { Project, ProjectTask, TaskStatus, TaskComment } from '../models/project.model';

@Component({
  standalone: false,
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  activeTab: 'overview' | 'tasks' | 'financials' = 'overview';
  taskView: 'list' | 'kanban' = 'list';
  loading = false;

  // New-task form state
  newTaskTitle = '';
  newTaskPriority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

  readonly taskStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  // Task comment thread (nested per-task expand) — not part of the Task 6/7 brief's
  // verbatim TypeScript, added to support the comment thread described in the
  // brief's HTML prose (mirrors contract-detail's own message thread handling).
  expandedTaskId: number | null = null;
  newCommentBody = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  load(id: number): void {
    this.loading = true;
    this.projectService.getById(id).subscribe({
      next: (p) => { this.project = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  tasksByStatus(status: TaskStatus): ProjectTask[] {
    return (this.project?.tasks ?? []).filter(t => t.status === status);
  }

  addTask(): void {
    if (!this.project || !this.newTaskTitle.trim()) return;
    this.projectService.createTask(this.project.id, { title: this.newTaskTitle, priority: this.newTaskPriority }).subscribe(task => {
      this.project!.tasks = [...(this.project!.tasks ?? []), task];
      this.newTaskTitle = '';
    });
  }

  changeTaskStatus(task: ProjectTask, status: TaskStatus): void {
    if (!this.project) return;
    this.projectService.updateTaskStatus(this.project.id, task.id, status).subscribe(updated => {
      task.status = updated.status;
    });
  }

  deleteTask(task: ProjectTask): void {
    if (!this.project) return;
    this.projectService.deleteTask(this.project.id, task.id).subscribe(() => {
      this.project!.tasks = (this.project!.tasks ?? []).filter(t => t.id !== task.id);
    });
  }

  editProject(): void {
    if (!this.project) return;
    this.router.navigate(['/projects', this.project.id, 'edit']);
  }

  // ── Task comment thread (nested expand) ─────────────────────────────────
  toggleComments(task: ProjectTask): void {
    if (this.expandedTaskId === task.id) {
      this.expandedTaskId = null;
      return;
    }
    this.expandedTaskId = task.id;
    this.newCommentBody = '';
    if (!this.project) return;
    this.projectService.getComments(this.project.id, task.id).subscribe(comments => {
      task.comments = comments;
    });
  }

  addTaskComment(task: ProjectTask): void {
    if (!this.project || !this.newCommentBody.trim()) return;
    this.projectService.addComment(this.project.id, task.id, this.newCommentBody).subscribe((comment: TaskComment) => {
      task.comments = [...(task.comments ?? []), comment];
      this.newCommentBody = '';
    });
  }
}
