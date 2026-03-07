import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse } from 'src/app/interface/appstates';
import { Page } from 'src/app/interface/appstates';
import { State } from 'src/app/interface/state';
import { AssetRequest, AssetRequestStatus } from 'src/app/interface/asset';
import { AssetService } from 'src/app/service/asset.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  selector: 'app-my-requests',
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyRequestsComponent implements OnInit {
  requestsState$: Observable<State<CustomHttpResponse<Page<AssetRequest>>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<Page<AssetRequest>>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();
  readonly DataState = DataState;

  constructor(
    private router: Router,
    private assetService: AssetService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMyRequests();
  }

  loadMyRequests(): void {
    this.requestsState$ = this.assetService.getMyRequests(0, 10)
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

  goToPage(pageNumber: number): void {
    this.requestsState$ = this.assetService.getMyRequests(pageNumber, 10)
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

  cancelRequest(request: AssetRequest): void {
    if (request.status !== 'PENDING') {
      this.notification.onError('Only pending requests can be cancelled');
      return;
    }

    if (!confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    this.isLoadingSubject.next(true);
    this.assetService.cancelRequest(request.id).subscribe({
      next: () => {
        this.notification.onSuccess('Request cancelled successfully');
        this.isLoadingSubject.next(false);
        this.loadMyRequests();
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  newRequest(): void {
    this.router.navigate(['/assets/request']);
  }

  getRequests(state: any): AssetRequest[] {
    const data = state?.appData?.data || state?.data;
    if (!data) return [];
    if (data.page?.content) return data.page.content;
    if (Array.isArray(data)) return data;
    return [];
  }

  hasRequests(state: any): boolean {
    return this.getRequests(state).length > 0;
  }

  getTotalPages(state: any): number {
    return state?.appData?.data?.page?.totalPages || 0;
  }

  getStatusClass(status: AssetRequestStatus): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'bg-warning text-dark',
      'APPROVED': 'bg-info',
      'REJECTED': 'bg-danger',
      'CANCELLED': 'bg-secondary',
      'FULFILLED': 'bg-success'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusIcon(status: AssetRequestStatus): string {
    const icons: { [key: string]: string } = {
      'PENDING': 'bi-hourglass-split',
      'APPROVED': 'bi-check-circle',
      'REJECTED': 'bi-x-circle',
      'CANCELLED': 'bi-slash-circle',
      'FULFILLED': 'bi-check-circle-fill'
    };
    return icons[status] || 'bi-circle';
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
