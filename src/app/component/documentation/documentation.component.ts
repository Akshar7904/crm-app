import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../../service/user.service';

@Component({
  standalone: false,
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss']
})
export class DocumentationComponent implements OnInit, OnDestroy {
  activeTab: 'admin' | 'user' = 'user';
  today = new Date();
  isAdmin = false;

  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.profile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const role = res?.data?.user?.roleName;
          this.isAdmin = ['ROLE_ADMIN', 'ROLE_SYSADMIN', 'ROLE_MANAGER'].includes(role);
          // Admins default to admin guide; employees stay on user guide
          this.activeTab = this.isAdmin ? 'admin' : 'user';
        },
        error: () => {
          // If profile fails, default to user guide (safe fallback)
          this.activeTab = 'user';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: 'admin' | 'user'): void {
    // Only admins can switch to the admin tab
    if (tab === 'admin' && !this.isAdmin) return;
    this.activeTab = tab;
  }

  downloadPdf(): void {
    window.print();
  }
}
