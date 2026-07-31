// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { map } from 'rxjs/operators';
import { LoadingService } from '../../../service/loading.service';
import { BrandingService } from '../../../service/branding.service';

const DEFAULT_LOGO = 'assets/logo_icon.png';

@Component({
  standalone: false,
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingOverlayComponent {
  readonly loading$ = this.loadingService.loading$;

  /** The tenant's own logo once branding loads, falling back to the platform icon. */
  readonly logoSrc$ = this.branding.branding$.pipe(
    map(b => b?.logoUrl || DEFAULT_LOGO)
  );

  constructor(private loadingService: LoadingService, private branding: BrandingService) {}

  onLogoError(event: Event): void {
    (event.target as HTMLImageElement).src = DEFAULT_LOGO;
  }
}
