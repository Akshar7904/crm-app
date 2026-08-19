// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../services/project.service';
import { Project, ProjectStats } from '../models/project.model';

@Component({
  standalone: false,
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  stats: ProjectStats | null = null;
  loading = false;
  page = 0;
  totalPages = 0;
  term = '';

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.projectService.search({ page: this.page, size: 20, term: this.term || undefined }).subscribe({
      next: (result) => {
        this.projects = result.page.content;
        this.totalPages = result.page.totalPages;
        this.stats = result.stats;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch(term: string): void {
    this.term = term;
    this.page = 0;
    this.load();
  }

  goToPage(page: number): void {
    this.page = page;
    this.load();
  }

  openProject(id: number): void {
    this.router.navigate(['/projects', id]);
  }

  newProject(): void {
    this.router.navigate(['/projects/new']);
  }
}
