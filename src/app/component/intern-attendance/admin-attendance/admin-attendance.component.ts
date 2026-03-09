import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { UserService } from '../../../service/user.service';
import { InternAttendanceService } from '../../../service/intern-attendance.service';
import { InternAttendance } from '../../../interface/intern-attendance';

@Component({
  selector: 'app-admin-intern-attendance',
  templateUrl: './admin-attendance.component.html',
  styleUrls: ['./admin-attendance.component.scss']
})
export class AdminInternAttendanceComponent implements OnInit {
  attendances: InternAttendance[] = [];
  activeTab = 'all';
  searchQuery = '';
  loading = false;
  currentUser: any = null;

  selectedAttendance: InternAttendance | null = null;
  showApproveModal = false;
  showRejectModal = false;
  approvalForm: FormGroup;
  processing = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private userService: UserService,
    private internAttendanceService: InternAttendanceService
  ) {
    this.approvalForm = this.fb.group({
      remarks: [''],
      rejectionReason: ['']
    });
  }

  ngOnInit(): void {
    this.userService.profile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.currentUser = res?.data?.user || res?.data || res;
          this.loadAll();
        },
        error: () => this.loadAll()
      });
  }

  loadAll(): void {
    this.loading = true;
    this.internAttendanceService.getAll(0, 100).subscribe({
      next: res => {
        this.attendances = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get filteredAttendances(): InternAttendance[] {
    let list = this.attendances;
    if (this.activeTab !== 'all') {
      list = list.filter(a => a.status === this.activeTab);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(a =>
        (a.employeeName || '').toLowerCase().includes(q) ||
        (a.institutionName || '').toLowerCase().includes(q) ||
        (a.subjectOrModule || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get totalCount(): number { return this.attendances.length; }
  get pendingCount(): number { return this.attendances.filter(a => a.status === 'PENDING').length; }
  get approvedCount(): number { return this.attendances.filter(a => a.status === 'APPROVED').length; }

  openApproveModal(item: InternAttendance): void {
    this.selectedAttendance = item;
    this.approvalForm.reset();
    this.showApproveModal = true;
  }

  openRejectModal(item: InternAttendance): void {
    this.selectedAttendance = item;
    this.approvalForm.reset();
    this.showRejectModal = true;
  }

  closeModals(): void {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.selectedAttendance = null;
  }

  confirmApprove(): void {
    if (!this.selectedAttendance?.id || !this.currentUser?.id) return;
    this.processing = true;
    this.internAttendanceService.approve({
      attendanceId: this.selectedAttendance.id,
      approvedBy: this.currentUser.id,
      status: 'APPROVED',
      remarks: this.approvalForm.get('remarks')?.value
    }).subscribe({
      next: () => {
        this.processing = false;
        this.closeModals();
        this.loadAll();
      },
      error: () => { this.processing = false; }
    });
  }

  confirmReject(): void {
    if (!this.selectedAttendance?.id || !this.currentUser?.id) return;
    this.processing = true;
    this.internAttendanceService.reject({
      attendanceId: this.selectedAttendance.id,
      approvedBy: this.currentUser.id,
      status: 'REJECTED',
      rejectionReason: this.approvalForm.get('rejectionReason')?.value,
      remarks: this.approvalForm.get('remarks')?.value
    }).subscribe({
      next: () => {
        this.processing = false;
        this.closeModals();
        this.loadAll();
      },
      error: () => { this.processing = false; }
    });
  }

  deleteRecord(id: number): void {
    if (!confirm('Delete this attendance request? This cannot be undone.')) return;
    this.http.delete<any>(`${environment.apiUrl}/api/v1/intern-attendance/${id}`).subscribe({
      next: () => this.loadAll(),
      error: () => {}
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED':  return 'badge-soft-success';
      case 'PENDING':   return 'badge-soft-warning';
      case 'REJECTED':  return 'badge-soft-danger';
      case 'CANCELLED': return 'badge-soft-secondary';
      default: return 'badge-soft-secondary';
    }
  }
}
