import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, map, startWith, catchError, of } from 'rxjs';
import { DataState } from 'src/app/enum/datastate.enum';
import { CustomHttpResponse } from 'src/app/interface/appstates';
import { Page } from 'src/app/interface/appstates';
import { State } from 'src/app/interface/state';
import { AssetAssignment, AssetCondition, AssetReturnForm, AssignmentStatus } from 'src/app/interface/asset';
import { AssetService } from 'src/app/service/asset.service';
import { NotificationService } from 'src/app/service/notification.service';

@Component({
  selector: 'app-asset-assignments',
  templateUrl: './asset-assignments.component.html',
  styleUrls: ['./asset-assignments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetAssignmentsComponent implements OnInit {
  assignmentsState$: Observable<State<CustomHttpResponse<Page<AssetAssignment>>>>;
  private dataSubject = new BehaviorSubject<CustomHttpResponse<Page<AssetAssignment>>>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private currentPageSubject = new BehaviorSubject<number>(0);
  currentPage$ = this.currentPageSubject.asObservable();
  readonly DataState = DataState;
  readonly conditions = Object.values(AssetCondition);

  showActiveOnly = false;
  showReturnModal = false;
  selectedAssignment: AssetAssignment | null = null;
  returnCondition: AssetCondition = AssetCondition.GOOD;
  returnNotes = '';
  currentUser: any;

  constructor(
    private router: Router,
    private assetService: AssetService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    const observable = this.showActiveOnly
      ? this.assetService.getActiveAssignments(0, 10)
      : this.assetService.getAllAssignments(0, 10);

    this.assignmentsState$ = observable
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

  toggleActiveOnly(): void {
    this.showActiveOnly = !this.showActiveOnly;
    this.currentPageSubject.next(0);
    this.loadAssignments();
  }

  goToPage(pageNumber: number): void {
    const observable = this.showActiveOnly
      ? this.assetService.getActiveAssignments(pageNumber, 10)
      : this.assetService.getAllAssignments(pageNumber, 10);

    this.assignmentsState$ = observable
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

  viewAsset(assetId: number): void {
    this.router.navigate(['/assets', assetId]);
  }

  openReturnModal(assignment: AssetAssignment): void {
    this.selectedAssignment = assignment;
    this.returnCondition = AssetCondition.GOOD;
    this.returnNotes = '';
    this.showReturnModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showReturnModal = false;
    this.selectedAssignment = null;
    this.cdr.markForCheck();
  }

  processReturn(): void {
    if (!this.selectedAssignment) return;

    const form: AssetReturnForm = {
      assignmentId: this.selectedAssignment.id,
      returnedToId: this.currentUser?.id,
      returnedToName: `${this.currentUser?.firstName} ${this.currentUser?.lastName}`,
      conditionOnReturn: this.returnCondition,
      notes: this.returnNotes || undefined
    };

    this.isLoadingSubject.next(true);
    this.assetService.returnAsset(form).subscribe({
      next: () => {
        this.notification.onSuccess('Asset returned successfully');
        this.isLoadingSubject.next(false);
        this.closeModal();
        this.loadAssignments();
      },
      error: (error) => {
        this.notification.onError(error);
        this.isLoadingSubject.next(false);
      }
    });
  }

  getAssignments(state: any): AssetAssignment[] {
    const data = state?.appData?.data || state?.data;
    if (!data) return [];
    if (data.page?.content) return data.page.content;
    if (Array.isArray(data)) return data;
    return [];
  }

  hasAssignments(state: any): boolean {
    return this.getAssignments(state).length > 0;
  }

  getTotalPages(state: any): number {
    return state?.appData?.data?.page?.totalPages || 0;
  }

  getStatusClass(status: AssignmentStatus): string {
    const classes: { [key: string]: string } = {
      'ACTIVE': 'bg-success',
      'RETURNED': 'bg-secondary',
      'OVERDUE': 'bg-warning text-dark',
      'LOST': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private getCurrentUser(): any {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch {
      return null;
    }
  }
}
