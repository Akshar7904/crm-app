// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { ProjectService } from '../services/project.service';
import { Project, ProjectTask, TaskStatus, TaskPriority, TaskComment, ProjectTransaction, Milestone, MilestoneAttachment, MilestoneStatus } from '../models/project.model';
import { NotificationService } from '../../../service/notification.service';
import { UserService } from '../../../service/user.service';
import { EmployeeService } from '../../../service/employee.service';

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
  isAdminOrAbove = false;
  newMilestoneName = '';
  newMilestoneTargetDate = '';
  newMilestoneDependsOn: number | null = null;
  taskMilestoneFilter: number | 'all' | 'none' = 'all';
  selectedAttachmentFile: File | null = null;

  // In-app attachment viewer — mirrors employee-detail.component.ts's
  // document viewer (blob URL + DomSanitizer, PDF/image inline, other falls
  // back to a "download to view" message).
  viewingAttachment: { milestone: Milestone; attachment: MilestoneAttachment; safeSrc: SafeResourceUrl | SafeUrl | null; type: 'pdf' | 'image' | 'other' } | null = null;
  private viewerBlobUrl: string | null = null;

  // Milestone edit — the same mini-form used to create a milestone is reused
  // for editing: editingMilestoneId set means "Save" calls update instead of
  // create, and the fields are pre-filled from the milestone being edited.
  editingMilestoneId: number | null = null;
  newMilestoneDescription = '';

  // Financials — add/edit share one form (editingTransactionId set = editing).
  employees: any[] = [];
  editingTransactionId: number | null = null;
  txDate = '';
  txType: 'INCOME' | 'EXPENSE' = 'INCOME';
  txAmount: number | null = null;
  txDescription = '';

  // Task edit modal
  editingTask: ProjectTask | null = null;
  editTaskTitle = '';
  editTaskDescription = '';
  editTaskPriority: TaskPriority = 'MEDIUM';
  editTaskAssigneeId: number | null = null;
  editTaskDueDate = '';
  editTaskMilestoneId: number | null = null;

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
    private userSvc: UserService,
    private sanitizer: DomSanitizer,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    const user = this.userSvc.getUserFromLocalCache();
    this.isManagerOrAbove = ['ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN'].includes(user?.roleName || '');
    this.isAdminOrAbove = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_SUPERADMIN'].includes(user?.roleName || '');
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
    this.employeeService.searchEmployees$().subscribe({
      next: (response: any) => { this.employees = response.data?.employees || []; },
      error: () => { /* assignee picker just stays empty — not fatal to the page */ }
    });
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
      this.refreshMilestones();
    });
  }

  changeTaskStatus(task: ProjectTask, status: TaskStatus): void {
    if (!this.project) return;
    this.projectService.updateTaskStatus(this.project.id, task.id, status).subscribe(updated => {
      task.status = updated.status;
      this.rebuildKanbanColumns();
      this.refreshMilestones();
    });
  }

  deleteTask(task: ProjectTask): void {
    if (!this.project) return;
    this.projectService.deleteTask(this.project.id, task.id).subscribe(() => {
      this.project!.tasks = (this.project!.tasks ?? []).filter(t => t.id !== task.id);
      this.rebuildKanbanColumns();
      this.refreshMilestones();
    });
  }

  // ── Task edit (title/description/priority/assignee/dueDate/milestone) ────
  // Any authenticated user can edit a task, matching the backend's
  // isAuthenticated()-only gate on PUT .../tasks/{id} (the GitHub/GitLab
  // Issues-style collaborative model this feature was built around).
  openTaskEdit(task: ProjectTask): void {
    this.editingTask = task;
    this.editTaskTitle = task.title;
    this.editTaskDescription = task.description || '';
    this.editTaskPriority = task.priority;
    this.editTaskAssigneeId = task.assigneeId ?? null;
    this.editTaskDueDate = task.dueDate || '';
    this.editTaskMilestoneId = task.milestoneId ?? null;
  }

  saveTaskEdit(): void {
    if (!this.project || !this.editingTask || !this.editTaskTitle.trim()) return;
    const assignee = this.employees.find(e => e.id === this.editTaskAssigneeId);
    this.projectService.updateTask(this.project.id, this.editingTask.id, {
      title: this.editTaskTitle,
      description: this.editTaskDescription || undefined,
      priority: this.editTaskPriority,
      assigneeId: this.editTaskAssigneeId ?? undefined,
      assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : undefined,
      dueDate: this.editTaskDueDate || undefined,
      milestoneId: this.editTaskMilestoneId ?? undefined
    }).subscribe({
      next: (updated) => {
        this.project!.tasks = (this.project!.tasks ?? []).map(t => t.id === updated.id ? updated : t);
        this.rebuildKanbanColumns();
        this.refreshMilestones();
        this.closeTaskEdit();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to save task')
    });
  }

  closeTaskEdit(): void {
    this.editingTask = null;
  }

  private refreshMilestones(): void {
    if (!this.project) return;
    this.projectService.getMilestones(this.project.id).subscribe(milestones => {
      this.milestones = milestones;
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
        next: () => this.refreshMilestones(),
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
  // One form serves both create and edit — editingMilestoneId set means
  // saveMilestone() calls update instead of create.
  saveMilestone(): void {
    if (!this.project || !this.newMilestoneName.trim() || !this.newMilestoneTargetDate) return;
    const payload = {
      name: this.newMilestoneName,
      description: this.newMilestoneDescription || undefined,
      targetDate: this.newMilestoneTargetDate,
      dependsOnMilestoneId: this.newMilestoneDependsOn ?? undefined
    };
    const request$ = this.editingMilestoneId
      ? this.projectService.updateMilestone(this.project.id, this.editingMilestoneId, payload)
      : this.projectService.createMilestone(this.project.id, payload);
    request$.subscribe({
      next: (milestone) => {
        this.milestones = this.editingMilestoneId
          ? this.milestones.map(m => m.id === milestone.id ? milestone : m)
          : [...this.milestones, milestone];
        this.cancelMilestoneEdit();
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to save milestone')
    });
  }

  editMilestone(milestone: Milestone): void {
    this.editingMilestoneId = milestone.id;
    this.newMilestoneName = milestone.name;
    this.newMilestoneDescription = milestone.description || '';
    this.newMilestoneTargetDate = milestone.targetDate;
    this.newMilestoneDependsOn = milestone.dependsOnMilestoneId ?? null;
  }

  cancelMilestoneEdit(): void {
    this.editingMilestoneId = null;
    this.newMilestoneName = '';
    this.newMilestoneDescription = '';
    this.newMilestoneTargetDate = '';
    this.newMilestoneDependsOn = null;
  }

  changeMilestoneStatus(milestone: Milestone, status: MilestoneStatus): void {
    if (!this.project) return;
    const previousStatus = milestone.status;
    this.projectService.updateMilestoneStatus(this.project.id, milestone.id, status).subscribe({
      next: (updated) => {
        this.milestones = this.milestones.map(m => m.id === updated.id ? updated : m);
      },
      error: e => {
        this.notification.onError(e?.error?.message || 'Failed to update milestone status');
        this.milestones = this.milestones.map(m => m.id === milestone.id ? { ...m, status: previousStatus } : m);
      }
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
    const attachment = (milestone.attachments ?? []).find(a => a.id === attachmentId);
    this.projectService.downloadMilestoneAttachment(this.project.id, milestone.id, attachmentId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment?.fileName || `attachment-${attachmentId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notification.onError('Failed to download attachment')
    });
  }

  viewAttachment(milestone: Milestone, attachmentId: number): void {
    if (!this.project) return;
    const attachment = (milestone.attachments ?? []).find(a => a.id === attachmentId);
    if (!attachment) return;
    this.projectService.downloadMilestoneAttachment(this.project.id, milestone.id, attachmentId).subscribe({
      next: (blob: Blob) => {
        if (this.viewerBlobUrl) {
          window.URL.revokeObjectURL(this.viewerBlobUrl);
        }
        this.viewerBlobUrl = window.URL.createObjectURL(blob);
        const contentType = attachment.contentType || '';
        let type: 'pdf' | 'image' | 'other' = 'other';
        let safeSrc: SafeResourceUrl | SafeUrl | null = null;

        if (contentType === 'application/pdf') {
          type = 'pdf';
          safeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(this.viewerBlobUrl);
        } else if (contentType.startsWith('image/')) {
          type = 'image';
          safeSrc = this.sanitizer.bypassSecurityTrustUrl(this.viewerBlobUrl);
        }

        this.viewingAttachment = { milestone, attachment, safeSrc, type };
      },
      error: () => this.notification.onError('Failed to load attachment for viewing')
    });
  }

  closeAttachmentViewer(): void {
    if (this.viewerBlobUrl) {
      window.URL.revokeObjectURL(this.viewerBlobUrl);
      this.viewerBlobUrl = null;
    }
    this.viewingAttachment = null;
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

  // ── Financials ───────────────────────────────────────────────────────────
  // One form serves both add and edit — editingTransactionId set means
  // saveTransaction() calls update instead of create. Reload the whole
  // project afterward so Overview's totalIncome/totalExpenses/profit (which
  // the backend recomputes but doesn't return from these endpoints) stay
  // correct without duplicating that math client-side.
  saveTransaction(): void {
    if (!this.project || !this.txDate || this.txAmount === null || this.txAmount <= 0) return;
    const payload = { date: this.txDate, type: this.txType, amount: this.txAmount, description: this.txDescription || undefined };
    const request$ = this.editingTransactionId
      ? this.projectService.updateTransaction(this.editingTransactionId, payload)
      : this.projectService.addTransaction(this.project.id, payload);
    request$.subscribe({
      next: () => {
        this.cancelTransactionEdit();
        this.load(this.project!.id);
      },
      error: e => this.notification.onError(e?.error?.message || 'Failed to save transaction')
    });
  }

  editTransaction(tx: ProjectTransaction): void {
    this.editingTransactionId = tx.id;
    this.txDate = tx.date;
    this.txType = tx.type;
    this.txAmount = tx.amount;
    this.txDescription = tx.description || '';
  }

  cancelTransactionEdit(): void {
    this.editingTransactionId = null;
    this.txDate = '';
    this.txType = 'INCOME';
    this.txAmount = null;
    this.txDescription = '';
  }

  deleteTransactionRow(tx: ProjectTransaction): void {
    if (!this.project) return;
    this.projectService.deleteTransaction(tx.id).subscribe({
      next: () => this.load(this.project!.id),
      error: e => this.notification.onError(e?.error?.message || 'Failed to delete transaction')
    });
  }
}
