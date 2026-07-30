// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface StatCard {
  label: string;
  value: number;
  icon: string;
  iconClass?: string;
  bgClass?: string;
  route?: string;
  suffix?: string;
}

@Component({
  standalone: false,
  selector: 'app-stats-cards',
  template: `
    <div class="stats-grid">
      <div *ngFor="let stat of stats"
           class="stat-card"
           [ngClass]="stat.bgClass"
           [routerLink]="stat.route"
           [style.cursor]="stat.route ? 'pointer' : 'default'">
        <div class="stat-icon" [ngClass]="stat.iconClass">
          <i class="bi" [ngClass]="stat.icon"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ stat.value | number }}
            <span *ngIf="stat.suffix">{{ stat.suffix }}</span>
          </div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      border: 1px solid #f0f0f0;
    }

    .stat-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;
    }

    .stat-icon.success {
      background: linear-gradient(135deg, #7DA0FA 0%, #4B49AC 100%);
      color: white;
    }

    .stat-icon.warning {
      background: linear-gradient(135deg, #FFD93D 0%, #F7971E 100%);
      color: white;
    }

    .stat-icon.danger {
      background: linear-gradient(135deg, #F3797E 0%, #E84A5F 100%);
      color: white;
    }

    .stat-icon.info {
      background: linear-gradient(135deg, #98BDFF 0%, #7978E9 100%);
      color: white;
    }

    .stat-icon.primary {
      background: linear-gradient(135deg, #4B49AC 0%, #2A2968 100%);
      color: white;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.25rem;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.95rem;
      color: #7f8c8d;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-value {
        font-size: 1.75rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsCardsComponent {
  @Input() stats: StatCard[] = [];
}
