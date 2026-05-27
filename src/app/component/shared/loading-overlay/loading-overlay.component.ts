// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoadingService } from '../../../service/loading.service';

@Component({
  standalone: false,
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingOverlayComponent {
  readonly loading$ = this.loadingService.loading$;
  constructor(private loadingService: LoadingService) {}
}
