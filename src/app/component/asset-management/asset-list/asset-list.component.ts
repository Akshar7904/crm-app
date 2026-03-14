import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { NgForm } from '@angular/forms';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse } from 'src/app/interface/appstates';
import { Page } from 'src/app/interface/appstates';
import { State } from 'src/app/interface/state';
import { Asset, AssetCategory, AssetStatus } from 'src/app/interface/asset';
import { AssetService } from 'src/app/service/asset.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  standalone: false,
  selector: 'app-asset-list',
  templateUrl: './asset-list.component.html',
  styleUrls: ['./asset-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetListComponent implements OnInit {
  assetsState$: Observable<State<CustomHttpResponse<Page<Asset>>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<Page<Asset>>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();
  readonly DataState = DataState;
  readonly AssetCategory = AssetCategory;
  readonly AssetStatus = AssetStatus;

  selectedCategory: AssetCategory | '' = '';
  selectedStatus: AssetStatus | '' = '';

  constructor(
    private router: Router,
    private assetService: AssetService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.assetsState$ = this.assetService.getAllAssets(0, 10)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADING }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  searchAssets(searchForm: NgForm): void {
    this.currentPageSubject.next(0);
    const query = searchForm.value.query || '';

    this.assetsState$ = this.assetService.searchAssets(query, 0, 10)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  filterByCategory(category: AssetCategory | ''): void {
    this.selectedCategory = category;
    this.currentPageSubject.next(0);

    if (!category) {
      this.loadAssets();
      return;
    }

    this.assetsState$ = this.assetService.getAssetsByCategory(category, 0, 10)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  filterByStatus(status: AssetStatus | ''): void {
    this.selectedStatus = status;
    this.currentPageSubject.next(0);

    if (!status) {
      this.loadAssets();
      return;
    }

    this.assetsState$ = this.assetService.getAssetsByStatus(status, 0, 10)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.ERROR, error });
        })
      );
  }

  goToPage(pageNumber: number): void {
    this.assetsState$ = this.assetService.getAllAssets(pageNumber, 10)
      .pipe(
        map(response => {
          this.notification.onDefault(response.message);
          this.dataSubject.next(response);
          this.currentPageSubject.next(pageNumber);
          return { dataState: DataState.LOADED, appData: response };
        }),
        startWith({ dataState: DataState.LOADED, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notification.onError(error);
          return of({ dataState: DataState.LOADED, error, appData: this.dataSubject.value });
        })
      );
  }

  goToNextOrPreviousPage(direction: string): void {
    this.goToPage(
      direction === 'forward' ? this.currentPageSubject.value + 1 : this.currentPageSubject.value - 1
    );
  }

  selectAsset(asset: Asset): void {
    this.router.navigate(['/assets', asset.id]);
  }

  addNewAsset(): void {
    this.router.navigate(['/assets/new']);
  }

  editAsset(asset: Asset, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/assets/edit', asset.id]);
  }

  assignAsset(asset: Asset, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/assets/assign', asset.id]);
  }

  deleteAsset(asset: Asset, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Are you sure you want to delete asset "${asset.name}" (${asset.assetTag})?`)) {
      return;
    }

    this.isLoadingSubject.next(true);
    this.assetService.deleteAsset(asset.id).subscribe({
      next: (response) => {
        this.notification.onSuccess('Asset deleted successfully');
        this.isLoadingSubject.next(false);
        this.loadAssets();
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  getAssets(state: any): Asset[] {
    const data = state?.appData?.data || state?.data;
    if (!data) return [];
    if (data.page?.content) return data.page.content;
    if (Array.isArray(data)) return data;
    return [];
  }

  hasAssets(state: any): boolean {
    return this.getAssets(state).length > 0;
  }

  getTotalPages(state: any): number {
    return state?.appData?.data?.page?.totalPages || 0;
  }

  getStatusClass(status: AssetStatus): string {
    const classes: { [key: string]: string } = {
      'AVAILABLE': 'badge-soft-success',
      'ASSIGNED': 'badge-soft-primary',
      'RESERVED': 'badge-soft-info',
      'UNDER_MAINTENANCE': 'badge-soft-warning',
      'RETIRED': 'badge-soft-secondary',
      'LOST': 'badge-soft-danger',
      'DAMAGED': 'badge-soft-danger'
    };
    return classes[status] || 'badge-soft-secondary';
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

  trackById(index: number, item: any): any { return item?.id ?? index; }
  trackByValue(index: number, value: any): any { return value ?? index; }
  trackByIndex(index: number, _item: any): number { return index; }
}
