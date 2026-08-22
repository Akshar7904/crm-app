// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ProjectService } from '../services/project.service';
import { Project, ProjectTask, TaskStatus, TaskComment, Milestone, MilestoneStatus } from '../models/project.model';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';

@Component({
  standalone: false,
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  activeTab: 'overview' | 'tasks' | 'milestones' | 'financials' = 'overview';
  taskView: 'list' | 'kanban' = 'list';
  loading = false;

  // New-task form state
  newTaskTitle = '';
  newTaskPriority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  newTaskMilestoneId: number | null = null;

  readonly taskStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  readonly milestoneStatuses: MilestoneStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'COMPLETED'];

  // Milestones
  milestones: Milestone[] = [];
  isManagerOrAbove = false;
  newMilestoneName = '';
  newMilestoneTargetDate = '';
  newMilestoneDependsOn: number | null = null;
  taskMilestoneFilter: number | 'all' | 'none' = 'all';
  selectedAttachmentFile: File | null = null;

  // Task comment thread (nested per-task expand) — not part of the Task 6/7 brief's
  // verbatim TypeScript, added to support the comment thread described in the
  // brief's HTML prose (mirrors contract-detail's own message thread handling).
  expandedTaskId: number | null = null;
  newCommentBody = '';

  // Kanban drag-and-drop — one stable array per column so @angular/cdk's
  // moveItemInArray/transferArrayItem can mutate them directly (the plain
  // tasksByStatus() filter below is recomputed fresh every call, so it isn't
  // a stable enough reference for cdkDropListData; kanbanColumns is rebuilt
  // from project.tasks whenever the task list changes and is what the
  // Kanban view actually renders/drags).
  kanbanColumns: { status: TaskStatus; tasks: ProjectTask[] }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private notification: NotificationService,
    private userSvc: UserService
  ) {}

  ngOnInit(): void {
    const user = this.userSvc.getUserFromLocalCache();
    this.isManagerOrAbove = ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN'].includes(user?.roleName || '');
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  load(id: number): void {
    this.loading = true;
    this.projectService.getById(id).subscribe({
      next: (p) => { this.project = p; this.milestones = p.milestones ?? []; this.loading = false; this.rebuildKanbanColumns(); },
      error: () => { this.loading = false; }
    });
  }

  tasksByStatus(status: TaskStatus): ProjectTask[] {
    return (this.project?.tasks ?? []).filter(t => t.status === status);
  }

  private rebuildKanbanColumns(): void {
    const tasks = this.project?.tasks ?? [];
    this.kanbanColumns = this.taskStatuses.map(status => ({
      status,
      tasks: tasks
        .filter(t => t.status === status)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    }));
  }

  addTask(): void {
    if (!this.project || !this.newTaskTitle.trim()) return;
    this.projectService.createTask(this.project.id, { title: this.newTaskTitle, priority: this.newTaskPriority, milestoneId: this.newTaskMilestoneId ?? undefined }).subscribe(task => {
      this.project!.tasks = [...(this.project!.tasks ?? []), task];
      this.newTaskTitle = '';
      this.newTaskMilestoneId = null;
      this.rebuildKanbanColumns();
    });
  }

  changeTaskStatus(task: ProjectTask, status: TaskStatus): void {
    if (!this.project) return;
    this.projectService.updateTaskStatus(this.project.id, task.id, status).subscribe(updated => {
      task.status = updated.status;
      this.rebuildKanbanColumns();
    });
  }

  deleteTask(task: ProjectTask): void {
    if (!this.project) return;
    this.projectService.deleteTask(this.project.id, task.id).subscribe(() => {
      this.project!.tasks = (this.project!.tasks ?? []).filter(t => t.id !== task.id);
      this.rebuildKanbanColumns();
    });
  }

  // ── Kanban drag-and-drop ─────────────────────────────────────────────────
  // Dropping within a column reorders it (persists sortOrder); dropping into
  // a different column changes status (and persists sortOrder for its new
  // position). Both go through the same updateTask endpoint, which already
  // accepts and stores both fields. Applied optimistically — the card moves
  // immediately — and rolled back with an error toast if the API call fails.
  onTaskDrop(event: CdkDragDrop<ProjectTask[]>, targetStatus: TaskStatus): void {
    if (!this.project) return;
    const sameColumn = event.previousContainer === event.container;
    if (sameColumn && event.previousIndex === event.currentIndex) return;

    const sourceSnapshot = [...event.previousContainer.data];
    const destSnapshot = sameColumn ? sourceSnapshot : [...event.container.data];

    let movedTask: ProjectTask;
    if (sameColumn) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      movedTask = event.container.data[event.currentIndex];
    } else {
      movedTask = event.previousContainer.data[event.previousIndex];
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      movedTask.status = targetStatus;
    }

    // Reindex the affected column(s) and collect every task whose sortOrder
    // actually changed as a result of the drop (usually 1-3 tasks, not the
    // whole column).
    const updates: ProjectTask[] = [];
    const reindex = (tasks: ProjectTask[]) => {
      tasks.forEach((t, i) => {
        if (t.sortOrder !== i) {
          t.sortOrder = i;
          updates.push(t);
        }
      });
    };
    reindex(event.container.data);
    if (!sameColumn) reindex(event.previousContainer.data);
    if (!updates.includes(movedTask)) updates.push(movedTask); // always persist the moved task itself

    const rollback = (): void => {
      event.previousContainer.data.splice(0, event.previousContainer.data.length, ...sourceSnapshot);
      if (!sameColumn) event.container.data.splice(0, event.container.data.length, ...destSnapshot);
      this.notification.onError('Failed to move task — change reverted');
    };

    let failed = false;
    updates.forEach(t => {
      this.projectService.updateTask(this.project!.id, t.id, { status: t.status, sortOrder: t.sortOrder }).subscribe({
        error: () => {
          if (!failed) { failed = true; rollback(); }
        }
      });
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

  // ── Milestones ───────────────────────────────────────────────────────────
  addMilestone(): void {
    if (!this.project || !this.newMilestoneName.trim() || !this.newMilestoneTargetDate) return;
    this.projectService.createMilestone(this.project.id, {
      name: this.newMilestoneName,
      targetDate: this.newMilestoneTargetDate,
      dependsOnMilestoneId: this.newMilestoneDependsOn ?? undefined
    }).subscribe({
      next: (milestone) => {
        this.milestones = [...this.milestones, milestone];
        this.newMilestoneName = '';
        this.newMilestoneTargetDate = '';
        this.newMilestoneDependsOn = null;
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to create milestone')
    });
  }

  changeMilestoneStatus(milestone: Milestone, status: MilestoneStatus): void {
    if (!this.project) return;
    this.projectService.updateMilestoneStatus(this.project.id, milestone.id, status).subscribe({
      next: (updated) => {
        this.milestones = this.milestones.map(m => m.id === updated.id ? updated : m);
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to update milestone status')
    });
  }

  deleteMilestone(milestone: Milestone): void {
    if (!this.project) return;
    this.projectService.deleteMilestone(this.project.id, milestone.id).subscribe({
      next: () => {
        this.milestones = this.milestones.filter(m => m.id !== milestone.id);
        // Detached tasks lose their milestoneId server-side — reflect that locally too.
        (this.project!.tasks ?? []).forEach(t => { if (t.milestoneId === milestone.id) t.milestoneId = undefined; });
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to delete milestone')
    });
  }

  onAttachmentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedAttachmentFile = input.files?.[0] || null;
  }

  uploadAttachment(milestone: Milestone): void {
    if (!this.project || !this.selectedAttachmentFile) return;
    this.projectService.uploadMilestoneAttachment(this.project.id, milestone.id, this.selectedAttachmentFile).subscribe({
      next: (attachment) => {
        milestone.attachments = [...(milestone.attachments ?? []), attachment];
        this.selectedAttachmentFile = null;
        this.notification.onSuccess('Attachment uploaded');
      },
      error: e => this.notification.onError(e?.error?.message || 'Upload failed')
    });
  }

  downloadAttachment(milestone: Milestone, attachmentId: number): void {
    if (!this.project) return;
    window.open(this.projectService.getMilestoneAttachmentUrl(this.project.id, milestone.id, attachmentId), '_blank');
  }

  deleteAttachment(milestone: Milestone, attachmentId: number): void {
    if (!this.project) return;
    this.projectService.deleteMilestoneAttachment(this.project.id, milestone.id, attachmentId).subscribe({
      next: () => {
        milestone.attachments = (milestone.attachments ?? []).filter(a => a.id !== attachmentId);
        this.notification.onSuccess('Attachment deleted');
      },
      error: e => this.notification.onError(e?.error?.message || 'Delete failed')
    });
  }

  // ── Tasks tab: milestone filter ─────────────────────────────────────────
  filteredTasksByStatus(status: TaskStatus): ProjectTask[] {
    const tasks = this.tasksByStatus(status);
    if (this.taskMilestoneFilter === 'all') return tasks;
    if (this.taskMilestoneFilter === 'none') return tasks.filter(t => !t.milestoneId);
    return tasks.filter(t => t.milestoneId === this.taskMilestoneFilter);
  }
}
