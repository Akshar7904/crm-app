// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Project, ProjectPage, ProjectStats, ProjectTask, TaskComment, ProjectTransaction, TaskStatus, Milestone, MilestoneStatus } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {

  private readonly base = `${environment.apiUrl}/api/v1/projects`;

  constructor(private http: HttpClient) {}

  // ── Projects ───────────────────────────────────────────────────────────
  search(params: { page?: number; size?: number; term?: string }): Observable<{ page: ProjectPage; stats: ProjectStats }> {
    let p = new HttpParams();
    if (params.page !== undefined) p = p.set('page', params.page);
    if (params.size !== undefined) p = p.set('size', params.size);
    const url = params.term ? `${this.base}/search` : this.base;
    if (params.term) p = p.set('term', params.term);
    return this.http.get<any>(url, { params: p }).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Project> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data.project));
  }

  create(project: Partial<Project>): Observable<Project> {
    return this.http.post<any>(this.base, project).pipe(map(r => r.data.project));
  }

  update(id: number, project: Partial<Project>): Observable<Project> {
    return this.http.put<any>(`${this.base}/${id}`, project).pipe(map(r => r.data.project));
  }

  updateStatus(id: number, status: string): Observable<Project> {
    return this.http.post<any>(`${this.base}/${id}/status`, null, { params: { status } }).pipe(map(r => r.data.project));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${id}`).pipe(map(() => undefined));
  }

  getCustomers(): Observable<any[]> {
    // Backend returns a Spring Data Page ({content, totalElements, ...}), not a bare array —
    // unwrap .content so callers get a plain array as the Observable<any[]> signature promises.
    return this.http.get<any>(`${this.base}/customers`).pipe(map(r => r.data.customers.content));
  }

  // ── Tasks ──────────────────────────────────────────────────────────────
  getTasks(projectId: number): Observable<ProjectTask[]> {
    return this.http.get<any>(`${this.base}/${projectId}/tasks`).pipe(map(r => r.data.tasks));
  }

  createTask(projectId: number, task: Partial<ProjectTask>): Observable<ProjectTask> {
    return this.http.post<any>(`${this.base}/${projectId}/tasks`, task).pipe(map(r => r.data.task));
  }

  updateTask(projectId: number, taskId: number, task: Partial<ProjectTask>): Observable<ProjectTask> {
    return this.http.put<any>(`${this.base}/${projectId}/tasks/${taskId}`, task).pipe(map(r => r.data.task));
  }

  updateTaskStatus(projectId: number, taskId: number, status: TaskStatus): Observable<ProjectTask> {
    return this.http.put<any>(`${this.base}/${projectId}/tasks/${taskId}/status`, null, { params: { status } }).pipe(map(r => r.data.task));
  }

  deleteTask(projectId: number, taskId: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${projectId}/tasks/${taskId}`).pipe(map(() => undefined));
  }

  getMyTasks(): Observable<ProjectTask[]> {
    return this.http.get<any>(`${this.base}/my-tasks`).pipe(map(r => r.data.tasks));
  }

  // ── Comments ───────────────────────────────────────────────────────────
  getComments(projectId: number, taskId: number): Observable<TaskComment[]> {
    return this.http.get<any>(`${this.base}/${projectId}/tasks/${taskId}/comments`).pipe(map(r => r.data.comments));
  }

  addComment(projectId: number, taskId: number, body: string): Observable<TaskComment> {
    return this.http.post<any>(`${this.base}/${projectId}/tasks/${taskId}/comments`, { body }).pipe(map(r => r.data.comment));
  }

  // ── Financials ─────────────────────────────────────────────────────────
  addTransaction(projectId: number, tx: Partial<ProjectTransaction>): Observable<ProjectTransaction> {
    return this.http.post<any>(`${this.base}/${projectId}/transactions`, tx).pipe(map(r => r.data.transaction));
  }

  deleteTransaction(transactionId: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/transactions/${transactionId}`).pipe(map(() => undefined));
  }

  // ── Milestones ────────────────────────────────────────────────────────
  getMilestones(projectId: number): Observable<Milestone[]> {
    return this.http.get<any>(`${this.base}/${projectId}/milestones`).pipe(map(r => r.data.milestones));
  }

  createMilestone(projectId: number, milestone: Partial<Milestone>): Observable<Milestone> {
    return this.http.post<any>(`${this.base}/${projectId}/milestones`, milestone).pipe(map(r => r.data.milestone));
  }

  updateMilestone(projectId: number, milestoneId: number, milestone: Partial<Milestone>): Observable<Milestone> {
    return this.http.put<any>(`${this.base}/${projectId}/milestones/${milestoneId}`, milestone).pipe(map(r => r.data.milestone));
  }

  updateMilestoneStatus(projectId: number, milestoneId: number, status: MilestoneStatus): Observable<Milestone> {
    return this.http.put<any>(`${this.base}/${projectId}/milestones/${milestoneId}/status`, null, { params: { status } }).pipe(map(r => r.data.milestone));
  }

  deleteMilestone(projectId: number, milestoneId: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${projectId}/milestones/${milestoneId}`).pipe(map(() => undefined));
  }

  // ── Milestone Attachments ──────────────────────────────────────────────
  uploadMilestoneAttachment(projectId: number, milestoneId: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.base}/${projectId}/milestones/${milestoneId}/attachments`, form).pipe(map(r => r.data.attachment));
  }

  downloadMilestoneAttachment(projectId: number, milestoneId: number, attachmentId: number): Observable<Blob> {
    return this.http.get(`${this.base}/${projectId}/milestones/${milestoneId}/attachments/${attachmentId}`, { responseType: 'blob' });
  }

  deleteMilestoneAttachment(projectId: number, milestoneId: number, attachmentId: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${projectId}/milestones/${milestoneId}/attachments/${attachmentId}`).pipe(map(() => undefined));
  }
}
