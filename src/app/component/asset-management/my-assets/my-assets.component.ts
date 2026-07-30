// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse } from 'src/app/interface/appstates';
import { State } from 'src/app/interface/state';
import { AssetAssignment, AssetCategory } from 'src/app/interface/asset';
import { AssetService } from 'src/app/service/asset.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  standalone: false,
  selector: 'app-my-assets',
  templateUrl: './my-assets.component.html',
  styleUrls: ['./my-assets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyAssetsComponent implements OnInit {
  assetsState$: Observable<State<CustomHttpResponse<AssetAssignment[]>>>;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  readonly DataState = DataState;

  constructor(
    private assetService: AssetService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMyAssets();
  }

  loadMyAssets(): void {
    this.assetsState$ = this.assetService.getMyAssets()
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  acknowledgeAsset(assignment: AssetAssignment): void {
    if (assignment.acknowledged) {
      return;
    }

    this.isLoadingSubject.next(true);
    this.assetService.acknowledgeAsset(assignment.id).subscribe({
      next: () => {
        this.notification.onSuccess('Asset acknowledged successfully');
        this.isLoadingSubject.next(false);
        this.loadMyAssets();
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  getAssets(state: any): AssetAssignment[] {
    const data = state?.appData?.data;
    if (!data) return [];
    if (Array.isArray(data.assignments)) return data.assignments;
    if (Array.isArray(data)) return data;
    return [];
  }

  hasAssets(state: any): boolean {
    return this.getAssets(state).length > 0;
  }

  getCategoryIcon(category: AssetCategory): string {
    const icons: { [key: string]: string } = {
      'LAPTOP': 'bi-laptop',
      'DESKTOP': 'bi-pc-display',
      'TABLET': 'bi-tablet',
      'PHONE': 'bi-phone',
      'MONITOR': 'bi-display',
      'KEYBOARD': 'bi-keyboard',
      'MOUSE': 'bi-mouse',
      'HEADSET': 'bi-headset',
      'PRINTER': 'bi-printer',
      'SCANNER': 'bi-upc-scan',
      'PROJECTOR': 'bi-projector',
      'CAMERA': 'bi-camera',
      'FURNITURE': 'bi-lamp',
      'VEHICLE': 'bi-car-front',
      'SOFTWARE_LICENSE': 'bi-key',
      'OTHER': 'bi-box'
    };
    return icons[category] || 'bi-box';
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
