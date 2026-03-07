import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse } from 'src/app/interface/appstates';
import { Page } from 'src/app/interface/appstates';
import { State } from 'src/app/interface/state';
import { Asset, AssetAssignment, AssetCategory, AssetStatus } from 'src/app/interface/asset';
import { AssetService } from 'src/app/service/asset.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  selector: 'app-asset-detail',
  templateUrl: './asset-detail.component.html',
  styleUrls: ['./asset-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetDetailComponent implements OnInit {
  assetState$: Observable<State<CustomHttpResponse<Asset>>>;
  assignmentsState$: Observable<State<CustomHttpResponse<Page<AssetAssignment>>>>;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  readonly DataState = DataState;
  assetId: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assetService: AssetService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.assetId = this.route.snapshot.params['id'];
    this.loadAsset();
    this.loadAssignmentHistory();
  }

  loadAsset(): void {
    this.assetState$ = this.assetService.getAssetById(this.assetId)
      .pipe(
        map(response => {
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  loadAssignmentHistory(): void {
    this.assignmentsState$ = this.assetService.getAssignmentsByAsset(this.assetId, 0, 10)
      .pipe(
        map(response => {
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  editAsset(): void {
    this.router.navigate(['/assets/edit', this.assetId]);
  }

  assignAsset(): void {
    this.router.navigate(['/assets/assign', this.assetId]);
  }

  deleteAsset(): void {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    this.isLoadingSubject.next(true);
    this.assetService.deleteAsset(this.assetId).subscribe({
      next: () => {
        this.notification.onSuccess('Asset deleted successfully');
        this.router.navigate(['/assets']);
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  updateStatus(status: AssetStatus): void {
    this.isLoadingSubject.next(true);
    this.assetService.updateAssetStatus(this.assetId, status).subscribe({
      next: () => {
        this.notification.onSuccess(`Asset status updated to ${status}`);
        this.isLoadingSubject.next(false);
        this.loadAsset();
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/assets']);
  }

  getStatusClass(status: AssetStatus): string {
    const classes: { [key: string]: string } = {
      'AVAILABLE': 'bg-success',
      'ASSIGNED': 'bg-primary',
      'RESERVED': 'bg-info',
      'UNDER_MAINTENANCE': 'bg-warning',
      'RETIRED': 'bg-secondary',
      'LOST': 'bg-danger',
      'DAMAGED': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
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

  formatCurrency(amount: number): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }

  getAssignments(state: any): AssetAssignment[] {
    const data = state?.appData?.data || state?.data;
    if (!data) return [];
    if (data.page?.content) return data.page.content;
    if (Array.isArray(data)) return data;
    return [];
  }
}
